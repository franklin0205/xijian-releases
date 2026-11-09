import { _electron as electron } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dir = await mkdtemp(path.join(tmpdir(), 'xijian-smoke-'));
await mkdir('test-results', { recursive: true });
const env = { ...process.env, XIJIAN_TEST: '1', XIJIAN_DATA_DIR: dir };
delete env.ELECTRON_RUN_AS_NODE;
const args = ['.'];
if (process.env.XIJIAN_HEADLESS === '1') args.push('--no-sandbox', '--ozone-platform=headless');
let app;
const errors = [];
const checks = [];
const hook = (action, value) => app.evaluate(({ app }, { action, value }) => app.__xijianTest[action](value), { action, value });
async function pageFor(view) {
  for (let i = 0; i < 200; i++) {
    const page = app.windows().find(page => page.url().includes(`view=${view}`));
    if (page) return page;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`Window not loaded: ${view}`);
}
async function launch() {
  app = await electron.launch({ args, env, timeout: 30_000 });
  app.on('window', page => page.on('pageerror', error => errors.push(error.message)));
  const page = await app.firstWindow();
  await page.waitForFunction(() => !!window.xijian && document.querySelector('#timer'));
  await app.evaluate(async ({ app }) => {
    for (let i = 0; i < 100 && !app.__xijianTest; i++) await new Promise(resolve => setTimeout(resolve, 50));
    if (!app.__xijianTest) throw new Error('Test hooks unavailable');
  });
  return page;
}
try {
  let widget = await launch();
  if (process.platform === 'darwin') assert.equal((await hook('windowState')).dockVisible, true, 'Dock missing at launch');
  assert.equal(await widget.locator('#timer').textContent(), '25:00');
  await widget.screenshot({ path: 'test-results/widget.png' });
  await widget.getByRole('button', { name: '开始专注', exact: true }).click();
  assert.equal((await hook('state')).focus.status, 'running');
  await hook('advance', 60_000);
  await widget.getByRole('button', { name: '暂停', exact: true }).click();
  assert.equal((await hook('state')).focus.status, 'paused');
  checks.push('start / advance / pause');
  await widget.getByRole('button', { name: '切换迷你模式', exact: true }).click();
  await widget.locator('#mini-time').waitFor();
  assert.equal((await hook('windowState')).bounds.width, 232);
  if (process.platform === 'darwin') assert.equal((await hook('windowState')).dockVisible, true, 'Dock missing in compact mode');
  await widget.screenshot({ path: 'test-results/mini.png' });
  await widget.getByRole('button', { name: '展开计时组件', exact: true }).click();
  checks.push('mini / expanded window bounds');

  const workPromise = app.waitForEvent('window');
  await widget.getByRole('button', { name: '打开工作计划', exact: true }).click();
  const work = await workPromise;
  // An empty work-plan list opens the composer after its initial data load.
  // Clicking its summary here would close it before we can enter a title.
  await work.locator('.work-composer[open]').waitFor();
  await work.getByLabel('工作名称', { exact: true }).fill('Mac 验收：保留工作计划');
  await work.getByRole('button', { name: '新增计划', exact: true }).click();
  await work.getByText('Mac 验收：保留工作计划', { exact: true }).waitFor();
  await work.screenshot({ path: 'test-results/work-plans.png' });
  await work.getByRole('button', { name: '关闭工作计划', exact: true }).click();
  checks.push('work plan created through UI');

  const settingsPromise = app.waitForEvent('window');
  await widget.getByRole('button', { name: '打开设置', exact: true }).click();
  const settings = await settingsPromise;
  await settings.getByRole('button', { name: '桌面与通知', exact: true }).click();
  await settings.screenshot({ path: 'test-results/settings.png' });
  assert.equal((await hook('state')).update.phase, 'manual');
  await settings.getByRole('button', { name: '关闭设置', exact: true }).click();

  await hook('hide');
  assert.equal((await hook('windowState')).widgetVisible, false);
  if (process.platform === 'darwin') {
    assert.equal((await hook('windowState')).dockVisible, true, 'Hiding widget hid Dock');
    await app.evaluate(({ app }) => app.emit('activate', {}, false));
    assert.equal((await hook('windowState')).widgetVisible, true, 'Dock activation did not restore widget');
    await hook('hide');
  }
  await hook('run', { type: 'focus.start' });
  await hook('advance', 60_000);
  assert.equal((await hook('state')).focus.status, 'running');
  await app.evaluate(({ app }) => {
    app.__xijianTest.pauseSystem('sleep', true);
    const before = app.__xijianTest.state().focus.remainingMs;
    app.__xijianTest.advance(3_600_000);
    if (app.__xijianTest.state().focus.remainingMs !== before) throw new Error('Sleep consumed timer');
    app.__xijianTest.pauseSystem('sleep', false);
  });
  checks.push('hidden timer / simulated sleep and resume');
  await hook('show');
  await hook('run', { type: 'focus.pause' });
  await hook('run', { type: 'reminder.preview', ruleId: 'water' });
  const reminder = await pageFor('reminder');
  await reminder.getByText('停一下，喝几口水', { exact: true }).waitFor();
  if (process.platform === 'darwin') assert.equal((await hook('windowState')).dockVisible, true, 'Reminder creation hid Dock');
  await reminder.screenshot({ path: 'test-results/reminder.png' });
  await reminder.getByRole('button', { name: '收起提醒', exact: true }).click();
  checks.push('reminder opens and dismisses');

  // A foreign window must not be able to send privileged IPC.
  assert.equal(await app.evaluate(async ({ BrowserWindow }) => {
    const rogue = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false } });
    try {
      await rogue.loadURL('data:text/html,<body>test</body>');
      return await rogue.webContents.executeJavaScript("require('electron').ipcRenderer.invoke('xijian:command', {type:'app.quit'}).then(() => false, () => true)");
    } finally { rogue.destroy(); }
  }), true);
  checks.push('untrusted IPC rejected');

  if (process.platform === 'darwin') {
    const native = await hook('windowState');
    assert.equal(native.allWorkspaces, true);
    assert.equal(native.dockVisible, true);
    assert.equal(native.templateIcon, true);
    assert.match(native.trayTitle, /\d+:\d{2}/);
    await widget.keyboard.press('Meta+,');
    const settings = await pageFor('settings');
    await settings.getByRole('button', { name: '关闭设置', exact: true }).waitFor();
    await settings.keyboard.press('Meta+w');
    checks.push('macOS template icon / Spaces / menu title / Command shortcuts');
  }
  const beforeRestart = (await hook('state')).focus.remainingMs;
  await app.close(); app = undefined;
  assert.equal(JSON.parse(await readFile(path.join(dir, 'work-plans.json'), 'utf8')).items.length, 1);
  widget = await launch();
  const restored = await hook('state');
  assert.equal(restored.focus.status, 'paused');
  assert.ok(Math.abs(restored.focus.remainingMs - beforeRestart) < 1500);
  assert.equal(JSON.parse(await readFile(path.join(dir, 'work-plans.json'), 'utf8')).items[0].title, 'Mac 验收：保留工作计划');
  checks.push('quit / relaunch / persisted progress and work plans');
  assert.deepEqual(errors, []);
  await writeFile('test-results/smoke.json', JSON.stringify({ platform: process.platform, checks, pageErrors: errors }, null, 2));
  console.log(`PASS (${process.platform}): ${checks.join('; ')}`);
} catch (error) {
  await writeFile('test-results/smoke-failure.json', JSON.stringify({
    platform: process.platform, checks, pageErrors: errors,
    error: error instanceof Error ? error.stack : String(error)
  }, null, 2));
  if (app) {
    for (const [index, page] of app.windows().entries()) {
      await page.screenshot({ path: `test-results/failure-${index}.png` }).catch(() => {});
    }
  }
  throw error;
} finally {
  if (app) await app.close();
  await rm(dir, { recursive: true, force: true });
}
