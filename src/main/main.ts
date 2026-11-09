import { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, powerMonitor, screen, session, Notification, type IpcMainInvokeEvent } from 'electron';
import { existsSync } from 'node:fs';
import { autoUpdater } from 'electron-updater';
import { Updates } from './updates';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { Engine } from '../domain/engine';
import { JsonStore, Store } from './store';
import { applyWorkPlanChange, validateWorkPlanData, type WorkPlanData, type WorkPlanView } from '../domain/work-plans';
import { visibleBounds } from './bounds';
import { workspaceOptions, menuBarTitle } from './platform';
import { defaultSettings, validateSettings, MODE_NAMES, RULE_INFO, type Command, type Snapshot, type Settings, type ActivityEvent, type RuleId, type PersistedState } from '../shared';

app.setName('息间');
const isMac = process.platform === 'darwin';
if (isMac) app.setPath('userData', path.join(app.getPath('appData'), '息间'));
app.disableHardwareAcceleration();
if (process.env.XIJIAN_DATA_DIR) app.setPath('userData', path.resolve(process.env.XIJIAN_DATA_DIR));
const testMode = process.env.XIJIAN_TEST === '1' && !app.isPackaged;
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

let engine: Engine;
let store: Store;
let workStore: JsonStore<WorkPlanData>;
let workPlans: WorkPlanData;
let workWrites: Promise<unknown> = Promise.resolve();
let widget: BrowserWindow;
let reminder: BrowserWindow | undefined;
let settingsWindow: BrowserWindow | undefined;
let workWindow: BrowserWindow | undefined;
let updates: Updates;
let preparingUpdate = false;
let tray: Tray | undefined;
let position: { x: number; y: number } | undefined;
let quitting = false;
let savedForQuit = false;
let storageError: string | null = null;
let events: ActivityEvent[] = [];
let lastTick = performance.now();
let lastSound = -Infinity;
let previousAlert = 0;
let settingsReady = false;
let reminderReady = false;
let commandQueue: Promise<unknown> = Promise.resolve();
let lastTrayText = '';
let lastTrayTitle = '';
let lastMenuKey = '';
const uiFile = path.join(__dirname, 'index.html');
const allWindows = () => [widget, reminder, settingsWindow, workWindow].filter((w): w is BrowserWindow => !!w && !w.isDestroyed());
const areas = () => screen.getAllDisplays().map(d => d.workArea);
const widgetSize = () => engine.settings.compact ? { width: 232, height: 68 } : { width: 320, height: 462 };
const state = (): Snapshot => ({ ...engine.snapshot(), storageError, recovered: store.recovered, update: updates?.snapshot() });
const savedState = (): PersistedState => ({ ...engine.serialize(), position });

