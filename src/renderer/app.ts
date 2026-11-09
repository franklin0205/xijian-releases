import './style.css';
import { icon } from './icons';
import { mountWorkPlans } from './work-plans';
import { MODE_NAMES, RULE_INFO, type Snapshot, type Command, type Settings, type RuleId, type Mode, type Occurrence } from '../shared';

const root = document.getElementById('root')!;
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const escape = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const time = (ms: number) => { const seconds = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; };
const minutes = (ms: number) => ms < 60_000 ? `${Math.max(1, Math.ceil(ms / 1000))} 秒后` : `${Math.ceil(ms / 60_000)} 分钟后`;
const isMac = window.xijian.platform === 'darwin';
const view = new URLSearchParams(location.search).get('view') ?? 'widget';
let current: Snapshot;
let activeTab = 'health';
let compactState: boolean | undefined;
let reminderKey = '';
let toastTimer: ReturnType<typeof setTimeout>;
let saveStatus = '已保存到本机';
let saveFailed = false;
const switchButton = (action: string, label: string, extra = '') => `<button class="switch" role="switch" aria-label="${label}" aria-checked="false" data-action="${action}" ${extra}></button>`;

function toast(message: string) {
  const t = el('toast'); t.textContent = message; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 5000);
}
async function command(c: Command) {
  try { const next = await window.xijian.command(c); render(next); return next; }
  catch (error) { toast((error instanceof Error ? error.message : '操作没有完成').replace(/^Error invoking remote method '[^']+': Error: /, '')); throw error; }
}
function send(c: Command) { void command(c).catch(() => {}); }
function phase(s: Snapshot) {
  if (s.systemPaused) return '电脑休息中';
  if (s.focus.status === 'running') return s.focus.mode === 'focus' ? '专注进行中' : '正在休息';
  if (s.focus.status === 'paused') return '已暂停';
  if (s.focus.status === 'ready') return s.focus.mode === 'focus' ? '准备下一段' : '休息一下吧';
  return s.focus.mode === 'focus' ? '准备专注' : '准备休息';
}
function mainAction(s: Snapshot) {
  if (s.focus.status === 'running') return '暂停';
  if (s.focus.status === 'paused') return '继续';
  return s.focus.mode === 'focus' ? '开始专注' : '开始休息';
}
function nextLabel(s: Snapshot) {
  if (s.pendingCount) return `有 ${s.pendingCount} 项待处理提醒`;
  if (s.quietRemainingMs) return `会议中 · ${Math.ceil(s.quietRemainingMs / 60_000)} 分钟后恢复`;
  if (!s.settings.healthEnabled) return '健康提醒未开启';
  if (s.systemPaused || s.graceMs) return '稍等片刻，自然恢复提醒';
  if (s.focus.mode !== 'focus' && s.focus.status === 'running') return '休息期间，提醒也歇一会儿';
  if (s.nextReminder) return `下一次 · ${RULE_INFO[s.nextReminder.ruleId].name} · ${minutes(s.nextReminder.remainingMs)}`;
  return '所有健康提醒已关闭';
}
function buildWidget(compact: boolean) {
  if (compact) {
    root.innerHTML = `<main class="widget-frame widget-frame--compact"><section id="mini-card" class="mini-card surface drag" aria-label="迷你计时器"><div class="mini-summary"><span id="mini-time" class="mini-time num" role="timer" aria-label="剩余时间"></span><span class="mini-status"><span class="mini-state-dot" aria-hidden="true"></span><span id="mini-phase" class="mini-phase"></span></span></div><div class="mini-actions"><button id="mini-start" class="icon-btn mini-toggle" data-action="focus-toggle" aria-label="开始计时"></button><button class="icon-btn mini-expand" data-action="compact" aria-label="展开计时组件" title="展开">${icon('expand',15)}</button></div></section></main>`;
    return;
  }
  root.innerHTML = `<main class="widget-frame"><section class="widget-card surface">
    <header class="widget-top row between drag"><span class="wordmark">息间</span><div class="row gap4">
      <button class="icon-btn" data-action="work-plans" aria-label="打开工作计划" title="工作计划">${icon('work',16)}</button>
      <button id="pin" class="icon-btn" data-action="pin" aria-label="取消置顶" title="置顶">${icon('pin',16)}</button>
      <button class="icon-btn" data-action="settings" aria-label="打开设置" title="设置">${icon('settings',16)}</button>
      <button class="icon-btn" data-action="compact" aria-label="切换迷你模式" title="迷你模式">${icon('mini',16)}</button>
    </div></header>
    <nav class="widget-tabs" role="tablist" aria-label="计时模式">${(['focus','short','long'] as Mode[]).map(m => `<button role="tab" data-action="mode" data-mode="${m}" aria-selected="false">${MODE_NAMES[m]}</button>`).join('')}</nav>
    <div class="timer-region"><span id="timer" class="timer-value num" role="timer" aria-label="剩余时间"></span><span id="phase" class="badge phase-label"></span></div>
    <div class="widget-actions"><button id="focus-button" class="button primary" data-action="focus-toggle"></button><button class="reset-button" data-action="reset" aria-label="重置当前计时" title="重置当前计时">${icon('reset',16)}</button></div>
    <footer class="widget-bottom"><button id="next-button" class="next-button" data-action="next" title="查看提醒与设置">${icon('eye',14)}<span id="next-label"></span></button>${switchButton('health-toggle','开启健康提醒','id="health-toggle"')}</footer>
    <div class="progress-track" aria-hidden="true"><div id="progress" class="progress-fill"></div></div>
  </section><div class="widget-caption"><button id="widget-note" data-action="widget-note">按你的节奏，照顾自己。</button><button data-action="menu" aria-label="更多操作" title="隐藏、退出等操作">${icon('more',14)}</button></div></main>`;
}
function renderWidget(s: Snapshot) {
  if (compactState !== s.settings.compact) { compactState = s.settings.compact; buildWidget(compactState); }
  if (compactState) {
    const displayTime = time(s.focus.remainingMs);
    const mini = el('mini-card');
    mini.dataset.state = s.systemPaused ? 'paused' : s.focus.status;
    mini.classList.toggle('long-time', displayTime.length > 5);
    mini.title = nextLabel(s);
    el('mini-time').textContent = displayTime;
    el('mini-phase').textContent = s.systemPaused || s.focus.status === 'paused' ? '已暂停' : MODE_NAMES[s.focus.mode];
    el('mini-phase').title = phase(s);
    const button = el('mini-start');
    button.innerHTML = icon(s.focus.status === 'running' ? 'pause' : 'play',15);
    button.setAttribute('aria-label', mainAction(s));
    button.setAttribute('aria-pressed', String(s.focus.status === 'running'));
    button.title = mainAction(s); return;
  }
  el('timer').textContent = time(s.focus.remainingMs); el('phase').textContent = phase(s);
  el('focus-button').innerHTML = `${icon(s.focus.status === 'running' ? 'pause' : 'play',16)}${mainAction(s)}`;
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === s.focus.mode)));
  el('next-label').textContent = nextLabel(s);
  const toggle = el('health-toggle'); toggle.setAttribute('aria-checked', String(s.settings.healthEnabled)); toggle.setAttribute('aria-label', s.settings.healthEnabled ? '关闭健康提醒' : '开启健康提醒');
  const pin = el('pin'); pin.classList.toggle('active', s.settings.alwaysOnTop); pin.setAttribute('aria-label', s.settings.alwaysOnTop ? '取消置顶' : '保持置顶');
  el('progress').style.width = `${Math.min(100,Math.max(0,100*(1-s.focus.remainingMs/s.focus.totalMs)))}%`;
  const note = el('widget-note');
  note.textContent = s.storageError ? '本地保存遇到问题 · 点此查看' : s.recovered ? '已恢复本地设置 · 点此查看' : s.today.focusCompleted ? `今日专注 ${s.today.focusCompleted} 段 · 健康行动 ${s.today.healthCompleted} 次` : '按你的节奏，照顾自己。';
  note.classList.toggle('storage-note', !!s.storageError);
}
function buildSettings() {
  const ruleRows = (Object.keys(RULE_INFO) as RuleId[]).map(id => {
    const info = RULE_INFO[id];
    return `<section class="rule-row" id="rule-${id}"><div class="icon-tile ${info.color}">${icon(info.icon,20)}</div><div class="rule-info"><div class="rule-title"><h3>${info.name}</h3><button class="preview-button" data-action="preview" data-rule="${id}" aria-label="试一下${info.name}提醒">试一下</button></div><div class="rule-fields">每 <input class="number-input" id="interval-${id}" data-field="intervalMinutes" data-rule="${id}" type="number" min="1" max="180" step="1" aria-label="${info.name}间隔分钟"> 分钟${id === 'water' ? '<span> · 按需补水</span>' : `休息 <input class="number-input" id="duration-${id}" data-field="durationSeconds" data-rule="${id}" type="number" min="5" max="600" step="1" aria-label="${info.name}休息秒数"> 秒`}</div></div>${switchButton('rule-toggle',`${info.name}提醒`,`id="toggle-${id}" data-rule="${id}"`)}</section>`;
  }).join('');
  root.innerHTML = `<main class="settings-frame"><section class="settings-shell surface">
    <aside class="settings-sidebar"><div class="sidebar-brand drag">息间设置</div><nav class="settings-nav">${[['focus','工作节奏'],['health','健康提醒'],['desktop','桌面与通知']].map(([id,label])=>`<button class="nav-item" data-action="tab" data-tab="${id}">${label}</button>`).join('')}</nav><div class="sidebar-stats"><div>今日专注 <strong id="stat-focus">0</strong> 段</div><div>专注 <span id="stat-minutes">0</span> 分钟</div><div>健康行动 <span id="stat-health">0</span> 次</div></div></aside>
    <div class="settings-main"><header class="settings-header drag"><span class="eyebrow">你的健康工作节奏</span><button class="icon-btn" data-action="close-settings" aria-label="关闭设置">${icon('close',16)}</button></header>
    <div class="settings-content"><div class="settings-intro"><h1>找到你的工作节奏</h1><p>按你的习惯，调整每一次专注与休息</p></div>
      <section id="panel-health"><div class="master-row"><div><h3>健康提醒</h3><p>独立于专注计时，开启后按间隔提醒</p></div>${switchButton('health-toggle','开启健康提醒','id="settings-health-toggle"')}</div>${ruleRows}<div class="setting-note">${icon('info',16)}<span>同时到达的提醒会合并。修改间隔后，从新的完整间隔开始。</span></div></section>
      <section id="panel-focus" hidden><div class="section-title">一段工作，一点休息</div><div class="plan-grid">${[['workMinutes','专注',1,180],['shortMinutes','短休息',1,60],['longMinutes','长休息',1,60]].map(([field,label,min,max])=>`<div class="plan-item"><label for="plan-${field}">${label}</label><input id="plan-${field}" class="number-input" data-plan="${field}" type="number" min="${min}" max="${max}" step="1"><small>分钟</small></div>`).join('')}</div><div class="option-row"><div><h3>长休息的节奏</h3><p>完成几段专注后，安排一次长休息</p></div><label class="round-input">每 <input id="plan-rounds" class="number-input" data-plan="rounds" type="number" min="1" max="12" step="1" aria-label="长休息轮次"> 段</label></div><div class="setting-note">${icon('info',16)}<span>正在进行的计时保持不变，新时长从下一段生效。每段结束后，由你决定何时继续。</span></div><p class="first-use">暂停专注不会暂停健康提醒。需要安静一会儿时，可使用下方的会议暂停。</p></section>
      <section id="panel-desktop" hidden><div class="section-title">让息间安静地陪着你</div>${[['alwaysOnTop','始终置顶','在其他应用上方显示计时组件。'],['compact','迷你模式','只保留时间和控制，随时可以展开。'],['soundEnabled','轻声提示','提醒到时播放一声短提示音。']].map(([key,label,description])=>`<div class="option-row"><div><h3>${label}</h3><p>${description}</p></div>${switchButton('setting-toggle',label,`id="option-${key}" data-key="${key}"`)}</div>`).join('')}<p class="first-use">组件可拖动，右键可隐藏或退出。${isMac ? '隐藏后可从屏幕顶部菜单栏查看计时与重新打开。' : '隐藏到托盘后计时和提醒会继续。'}明确退出后停止。</p><div class="restore-row"><button class="text-btn" data-action="restore-show">恢复默认设置</button><div id="restore-confirm" class="confirm-restore" hidden>恢复初始节奏与开关；今日记录会保留。<div class="row"><button class="button primary" data-action="restore">恢复默认</button><button class="button secondary" data-action="restore-cancel">取消</button></div></div></div><div class="option-row"><div><h3 id="update-version">息间</h3><p id="update-status" role="status">正在读取版本信息</p></div><button id="update-action" class="button secondary" data-action="update-action" hidden>检查更新</button></div></section>
    </div><footer class="settings-footer"><button id="meeting-button" class="meeting-button" data-action="meeting">${icon('quiet',16)}<span id="meeting-label">会议中 · 暂停提醒30分钟</span></button><span id="save-status" class="save-status" role="status">已保存到本机</span></footer></div>
  </section></main>`;
  chooseTab(activeTab);
}
function chooseTab(tab: string) {
  activeTab = tab;
  for (const name of ['focus','health','desktop']) el(`panel-${name}`).hidden = name !== tab;
  document.querySelectorAll<HTMLElement>('[data-tab]').forEach(b => b.classList.toggle('selected', b.dataset.tab === tab));
}
function setInput(id: string, value: number) { const input = el<HTMLInputElement>(id); if (input && document.activeElement !== input) input.value = String(value); }
function renderSettings(s: Snapshot) {
  if (!el('panel-health')) buildSettings();
  el('settings-health-toggle').setAttribute('aria-checked',String(s.settings.healthEnabled));
  el('settings-health-toggle').setAttribute('aria-label',s.settings.healthEnabled?'关闭健康提醒':'开启健康提醒');
  for (const rule of s.settings.reminders) {
    el(`toggle-${rule.id}`).setAttribute('aria-checked',String(rule.enabled));
    el(`rule-${rule.id}`).classList.toggle('off',!rule.enabled);
    setInput(`interval-${rule.id}`,rule.intervalMinutes); setInput(`duration-${rule.id}`,rule.durationSeconds);
    const preview = document.querySelector<HTMLButtonElement>(`[data-action=preview][data-rule=${rule.id}]`)!;
    preview.disabled = !!s.quietRemainingMs || s.systemPaused;
  }
  for (const [key,value] of Object.entries(s.settings.focusPlan)) setInput(`plan-${key}`,value);
  for (const key of ['alwaysOnTop','compact','soundEnabled'] as const) el(`option-${key}`).setAttribute('aria-checked',String(s.settings[key]));
  el('stat-focus').textContent = String(s.today.focusCompleted); el('stat-minutes').textContent = String(Math.floor(s.today.focusMs / 60_000)); el('stat-health').textContent = String(s.today.healthCompleted);
  el('meeting-label').textContent = s.quietRemainingMs ? `会议中 · ${Math.ceil(s.quietRemainingMs/60_000)}分钟后恢复（点此提前恢复）` : '会议中 · 暂停提醒30分钟';
  el('meeting-button').classList.toggle('quiet',!!s.quietRemainingMs);
  el('save-status').textContent = s.storageError ? '保存遇到问题，请重试' : saveStatus;
  el('save-status').classList.toggle('failed',saveFailed || !!s.storageError);
  if (s.update) {
    const update = s.update;
    const labels = { manual: '', idle: '检查更新', checking: '检查中…', available: '下载更新', downloading: '下载中…', ready: '重启安装', installing: '安装中…', error: '重新检查' };
    const button = el<HTMLButtonElement>('update-action');
    el('update-version').textContent = `息间 ${update.currentVersion}`;
    el('update-status').textContent = update.message;
    button.textContent = labels[update.phase];
    button.hidden = update.phase === 'manual';
    button.disabled = ['checking', 'downloading', 'installing'].includes(update.phase);
  }
}
function reminderMarkup(o: Occurrence) {
  const info = RULE_INFO[o.ruleId];
  return `<section class="reminder-item" id="occ-${o.id}">${o.preview ? '<span class="preview-tag">提醒预览 · 不计入今日记录</span>':''}<div class="reminder-tag">${icon(info.icon,15)}${info.name}</div><h2>${escape(info.title)}</h2><p class="reminder-description">${escape(info.description)}</p><div id="duration-${o.id}" class="action-duration num"></div><button id="action-${o.id}" class="button coral full" data-action="occ-primary" data-id="${o.id}"></button><div class="reminder-secondary"><button class="button secondary" data-action="occ-snooze" data-id="${o.id}">${o.preview?'关闭预览':'5 分钟后'}</button><button class="button ghost" data-action="occ-skip" data-id="${o.id}">${o.preview?'跳过体验':'跳过这次'}</button></div></section>`;
}
function renderReminder(s: Snapshot) {
  const key = `${s.notice?.id ?? ''}/${s.occurrences.map(o=>o.id).join(',')}`;
  const previousList = el('reminder-list');
  const previousScrollTop = previousList?.scrollTop ?? 0;
  const restoreListFocus = previousList === document.activeElement;
  let rebuilt = false;
  if (key !== reminderKey || !el('reminder-list')) {
    rebuilt = true;
    reminderKey = key;
    root.innerHTML = `<main class="reminder-frame"><section class="reminder-shell surface"><header class="reminder-header drag"><span class="reminder-label">${icon('leaf',16)}休息一下</span><button class="icon-btn" data-action="collapse" aria-label="收起提醒">${icon('close',16)}</button></header><div id="reminder-list" class="reminder-scroll" role="region" aria-label="健康提醒列表" tabindex="0">${s.notice ? `<section class="reminder-item notice-item"><span class="eyebrow">${s.notice.kind==='break'?'专注已完成':'休息已结束'}</span><h2>${s.notice.kind==='break'?'做得不错，歇一会儿':'慢慢回来，再出发'}</h2><p>${s.notice.kind==='break'?'放下手边的事，给自己一点恢复的时间。':'准备好了，再开始下一段专注。'}</p><button class="button coral full" data-action="focus-start">${s.notice.kind==='break'?`开始${MODE_NAMES[s.focus.mode]}`:'开始下一段专注'}</button><button class="button ghost full" data-action="notice-dismiss">稍后开始</button></section>`:''}${s.occurrences.map(reminderMarkup).join('')}${s.occurrences.length>1?'<div class="group-action"><button data-action="snooze-all">全部 5 分钟后提醒</button></div>':''}${!s.notice&&!s.occurrences.length?'<p class="reminder-description">这一刻，安心做自己的事。</p>':''}</div></section></main>`;
  }
  for (const o of s.occurrences) {
    const duration = el(`duration-${o.id}`); duration.hidden = o.ruleId === 'water';
    duration.innerHTML = `${time(o.remainingMs)}<small>${o.state==='pending'?'建议休息时长':o.state==='running'?'休息中，慢慢来':'计时结束，请确认完成'}</small>`;
    const button = el<HTMLButtonElement>(`action-${o.id}`); button.disabled = o.state==='running';
    button.textContent = o.state==='ready' ? '已完成' : o.state==='running' ? '正在休息…' : o.ruleId==='water' ? '我喝好了' : '开始休息';
  }
  if (rebuilt) {
    const list = el('reminder-list');
    list.scrollTop = previousScrollTop;
    if (restoreListFocus) list.focus({ preventScroll: true });
  }
}
function render(s: Snapshot) { current = s; if (view==='settings') renderSettings(s); else if (view==='reminder') renderReminder(s); else renderWidget(s); }
async function saveSettings(settings: Settings) {
  saveStatus='正在保存…'; saveFailed=false; render(current);
  try { await command({type:'settings.update',settings,revision:current.settingsRevision}); saveStatus='已保存到本机'; }
  catch { saveStatus='未保存，请调整后重试'; saveFailed=true; }
  if(view==='settings') renderSettings(current);
}

