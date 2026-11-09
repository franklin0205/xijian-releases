import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { Engine } from '../src/domain/engine.ts';
import { JsonStore, Store } from '../src/main/store.ts';
import { applyWorkPlanChange, validateWorkPlanData, type WorkPlanData } from '../src/domain/work-plans.ts';
import { visibleBounds } from '../src/main/bounds.ts';
import { menuBarTitle, workspaceOptions } from '../src/main/platform.ts';
import { Updates } from '../src/main/updates.ts';

test('a completed focus session counts once and waits for the user to start a break', () => {
  const engine = new Engine();
  engine.startFocus(); engine.advance(25 * 60_000);
  assert.equal(engine.snapshot().today.focusCompleted, 1);
  assert.equal(engine.snapshot().focus.mode, 'short');
  assert.equal(engine.snapshot().focus.status, 'ready');
  engine.advance(5 * 60_000);
  assert.equal(engine.snapshot().today.focusCompleted, 1);
  assert.equal(engine.snapshot().focus.remainingMs, 5 * 60_000);
});

test('overlapping sleep and screen lock never consume focus time; both must clear', () => {
  const engine = new Engine(); engine.startFocus(); engine.advance(60_000);
  const before = engine.snapshot().focus.remainingMs;
  engine.setSystemPaused('sleep', true); engine.setSystemPaused('lock', true);
  engine.advance(3_600_000);
  engine.setSystemPaused('sleep', false); engine.advance(60_000);
  assert.equal(engine.snapshot().focus.remainingMs, before);
  assert.equal(engine.snapshot().systemPaused, true);
  engine.setSystemPaused('lock', false); engine.advance(1000);
  assert.equal(engine.snapshot().focus.remainingMs, before - 1000);
  assert.equal(engine.snapshot().systemPaused, false);
});

test('restarting preserves progress but requires an explicit resume', () => {
  const engine = new Engine(); engine.startFocus(); engine.advance(90_000);
  const restored = new Engine(engine.serialize());
  assert.equal(restored.snapshot().focus.remainingMs, 23.5 * 60_000);
  assert.equal(restored.snapshot().focus.status, 'paused');
  restored.advance(60_000);
  assert.equal(restored.snapshot().focus.remainingMs, 23.5 * 60_000);
});

test('health reminders resume with a grace period after wake', () => {
  const engine = new Engine();
  engine.updateSettings({ ...engine.settings, healthEnabled: true });
  engine.advance(19.5 * 60_000);
  engine.setSystemPaused('sleep', true); engine.advance(3_600_000);
  engine.setSystemPaused('sleep', false);
  engine.advance(30_000);
  assert.equal(engine.snapshot().pendingCount, 0);
  engine.advance(30_000);
  assert.equal(engine.snapshot().occurrences[0]?.ruleId, 'eyes');
});

test('windows recover onto a connected display without crossing its work area', () => {
  const area = { x: -1440, y: 25, width: 1440, height: 875 };
  const actual = visibleBounds({ x: 3000, y: 1600 }, { width: 320, height: 462 }, [area]);
  assert.deepEqual(actual, { x: -320, y: 438, width: 320, height: 462 });
  assert.equal(visibleBounds(undefined, { width: 720, height: 742 }, [{ x: 0, y: 25, width: 1280, height: 650 }]).height, 650);
});

test('Mac windows follow ordinary Spaces without triggering Electron DockHide', () => {
  // Electron 43's native macOS implementation hides Dock whenever
  // visibleOnFullScreen && !skipTransformProcessType. Guard the actual failure.
  for (const view of ['widget', 'reminder']) {
    const options = workspaceOptions('darwin', view);
    assert.ok(options);
    assert.equal(options.visibleOnFullScreen, false, `${view} would hide the application Dock entry`);
  }
  for (const view of ['settings', 'work-plans']) assert.equal(workspaceOptions('darwin', view), null);
  assert.equal(workspaceOptions('win32', 'widget'), null);
});

test('menu bar distinguishes paused/sleeping timer and handles long durations', () => {
  const engine = new Engine();
  assert.equal(menuBarTitle(engine.snapshot()), 'Ⅱ 25:00');
  engine.startFocus(); engine.advance(1000);
  assert.equal(menuBarTitle(engine.snapshot()), '24:59');
  engine.setSystemPaused('sleep', true);
  assert.equal(menuBarTitle(engine.snapshot()), 'Ⅱ 24:59');
  const s = engine.snapshot(); s.focus.remainingMs = 180 * 60_000;
  assert.equal(menuBarTitle(s), 'Ⅱ 180:00');
});

test('work plans survive disk reload, editing and completion', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'xijian-plan-'));
  try {
    const store = new JsonStore(dir, 'work-plans.json', validateWorkPlanData, 'newer version');
    let data: WorkPlanData = { schemaVersion: 1, items: [] };
    data = applyWorkPlanChange(data, { type: 'add', draft: { title: 'Mac 适配验收', note: '测试中文', plannedOn: '2026-11-09' } });
    data = applyWorkPlanChange(data, { type: 'set-completed', id: data.items[0].id, completed: true });
    await store.save(data);
    assert.deepEqual(await new JsonStore(dir, 'work-plans.json', validateWorkPlanData, 'newer version').load(), data);
    assert.ok(data.items[0].completedAt);
    assert.throws(() => applyWorkPlanChange(data, { type: 'add', draft: { title: 'invalid', note: '', plannedOn: '2026-02-30' } }));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('a corrupt state recovers its backup without losing the original', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'xijian-state-'));
  try {
    const store = new Store(dir); const engine = new Engine();
    await store.save(engine.serialize()); engine.startFocus(); await store.save(engine.serialize());
    await writeFile(store.file, 'corrupt');
    const reopened = new Store(dir);
    assert.ok(await reopened.load()); assert.equal(reopened.recovered, true);
    assert.equal(await readFile(store.file, 'utf8'), 'corrupt');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('a future schema stays read-only', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'xijian-future-'));
  try {
    const store = new Store(dir); await writeFile(store.file, '{"schemaVersion":2}');
    assert.equal(await store.load(), undefined);
    await assert.rejects(store.save(new Engine().serialize()));
    assert.equal(await readFile(store.file, 'utf8'), '{"schemaVersion":2}');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('Mac manual update mode never checks, downloads or installs Windows releases', async () => {
  const client = Object.assign(new EventEmitter(), {
    autoDownload: true, autoInstallOnAppQuit: true, allowDowngrade: true,
    checkForUpdates: async () => { throw new Error('unexpected network request'); },
    downloadUpdate: async () => { throw new Error('unexpected download'); },
    quitAndInstall: () => { throw new Error('unexpected install'); }
  });
  const update = new Updates(client as any, false, '0.3.2-mac.1', () => {}, () => {}, async () => {}, () => {}, 'Mac 手动更新');
  await update.check(); await update.perform();
  assert.equal(update.snapshot().phase, 'manual');
  assert.equal(update.snapshot().message, 'Mac 手动更新');
});