async function persist() {
  events.push(...engine.drainEvents());
  const batch = events.splice(0);
  try {
    await store.save(savedState());
    await store.appendEvents(batch);
    storageError = null;
  } catch (error) {
    events.unshift(...batch);
    storageError = error instanceof Error ? error.message : '本地保存失败';
    if (events.length > 5000) events = events.slice(-5000);
  }
}
function secure(win: BrowserWindow) {
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.webContents.on('will-attach-webview', event => event.preventDefault());
}
function makeWindow(view: string, size: { width: number; height: number }, transparent = true) {
  const win = new BrowserWindow({
    ...visibleBounds(undefined, size, areas()), show: false, frame: false, transparent,
    backgroundColor: transparent ? '#00000000' : '#FDFCF8', resizable: false, maximizable: false,
    fullscreenable: false, hasShadow: false, skipTaskbar: !isMac && (view === 'widget' || view === 'reminder'),
    title: ({ settings: '息间 · 设置', reminder: '息间 · 休息一下', 'work-plans': '息间 · 工作计划' } as Record<string, string>)[view] ?? '息间',
    icon: path.join(app.getAppPath(), 'assets', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' }
  });
  secure(win);
  const workspace = workspaceOptions(process.platform, view);
  if (workspace) win.setVisibleOnAllWorkspaces(true, workspace);
  void win.loadFile(uiFile, { query: { view } });
  return win;
}
function showWidget() { if (widget && !widget.isDestroyed()) { if (widget.isMinimized()) widget.restore(); widget.show(); widget.focus(); publish(); } }
function fitWidget() {
  if (!widget || widget.isDestroyed()) return;
  const p = widget.getPosition();
  widget.setBounds(visibleBounds({ x: p[0], y: p[1] }, widgetSize(), areas()));
  widget.setAlwaysOnTop(engine.settings.alwaysOnTop, 'floating');
}
function openSettings() {
  if (settingsWindow && !settingsWindow.isDestroyed()) { settingsWindow.show(); return; }
  settingsReady = false;
  settingsWindow = makeWindow('settings', { width: 720, height: 742 });
  settingsWindow.once('ready-to-show', () => { settingsReady = true; settingsWindow?.show(); publish(); });
  settingsWindow.on('closed', () => { settingsWindow = undefined; settingsReady = false; });
}
function openWorkPlans() {
  if (workWindow && !workWindow.isDestroyed()) { workWindow.show(); return; }
  workWindow = makeWindow('work-plans', { width: 520, height: 640 });
  workWindow.once('ready-to-show', () => workWindow?.show());
  workWindow.on('closed', () => { workWindow = undefined; });
}

function workPlanView(): WorkPlanView {
  return { items: workPlans.items, readOnlyReason: workStore.readOnlyReason };
}

function changeWorkPlan(change: unknown): Promise<WorkPlanView> {
  if (quitting || preparingUpdate) return Promise.reject(new Error('息间正在退出或安装更新'));
  const job = workWrites.catch(() => {}).then(async () => {
    if (workStore.readOnlyReason) throw new Error(workStore.readOnlyReason);
    const next = applyWorkPlanChange(workPlans, change);
    try {
      await workStore.save(next);
    } catch {
      throw new Error('工作计划保存失败，请检查本机存储后重试');
    }
    workPlans = next;
    return workPlanView();
  });
  workWrites = job;
  return job;
}
function ensureReminder() {
  if (reminder && !reminder.isDestroyed()) return;
  reminderReady = false;
  reminder = makeWindow('reminder', { width: 360, height: 450 });
  reminder.setAlwaysOnTop(true, 'floating');
  reminder.once('ready-to-show', () => { reminderReady = true; publish(); });
  reminder.on('close', event => { if (!quitting) { event.preventDefault(); engine.collapseCard(); reminder?.hide(); publish(); } });
  reminder.on('closed', () => { reminder = undefined; reminderReady = false; });
}
function placeReminder(s: Snapshot) {
  if (!reminder || reminder.isDestroyed()) return;
  const count = s.occurrences.length + (s.notice ? 1 : 0);
  const size = { width: 360, height: Math.min(660, 170 + count * 220) };
  const w = widget.getBounds();
  const area = screen.getDisplayMatching(w).workArea;
  const p = { x: w.x >= area.x + area.width / 2 ? w.x - size.width - 8 : w.x + w.width + 8, y: w.y };
  const next = visibleBounds(p, size, areas());
  const old = reminder.getBounds();
  if (old.width !== next.width || old.height !== next.height || !reminder.isVisible()) reminder.setBounds(next);
}
function trayMenu() {
  return Menu.buildFromTemplate([
    { label: '打开息间', click: showWidget },
    { label: '工作计划', click: openWorkPlans },
    { label: engine.runtime.focus.status === 'running' ? '暂停计时' : '开始 / 继续计时', click: () => fromTray({ type: engine.runtime.focus.status === 'running' ? 'focus.pause' : 'focus.start' }) },
    { type: 'separator' },
    { label: '健康提醒', type: 'checkbox', checked: engine.settings.healthEnabled, click: item => fromTray({ type: 'health.toggle', enabled: item.checked }) },
    { label: engine.runtime.quietUntil ? '恢复健康提醒' : '会议中 · 暂停提醒30分钟', click: () => fromTray({ type: 'meeting.toggle' }) },
    { label: '始终置顶', type: 'checkbox', checked: engine.settings.alwaysOnTop, click: () => fromTray({ type: 'window.pin' }) },
    { label: '切换迷你模式', click: () => fromTray({ type: 'window.compact' }) },
    { label: '设置', click: openSettings },
    { label: updateMenuLabel(), enabled: !!updates && !['manual', 'checking', 'downloading', 'installing'].includes(updates.snapshot().phase), click: () => void updates.perform() },
    { type: 'separator' },
    { label: isMac ? '隐藏组件 · 保留菜单栏计时' : '隐藏到托盘', click: () => widget.hide() },
    { label: '退出息间', click: () => app.quit() }
  ]);
}
function publish() {
  if (!engine || !widget || widget.isDestroyed() || quitting) return;
  const s = state();
  for (const win of allWindows()) if (win !== workWindow && win.isVisible() && !win.webContents.isLoadingMainFrame()) win.webContents.send('xijian:state', s);
  if (s.cardVisible && !s.systemPaused) {
    ensureReminder();
    if (reminderReady && reminder) { placeReminder(s); if (!reminder.isVisible()) reminder.showInactive(); }
  } else if (reminder && !reminder.isDestroyed()) {
    // Recreate on demand so no stale card flashes and no hidden renderer stays resident.
    reminder.destroy(); reminder = undefined; reminderReady = false;
  }
  if (s.alertSequence !== previousAlert) {
    previousAlert = s.alertSequence;
    if (s.settings.soundEnabled && s.cardVisible && performance.now() - lastSound >= 60_000) { lastSound = performance.now(); widget.webContents.send('xijian:sound'); }
  }
  const mins = Math.ceil(s.focus.remainingMs / 60_000);
  const trayText = `息间 · ${MODE_NAMES[s.focus.mode]} ${mins}分钟 · ${s.focus.status === 'running' ? '进行中' : '已暂停'}`;
  if (tray && trayText !== lastTrayText) { tray.setToolTip(trayText); lastTrayText = trayText; }
  const title = menuBarTitle(s);
  if (isMac && tray && title !== lastTrayTitle) {
    tray.setTitle(title, { fontType: 'monospacedDigit' });
    lastTrayTitle = title;
  }
  const menuKey = `${s.settingsRevision}/${s.focus.status}/${!!s.quietRemainingMs}/${s.update?.phase}`;
  if (tray && menuKey !== lastMenuKey) { tray.setContextMenu(trayMenu()); lastMenuKey = menuKey; }
}
function tick() {
  const now = performance.now(), delta = Math.max(0, now - lastTick); lastTick = now;
  // A long unobserved gap is conservatively treated as away time.
  if (delta > 15_000) { engine.setSystemPaused('unobserved', true); engine.setSystemPaused('unobserved', false); engine.advance(0, Date.now()); }
  else engine.advance(delta, Date.now());
}
async function updateSettings(next: Settings) {
  const valid = validateSettings(next);
  const prospective = savedState(); prospective.settings = valid; prospective.settingsRevision++;
  try { await store.save(prospective); }
  catch (error) { storageError = error instanceof Error ? error.message : '本地保存失败'; throw new Error(`设置没有保存：${storageError}`); }
  engine.updateSettings(valid); storageError = null; fitWidget();
  tray?.setContextMenu(trayMenu());
}
async function dispatch(raw: unknown): Promise<Snapshot> {
  if (preparingUpdate) throw new Error('正在保存数据并安装更新，请稍候');
  if (!raw || typeof raw !== 'object' || typeof (raw as Command).type !== 'string') throw new Error('操作格式不正确');
  const c = raw as Command;
  tick();
  switch (c.type) {
    case 'focus.start': engine.startFocus(); break;
    case 'focus.pause': engine.pauseFocus(); break;
    case 'focus.reset': engine.resetFocus(); break;
    case 'focus.select':
      if (!['focus', 'short', 'long'].includes(c.mode)) throw new Error('计时模式不正确');
      engine.resetFocus(c.mode); break;
    case 'settings.update':
      if (c.revision !== engine.settingsRevision) throw new Error('设置已在另一窗口更新，请重新调整这项设置');
      await updateSettings(c.settings); break;
    case 'settings.defaults': await updateSettings(defaultSettings()); break;
    case 'health.toggle':
      if (typeof c.enabled !== 'boolean') throw new Error('开关设置不正确');
      await updateSettings({ ...engine.settings, healthEnabled: c.enabled }); break;
    case 'meeting.toggle': engine.toggleMeeting(); break;
    case 'reminder.start': case 'reminder.complete': case 'reminder.snooze': case 'reminder.skip':
      if (typeof c.id !== 'string' || c.id.length > 100) throw new Error('提醒编号不正确');
      engine.action(c.id, c.type.split('.')[1] as 'start' | 'complete' | 'snooze' | 'skip'); break;
    case 'reminder.preview':
      if (!Object.hasOwn(RULE_INFO, c.ruleId)) throw new Error('提醒类型不正确');
      engine.preview(c.ruleId); break;
    case 'reminders.open': engine.openCard(); break;
    case 'reminders.collapse': engine.collapseCard(); break;
    case 'notice.dismiss': engine.dismissNotice(); break;
    case 'window.settings': openSettings(); break;
    case 'window.close-settings': settingsWindow?.close(); break;
    case 'window.work-plans': openWorkPlans(); return state();
    case 'window.close-work-plans': workWindow?.close(); return state();
    case 'update.action': void updates.perform(); return state();
    case 'window.hide': widget.hide(); break;
    case 'window.compact': await updateSettings({ ...engine.settings, compact: !engine.settings.compact }); break;
    case 'window.pin': await updateSettings({ ...engine.settings, alwaysOnTop: !engine.settings.alwaysOnTop }); break;
    case 'window.menu': trayMenu().popup({ window: widget }); break;
    case 'app.quit': app.quit(); break;
    default: throw new Error('不支持的操作');
  }
  publish();
  await persist();
  publish();
  return state();
}
function run(command: unknown): Promise<Snapshot> {
  const result = commandQueue.catch(() => {}).then(() => dispatch(command)); commandQueue = result;
  return result;
}
function fromTray(command: Command) {
  void run(command).catch(error => { storageError=error instanceof Error?error.message:'操作未完成';showWidget();publish(); });
}
function updateMenuLabel() {
  if (!updates) return '检查更新';
  const update = updates.snapshot();
  if (update.phase === 'manual') return '通过安装包更新';
  if (update.phase === 'available') return '下载新版息间';
  if (update.phase === 'ready') return '重启并安装更新';
  return ['checking', 'downloading', 'installing'].includes(update.phase) ? update.message : '检查更新';
}

async function prepareUpdateInstall() {
  await commandQueue.catch(() => {});
  if (quitting) throw new Error('应用正在退出');
  preparingUpdate = true;
  await workWrites;
  tick();
  await persist();
  if (storageError) throw new Error(storageError);
  savedForQuit = true;
}
function trusted(event: IpcMainInvokeEvent) {
  const sender = allWindows().some(w => w.webContents === event.sender);
  try { return sender && event.senderFrame === event.sender.mainFrame && path.normalize(fileURLToPath(event.senderFrame!.url)) === path.normalize(uiFile); }
  catch { return false; }
}

if (gotLock) void app.whenReady().then(async () => {
  if (isMac) {
    app.setActivationPolicy('regular');
    app.dock?.setIcon(path.join(app.getAppPath(), 'assets', 'icon.png'));
    await app.dock?.show();
    app.dock?.setMenu(Menu.buildFromTemplate([
      { label: '显示息间', click: showWidget },
      { label: '工作计划', click: openWorkPlans },
      { label: '设置…', click: openSettings }
    ]));
  }
  if (process.platform === 'win32') app.setAppUserModelId('com.xijian.desktop');
  Menu.setApplicationMenu(isMac ? Menu.buildFromTemplate([
    { label: '息间', submenu: [
      { role: 'about', label: '关于息间' },
      { label: '设置…', accelerator: 'Command+,', click: openSettings },
      { type: 'separator' }, { role: 'services', label: '服务' },
      { type: 'separator' }, { role: 'hide', label: '隐藏息间' }, { role: 'hideOthers', label: '隐藏其他' }, { role: 'unhide', label: '全部显示' },
      { type: 'separator' }, { role: 'quit', label: '退出息间' }
    ] },
    { label: '编辑', submenu: [{ role: 'undo', label: '撤销' }, { role: 'redo', label: '重做' }, { type: 'separator' }, { role: 'cut', label: '剪切' }, { role: 'copy', label: '复制' }, { role: 'paste', label: '粘贴' }, { role: 'selectAll', label: '全选' }] },
    { label: '计时', submenu: [
      { label: '开始 / 暂停', accelerator: 'Command+Return', click: () => fromTray({ type: engine.runtime.focus.status === 'running' ? 'focus.pause' : 'focus.start' }) },
      { label: '切换迷你模式', accelerator: 'Command+Shift+M', click: () => fromTray({ type: 'window.compact' }) }
    ] },
    { label: '窗口', submenu: [
      { label: '显示息间', click: showWidget }, { label: '工作计划', accelerator: 'Command+Shift+P', click: openWorkPlans },
      { type: 'separator' }, { role: 'close', label: '关闭窗口' }
    ] }
  ]) : null);
  session.defaultSession.setPermissionRequestHandler((_web, _permission, callback) => callback(false));
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }));
  const dataDirectory = app.getPath('userData');
  store = new Store(dataDirectory);
  workStore = new JsonStore(dataDirectory, 'work-plans.json', validateWorkPlanData, '工作计划来自更新版本，请升级息间后查看');
  const [saved, savedWorkPlans] = await Promise.all([store.load(), workStore.load()]);
  workPlans = savedWorkPlans ?? { schemaVersion: 1, items: [] };
  if (!savedWorkPlans && workStore.recovered && !workStore.readOnlyReason) {
    workStore.readOnlyReason = '工作计划文件暂时无法读取，原文件已保留';
  }
  engine = new Engine(saved);
  const updateEnabled = process.platform === 'win32' && app.isPackaged && !process.env.PORTABLE_EXECUTABLE_DIR && existsSync(path.join(process.resourcesPath, 'app-update.yml'));
  autoUpdater.logger = null;
  updates = new Updates(autoUpdater, updateEnabled, app.getVersion(), publish, () => {
    if (Notification.isSupported()) new Notification({ title: '息间有新版本', body: '可从托盘菜单下载更新，准备好后再重启安装。' }).show();
  }, prepareUpdateInstall, () => {
    if (preparingUpdate) { preparingUpdate = false; savedForQuit = false; }
  }, isMac ? 'Mac 测试版通过重新安装更新；本机设置与工作计划会保留。' : undefined);
  storageError = store.readOnlyReason;
  if (saved?.position && Number.isFinite(saved.position.x) && Number.isFinite(saved.position.y)) position = saved.position;
  widget = makeWindow('widget', widgetSize());
  widget.setBounds(visibleBounds(position, widgetSize(), areas()));
  widget.setAlwaysOnTop(engine.settings.alwaysOnTop, 'floating');
  widget.once('ready-to-show', () => { widget.show(); publish(); });
  widget.on('close', event => { if (!quitting) { event.preventDefault(); widget.hide(); } });
  widget.on('moved', () => { const [x, y] = widget.getPosition(); position = { x, y }; void persist(); });
  widget.webContents.on('context-menu', () => trayMenu().popup({ window: widget }));
  const iconPath = path.join(app.getAppPath(), 'assets', isMac ? 'trayTemplate.png' : 'icon.png');
  const icon = isMac ? nativeImage.createFromPath(iconPath) : nativeImage.createFromPath(iconPath).resize({ width: 20, height: 20 });
  if (isMac) icon.setTemplateImage(true);
  tray = new Tray(icon); tray.setToolTip('息间 · 按你的节奏'); tray.setContextMenu(trayMenu());
  // macOS owns the click to open its menu. Don't also summon the widget.
  if (!isMac) { tray.on('click', showWidget); tray.on('double-click', showWidget); }
  ipcMain.handle('xijian:get-state', event => { if (!trusted(event)) throw new Error('未授权的界面'); return state(); });
  ipcMain.handle('xijian:command', (event, c) => { if (!trusted(event)) throw new Error('未授权的界面'); return run(c); });
  ipcMain.handle('xijian:work-plans', async event => {
    if (event.sender !== workWindow?.webContents || !trusted(event)) throw new Error('未授权的界面');
    await workWrites.catch(() => {});
    return workPlanView();
  });
  ipcMain.handle('xijian:change-work-plan', (event, change) => {
    if (event.sender !== workWindow?.webContents || !trusted(event)) throw new Error('未授权的界面');
    return changeWorkPlan(change);
  });
  const suspend = (reason: string, value: boolean) => {
    tick(); engine.setSystemPaused(reason, value); lastTick = performance.now(); publish(); void persist();
  };
  powerMonitor.on('suspend', () => suspend('sleep', true)); powerMonitor.on('resume', () => suspend('sleep', false));
  powerMonitor.on('lock-screen', () => suspend('lock', true)); powerMonitor.on('unlock-screen', () => suspend('lock', false));
  if (powerMonitor.getSystemIdleState(60) === 'locked') engine.setSystemPaused('lock', true);
  screen.on('display-removed', fitWidget); screen.on('display-metrics-changed', fitWidget);
  lastTick = performance.now();
  setInterval(() => { tick(); publish(); }, 500);
  setInterval(() => void persist(), 30_000);
  app.on('second-instance', showWidget); app.on('activate', showWidget);
  if (updateEnabled) {
    setTimeout(() => void updates.check(true), 30_000).unref();
    setInterval(() => void updates.check(true), 6 * 60 * 60_000).unref();
  }
  if (testMode) (app as unknown as { __xijianTest: unknown }).__xijianTest = {
    state, run,
    advance: (ms: number) => { engine.advance(ms, Date.now()); lastTick = performance.now(); publish(); return state(); },
    pauseSystem: (reason: string, value: boolean) => { engine.setSystemPaused(reason, value); lastTick = performance.now(); publish(); return state(); },
    hide: () => widget.hide(), show: showWidget,
    windowState: () => ({ widgetVisible: widget.isVisible(), alwaysOnTop: widget.isAlwaysOnTop(), bounds: widget.getBounds(), settingsVisible: !!settingsReady && !!settingsWindow?.isVisible(), reminderVisible: !!reminderReady && !!reminder?.isVisible(), allWorkspaces: widget.isVisibleOnAllWorkspaces(), dockVisible: isMac ? app.dock?.isVisible() : null, trayTitle: isMac ? tray?.getTitle() : null, templateIcon: icon.isTemplateImage() })
  };
}).catch(error => { console.error(error); app.exit(1); });

app.on('before-quit', event => {
  if (testMode) console.error('[xijian-test] before-quit', { savedForQuit, windows: allWindows().length });
  quitting = true;
  if (!savedForQuit && engine && store) {
    event.preventDefault(); tick(); savedForQuit = true;
    void Promise.allSettled([persist(), workWrites]).finally(() => {
      if (testMode) console.error('[xijian-test] persisted', storageError);
      tray?.destroy();
      app.quit();
    });
  }
});
app.on('window-all-closed', () => {});
app.on('will-quit', () => { if(testMode)console.error('[xijian-test] will-quit'); });
app.on('quit', () => { if(testMode)console.error('[xijian-test] quit'); });