document.addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLElement>('[data-action]');
  if (!button || !current || (button as HTMLButtonElement).disabled) return;
  const action = button.dataset.action, id = button.dataset.id;
  switch(action) {
    case 'focus-toggle': send({type:current.focus.status==='running'?'focus.pause':'focus.start'}); break;
    case 'focus-start': send({type:'focus.start'}); break;
    case 'mode': send({type:'focus.select',mode:button.dataset.mode as Mode}); break;
    case 'reset': send({type:'focus.reset'}); break;
    case 'pin': send({type:'window.pin'}); break;
    case 'compact': send({type:'window.compact'}); break;
    case 'settings': send({type:'window.settings'}); break;
    case 'work-plans': send({type:'window.work-plans'}); break;
    case 'update-action': send({type:'update.action'}); break;
    case 'close-settings': send({type:'window.close-settings'}); break;
    case 'menu': send({type:'window.menu'}); break;
    case 'health-toggle': send({type:'health.toggle',enabled:!current.settings.healthEnabled}); break;
    case 'meeting': send({type:'meeting.toggle'}); break;
    case 'next': send({type:current.pendingCount?'reminders.open':'window.settings'}); break;
    case 'collapse': send({type:'reminders.collapse'}); break;
    case 'notice-dismiss': send({type:'notice.dismiss'}); break;
    case 'tab': chooseTab(button.dataset.tab!); break;
    case 'preview': send({type:'reminder.preview',ruleId:button.dataset.rule as RuleId}); break;
    case 'rule-toggle': { const settings=structuredClone(current.settings); const rule=settings.reminders.find(r=>r.id===button.dataset.rule)!; rule.enabled=!rule.enabled; void saveSettings(settings); break; }
    case 'setting-toggle': { const settings=structuredClone(current.settings); const key=button.dataset.key as 'alwaysOnTop'|'compact'|'soundEnabled'; settings[key]=!settings[key]; void saveSettings(settings); break; }
    case 'occ-primary': {
      const o=current.occurrences.find(v=>v.id===id); if(!o) break;
      if(o.state==='ready') send({type:'reminder.complete',id:o.id});
      else if(o.state==='pending'&&o.ruleId==='water') void command({type:'reminder.start',id:o.id}).then(()=>command({type:'reminder.complete',id:o.id})).catch(()=>{});
      else send({type:'reminder.start',id:o.id}); break;
    }
    case 'occ-snooze': if(id) send({type:'reminder.snooze',id}); break;
    case 'occ-skip': if(id) send({type:'reminder.skip',id}); break;
    case 'snooze-all': { const ids=current.occurrences.map(o=>o.id); void (async()=>{for(const item of ids) await command({type:'reminder.snooze',id:item});})().catch(()=>{}); break; }
    case 'restore-show': el('restore-confirm').hidden=false; break;
    case 'restore-cancel': el('restore-confirm').hidden=true; break;
    case 'restore': void command({type:'settings.defaults'}).then(()=>{el('restore-confirm').hidden=true;toast('已恢复默认设置，今日记录已保留');}).catch(()=>{}); break;
    case 'widget-note': if(current.storageError) toast(current.storageError); else if(current.recovered) toast('检测到上次数据异常，已恢复可用设置。专注计时需要你手动继续。'); else send({type:'window.settings'}); break;
  }
});
document.addEventListener('change', event => {
  const input=event.target as HTMLInputElement;
  if(!current||!input.matches('input[data-field],input[data-plan]')) return;
  if(!input.checkValidity()||!Number.isFinite(input.valueAsNumber)) { toast('请输入字段允许范围内的整数，修改尚未保存'); saveStatus='未保存，请检查输入';saveFailed=true;renderSettings(current);return; }
  const settings=structuredClone(current.settings);
  if(input.dataset.plan) settings.focusPlan[input.dataset.plan as keyof Settings['focusPlan']]=input.valueAsNumber;
  else settings.reminders.find(r=>r.id===input.dataset.rule)![input.dataset.field as 'intervalMinutes'|'durationSeconds']=input.valueAsNumber;
  void saveSettings(settings);
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(view==='settings')send({type:'window.close-settings'});else if(view==='reminder')send({type:'reminders.collapse'});}});
if (view === 'work-plans') {
  mountWorkPlans(root);
} else {
  window.xijian.onState(render);
  if (view === 'widget') window.xijian.onSound(() => {
    const audio = new Audio('chime.wav');
    audio.volume = .35;
    void audio.play().catch(() => {});
  });
  void window.xijian.getState().then(render).catch(() => {
    root.innerHTML = '<main class="widget-frame"><section class="surface widget-card"><h2>息间暂时没有连接好</h2><p class="first-use">请退出并重新打开应用。</p></section></main>';
  });
}
