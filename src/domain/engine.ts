import { defaultSettings, validateSettings, localDay, type Settings, type Mode, type RuleId, type FocusState, type Runtime, type Occurrence, type DayStats, type PersistedState, type Snapshot, type ActivityEvent } from '../shared';
export { localDay } from '../shared';

const clone = <T>(value: T): T => structuredClone(value);
const positive = (n: unknown, fallback: number, max = Number.MAX_SAFE_INTEGER): number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max ? n : fallback;
const emptyStats = (): DayStats => ({ focusMs: 0, focusCompleted: 0, healthCompleted: 0 });
export class Engine {
  settings: Settings;
  settingsRevision = 0;
  runtime: Runtime;
  stats: Record<string, DayStats> = {};
  private systemReasons = new Set<string>();
  private events: ActivityEvent[] = [];
  private now: number;
  constructor(saved?: PersistedState, now = Date.now()) {
    this.now = now;
    this.settings = saved ? validateSettings(saved.settings) : defaultSettings();
    const duration = this.duration('focus');
    this.runtime = {
      focus: { mode: 'focus', status: 'idle', totalMs: duration, remainingMs: duration, completedRounds: 0, sessionId: crypto.randomUUID() },
      remaining: this.fullIntervals(), occurrences: [], notice: null, quietUntil: null, graceMs: 0, cardVisible: false, cardAgeMs: 0, alertSequence: 0
    };
    if (saved) this.restore(saved);
  }
  private restore(saved: PersistedState) {
    this.settingsRevision = Math.floor(positive(saved.settingsRevision, 0));
    const f = saved.runtime?.focus;
    if (f && ['focus', 'short', 'long'].includes(f.mode)) {
      const total = positive(f.totalMs, this.duration(f.mode), 180 * 60_000) || this.duration(f.mode);
      this.runtime.focus = {
        mode: f.mode, status: ['idle', 'ready'].includes(f.status) ? f.status : 'paused',
        remainingMs: positive(f.remainingMs, total, total), totalMs: total,
        completedRounds: Math.floor(positive(f.completedRounds, 0)), sessionId: crypto.randomUUID()
      };
      if (this.runtime.focus.remainingMs === 0) {
        this.runtime.focus.remainingMs = this.duration(f.mode);
        this.runtime.focus.totalMs = this.duration(f.mode);
        this.runtime.focus.status = 'idle';
      }
    }
    for (const r of this.settings.reminders) {
      this.runtime.remaining[r.id] = positive(saved.runtime?.remaining?.[r.id], r.intervalMinutes * 60_000, 180 * 60_000);
    }
    for (const o of Array.isArray(saved.runtime?.occurrences) ? saved.runtime.occurrences : []) {
      if (o && !o.preview && this.settings.reminders.some(r => r.id === o.ruleId && r.enabled)) {
        // Only an explicit snooze survives restart; no old popup is replayed.
        if (o.state === 'snoozed') {
          this.runtime.occurrences.push({ id: crypto.randomUUID(), ruleId: o.ruleId, state: 'snoozed', remainingMs: 0, snoozeMs: positive(o.snoozeMs, 300_000, 300_000), preview: false });
        } else {
          this.runtime.remaining[o.ruleId] = this.interval(o.ruleId);
          this.emit('reminder_interrupted', o.id, { ruleId: o.ruleId });
        }
      }
    }
    if (this.settings.healthEnabled) this.runtime.graceMs = 30_000;
    if (typeof saved.runtime?.quietUntil === 'number' && saved.runtime.quietUntil > this.now && saved.runtime.quietUntil <= this.now + 30 * 60_000) this.runtime.quietUntil = saved.runtime.quietUntil;
    for (const [day, value] of Object.entries(saved.stats ?? {})) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && value && typeof value === 'object') this.stats[day] = {
        focusMs: positive(value.focusMs, 0, 86_400_000), focusCompleted: Math.floor(positive(value.focusCompleted, 0, 1440)), healthCompleted: Math.floor(positive(value.healthCompleted, 0, 10000))
      };
    }
  }
  private duration(mode: Mode): number {
    const p = this.settings.focusPlan;
    return 60_000 * (mode === 'focus' ? p.workMinutes : mode === 'short' ? p.shortMinutes : p.longMinutes);
  }
  private interval(id: RuleId) { return this.settings.reminders.find(r => r.id === id)!.intervalMinutes * 60_000; }
  private fullIntervals(): Record<RuleId, number> {
    return Object.fromEntries(this.settings.reminders.map(r => [r.id, r.intervalMinutes * 60_000])) as Record<RuleId, number>;
  }
  private emit(type: string, entityId?: string, extra: Record<string, unknown> = {}) {
    this.events.push({ id: crypto.randomUUID(), type, entityId, occurredAtUtc: new Date(this.now).toISOString(), localDate: localDay(this.now), offsetMinutes: -new Date(this.now).getTimezoneOffset(), ...extra });
  }
  drainEvents() { return this.events.splice(0); }
  private day(time = this.now) { return this.stats[localDay(time)] ??= emptyStats(); }
  private addFocusTime(ms: number, end: number) {
    let cursor = end - ms;
    while (cursor < end) {
      const d = new Date(cursor);
      const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
      const chunkEnd = Math.min(end, midnight);
      this.day(cursor).focusMs += chunkEnd - cursor;
      cursor = chunkEnd;
    }
  }
  private reveal() {
    if (this.systemReasons.size || this.runtime.quietUntil) return;
    this.runtime.cardVisible = true;
    this.runtime.cardAgeMs = 0;
  }
  private alert() { this.runtime.alertSequence++; this.reveal(); }
  private cleanCard() {
    if (!this.runtime.notice && !this.runtime.occurrences.some(o => o.state !== 'snoozed')) this.runtime.cardVisible = false;
  }
  advance(ms: number, now = this.now + ms) {
    if (!Number.isFinite(ms) || ms < 0 || !Number.isFinite(now)) throw new Error('无效的时间推进');
    this.now = now;
    const rt = this.runtime;
    const previousAlert = rt.alertSequence;
    let availableMs = ms;
    if (rt.quietUntil) {
      if (now >= rt.quietUntil) {
        availableMs = Math.max(0, Math.min(ms, now - rt.quietUntil));
        rt.quietUntil = null; rt.graceMs = 30_000;
      } else availableMs = 0;
    }
    if (this.systemReasons.size) return;
    const f = rt.focus;
    let restConsumed = 0;
    if (f.status === 'running') {
      const used = Math.min(ms, f.remainingMs);
      if (f.mode === 'focus') this.addFocusTime(used, now - ms + used);
      else restConsumed = used;
      f.remainingMs = Math.max(0, f.remainingMs - used);
      if (f.remainingMs === 0) {
        if (f.mode === 'focus') {
          this.day(now - ms + used).focusCompleted++;
          this.emit('focus_completed', f.sessionId);
          f.completedRounds++;
          f.mode = f.completedRounds % this.settings.focusPlan.rounds === 0 ? 'long' : 'short';
          rt.notice = { id: crypto.randomUUID(), kind: 'break' };
        } else {
          this.emit('break_completed', f.sessionId);
          f.mode = 'focus';
          rt.notice = { id: crypto.randomUUID(), kind: 'focus' };
        }
        f.totalMs = this.duration(f.mode); f.remainingMs = f.totalMs; f.status = 'ready';
        this.alert();
      }
    }
    const quiet = !!rt.quietUntil;
    const hadRunningAction = rt.occurrences.some(o => o.state === 'running');
    let healthMs = this.settings.healthEnabled && !quiet ? Math.min(availableMs, Math.max(0, ms - restConsumed)) : 0;
    if (rt.graceMs > 0) {
      const graceUsed = Math.min(availableMs, rt.graceMs);
      rt.graceMs -= graceUsed;
      healthMs = Math.max(0, healthMs - graceUsed);
    }
    // Action timers can run during a Pomodoro rest; scheduling intervals cannot.
    if (!quiet) for (const o of rt.occurrences) {
      if (o.state === 'running') {
        o.remainingMs = Math.max(0, o.remainingMs - availableMs);
        if (!o.remainingMs) { o.state = 'ready'; rt.cardAgeMs = 0; }
      }
    }
    if (healthMs > 0) {
      for (const o of rt.occurrences) {
        if (o.state === 'snoozed') {
          o.snoozeMs = Math.max(0, o.snoozeMs - healthMs);
          if (!o.snoozeMs) { o.state = 'pending'; this.emit('reminder_shown', o.id, { ruleId: o.ruleId }); this.alert(); }
        }
      }
      for (const r of this.settings.reminders) {
        if (r.enabled && !rt.occurrences.some(o => o.ruleId === r.id && !o.preview)) rt.remaining[r.id] = Math.max(0, rt.remaining[r.id] - healthMs);
      }
      if (this.settings.reminders.some(r => r.enabled && rt.remaining[r.id] === 0 && !rt.occurrences.some(o => o.ruleId === r.id && !o.preview))) {
        const hadCard = !!rt.notice || rt.occurrences.some(o => o.state !== 'snoozed');
        for (const r of this.settings.reminders) {
          if (r.enabled && rt.remaining[r.id] <= 60_000 && !rt.occurrences.some(o => o.ruleId === r.id && !o.preview)) {
            const o: Occurrence = { id: crypto.randomUUID(), ruleId: r.id, state: 'pending', remainingMs: r.durationSeconds * 1000, snoozeMs: 0, preview: false };
            // Replace a preview of this action rather than creating two cards.
            rt.occurrences = rt.occurrences.filter(x => x.ruleId !== r.id);
            rt.occurrences.push(o); rt.remaining[r.id] = this.interval(r.id);
            this.emit('reminder_shown', o.id, { ruleId: r.id });
          }
        }
        if (!hadCard) this.alert();
      }
    }
    if (rt.cardVisible && rt.alertSequence === previousAlert && !hadRunningAction && !rt.occurrences.some(o => o.state === 'running')) {
      rt.cardAgeMs += ms;
      if (rt.cardAgeMs >= 60_000) rt.cardVisible = false;
    }
    this.cleanCard();
  }
  startFocus() {
    const f = this.runtime.focus;
    if (f.status === 'running') return;
    const continuing = f.status === 'paused';
    if (!continuing) f.sessionId = crypto.randomUUID();
    f.status = 'running'; this.runtime.notice = null; this.cleanCard();
    this.emit(continuing ? 'focus_resumed' : f.mode === 'focus' ? 'focus_started' : 'break_started', f.sessionId);
  }
  pauseFocus() {
    if (this.runtime.focus.status !== 'running') return;
    this.runtime.focus.status = 'paused'; this.emit('focus_paused', this.runtime.focus.sessionId);
  }
  resetFocus(mode = this.runtime.focus.mode) {
    const f = this.runtime.focus;
    this.emit('focus_reset', f.sessionId);
    f.mode = mode; f.status = 'idle'; f.totalMs = this.duration(mode); f.remainingMs = f.totalMs;
    f.sessionId = crypto.randomUUID(); this.runtime.notice = null; this.cleanCard();
  }
  updateSettings(raw: unknown) {
    const next = validateSettings(raw);
    const prev = this.settings;
    this.settings = next; this.settingsRevision++;
    for (const r of next.reminders) {
      const before = prev.reminders.find(v => v.id === r.id)!;
      if (before.enabled !== r.enabled || before.intervalMinutes !== r.intervalMinutes || before.durationSeconds !== r.durationSeconds || prev.healthEnabled !== next.healthEnabled) {
        this.cancelRule(r.id, 'reminder_cancelled'); this.runtime.remaining[r.id] = this.interval(r.id);
      }
    }
    if (prev.healthEnabled !== next.healthEnabled) this.runtime.graceMs = 0;
    if (this.runtime.focus.status === 'idle' || this.runtime.focus.status === 'ready') {
      const duration = this.duration(this.runtime.focus.mode); this.runtime.focus.remainingMs = duration; this.runtime.focus.totalMs = duration;
    }
    this.cleanCard();
  }
  private cancelRule(id: RuleId, reason: string) {
    for (const o of this.runtime.occurrences.filter(o => o.ruleId === id)) this.emit(reason, o.id, { ruleId: id, preview: o.preview });
    this.runtime.occurrences = this.runtime.occurrences.filter(o => o.ruleId !== id);
  }
  private deferPending() {
    const rt = this.runtime;
    for (const o of rt.occurrences.filter(o => o.state !== 'snoozed')) {
      this.emit('reminder_deferred', o.id, { ruleId: o.ruleId, preview: o.preview });
      rt.remaining[o.ruleId] = this.interval(o.ruleId);
    }
    rt.occurrences = rt.occurrences.filter(o => o.state === 'snoozed');
    rt.notice = null; rt.cardVisible = false;
  }
  toggleMeeting() {
    if (this.runtime.quietUntil) { this.runtime.quietUntil = null; this.runtime.graceMs = 30_000; }
    else { this.runtime.quietUntil = this.now + 30 * 60_000; this.deferPending(); }
    this.emit('quiet_changed', undefined, { enabled: !!this.runtime.quietUntil });
  }
  setSystemPaused(reason: string, paused: boolean) {
    if (paused) {
      if (!this.systemReasons.has(reason) && !this.systemReasons.size) this.deferPending();
      this.systemReasons.add(reason);
    } else {
      const existed = this.systemReasons.delete(reason);
      if (existed && !this.systemReasons.size) this.runtime.graceMs = 30_000;
    }
  }
  preview(id: RuleId) {
    if (!this.settings.reminders.some(r => r.id === id)) throw new Error('找不到这项提醒');
    if (this.runtime.quietUntil || this.systemReasons.size) throw new Error('请先恢复提醒，再试一下');
    if (this.runtime.occurrences.some(o => o.ruleId === id)) throw new Error('这项提醒正在进行，请先处理');
    const rule = this.settings.reminders.find(r => r.id === id)!;
    this.runtime.occurrences.push({ id: crypto.randomUUID(), ruleId: id, state: 'pending', remainingMs: rule.durationSeconds * 1000, snoozeMs: 0, preview: true });
    this.alert();
  }
  action(id: string, action: 'start' | 'complete' | 'snooze' | 'skip') {
    const o = this.runtime.occurrences.find(v => v.id === id);
    if (!o) return; // Late or duplicate IPC commands are harmless.
    if (action === 'start') {
      if (o.state !== 'pending') return;
      o.state = o.remainingMs ? 'running' : 'ready'; this.runtime.cardAgeMs = 0;
      this.emit('reminder_started', o.id, { ruleId: o.ruleId, preview: o.preview }); return;
    }
    if (action === 'complete' && o.state !== 'ready') return;
    if (action === 'snooze') {
      // Previews are discarded; only real work reminders are rescheduled.
      if (o.preview) { this.runtime.occurrences = this.runtime.occurrences.filter(v => v.id !== id); this.cleanCard(); return; }
      o.state = 'snoozed'; o.snoozeMs = 300_000;
      o.remainingMs = this.settings.reminders.find(r => r.id === o.ruleId)!.durationSeconds * 1000;
    } else {
      this.runtime.occurrences = this.runtime.occurrences.filter(v => v.id !== id);
      if (!o.preview) {
        this.runtime.remaining[o.ruleId] = this.interval(o.ruleId);
        if (action === 'complete') this.day().healthCompleted++;
      }
    }
    this.emit(action === 'complete' ? 'reminder_completed' : action === 'snooze' ? 'reminder_snoozed' : 'reminder_skipped', o.id, { ruleId: o.ruleId, preview: o.preview });
    this.runtime.cardAgeMs = 0; this.cleanCard();
  }
  openCard() { if (this.runtime.notice || this.runtime.occurrences.some(o => o.state !== 'snoozed')) this.reveal(); }
  collapseCard() { this.runtime.cardVisible = false; }
  dismissNotice() { this.runtime.notice = null; this.cleanCard(); }
  serialize(): PersistedState {
    return clone({ schemaVersion: 1, settings: this.settings, settingsRevision: this.settingsRevision, runtime: this.runtime, stats: this.stats });
  }
  snapshot(): Snapshot {
    const rt = this.runtime;
    const options = this.settings.reminders.filter(r => r.enabled && !rt.occurrences.some(o => o.ruleId === r.id && !o.preview)).map(r => ({ ruleId: r.id, remainingMs: rt.remaining[r.id] }));
    for (const o of rt.occurrences.filter(o => o.state === 'snoozed' && !o.preview)) options.push({ ruleId: o.ruleId, remainingMs: o.snoozeMs });
    options.sort((a, b) => a.remainingMs - b.remainingMs);
    return clone({
      settings: this.settings, settingsRevision: this.settingsRevision, focus: rt.focus,
      occurrences: rt.occurrences.filter(o => o.state !== 'snoozed'), notice: rt.notice,
      cardVisible: rt.cardVisible && !this.systemReasons.size && !rt.quietUntil, alertSequence: rt.alertSequence,
      quietRemainingMs: Math.max(0, (rt.quietUntil ?? this.now) - this.now), graceMs: rt.graceMs, systemPaused: !!this.systemReasons.size,
      nextReminder: this.settings.healthEnabled ? options[0] ?? null : null,
      today: this.stats[localDay(this.now)] ?? emptyStats(), pendingCount: rt.occurrences.filter(o => o.state !== 'snoozed').length + (rt.notice ? 1 : 0), storageError: null, recovered: false
    });
  }
}
