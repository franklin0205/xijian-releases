import type { WorkPlanChange, WorkPlanView } from './domain/work-plans';

export type Mode = 'focus' | 'short' | 'long';
export type RuleId = 'eyes' | 'water' | 'move' | 'close';
export type FocusStatus = 'idle' | 'running' | 'paused' | 'ready';
export interface FocusPlan { workMinutes: number; shortMinutes: number; longMinutes: number; rounds: number }
export interface Rule { id: RuleId; enabled: boolean; intervalMinutes: number; durationSeconds: number }
export interface Settings {
  schemaVersion: 1;
  focusPlan: FocusPlan;
  reminders: Rule[];
  healthEnabled: boolean;
  alwaysOnTop: boolean;
  compact: boolean;
  soundEnabled: boolean;
}
export const RULE_INFO: Record<RuleId, { name: string; title: string; description: string; icon: string; color: string }> = {
  eyes: { name: '远眺', title: '让视线去远处走走', description: '看向窗外或较远的位置，暂时放下屏幕。', icon: 'eye', color: 'sage' },
  water: { name: '喝水', title: '停一下，喝几口水', description: '拿起水杯，按自己的需要补充一点水分。', icon: 'water', color: 'lavender' },
  move: { name: '起身', title: '起来活动一下吧', description: '离开座位走一走，轻轻舒展身体。', icon: 'move', color: 'coral' },
  close: { name: '闭眼', title: '让眼睛安静一会儿', description: '在安全、舒适的环境里，轻轻闭眼放松。', icon: 'moon', color: 'lavender' }
};
export const MODE_NAMES: Record<Mode, string> = { focus: '专注', short: '短休息', long: '长休息' };
export function localDay(time: number): string {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function defaultSettings(): Settings {
  return {
    schemaVersion: 1,
    focusPlan: { workMinutes: 25, shortMinutes: 5, longMinutes: 15, rounds: 4 },
    healthEnabled: false, alwaysOnTop: true, compact: false, soundEnabled: true,
    reminders: [
      { id: 'eyes', enabled: true, intervalMinutes: 20, durationSeconds: 20 },
      { id: 'water', enabled: true, intervalMinutes: 45, durationSeconds: 0 },
      { id: 'move', enabled: true, intervalMinutes: 60, durationSeconds: 120 },
      { id: 'close', enabled: false, intervalMinutes: 30, durationSeconds: 20 }
    ]
  };
}
const int = (value: unknown, min: number, max: number, label: string) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < min || value > max) throw new Error(`${label}需要是 ${min}–${max} 之间的整数`);
  return value;
};
export function validateSettings(raw: unknown): Settings {
  if (!raw || typeof raw !== 'object') throw new Error('设置格式不正确');
  const v = raw as Settings;
  if (v.schemaVersion !== 1) throw new Error('设置版本不兼容，请使用更新的息间版本');
  for (const key of ['healthEnabled', 'alwaysOnTop', 'compact', 'soundEnabled'] as const) {
    if (typeof v[key] !== 'boolean') throw new Error('开关设置不正确');
  }
  if (!v.focusPlan || !Array.isArray(v.reminders) || v.reminders.length !== 4) throw new Error('节奏设置不完整');
  const p = v.focusPlan;
  const rules = defaultSettings().reminders.map(({ id }) => {
    const matches = v.reminders.filter(r => r?.id === id);
    if (matches.length !== 1 || typeof matches[0].enabled !== 'boolean') throw new Error('健康提醒设置不正确');
    const r = matches[0];
    return { id, enabled: r.enabled, intervalMinutes: int(r.intervalMinutes, 1, 180, '提醒间隔'), durationSeconds: int(r.durationSeconds, id === 'water' ? 0 : 5, 600, '休息秒数') };
  });
  return {
    schemaVersion: 1,
    focusPlan: { workMinutes: int(p.workMinutes, 1, 180, '专注时长'), shortMinutes: int(p.shortMinutes, 1, 60, '短休息时长'), longMinutes: int(p.longMinutes, 1, 60, '长休息时长'), rounds: int(p.rounds, 1, 12, '长休息轮次') },
    reminders: rules, healthEnabled: v.healthEnabled, alwaysOnTop: v.alwaysOnTop, compact: v.compact, soundEnabled: v.soundEnabled
  };
}
export interface FocusState { mode: Mode; status: FocusStatus; remainingMs: number; totalMs: number; completedRounds: number; sessionId: string }
export interface Occurrence {
  id: string; ruleId: RuleId; state: 'pending' | 'running' | 'ready' | 'snoozed';
  remainingMs: number; snoozeMs: number; preview: boolean;
}
export interface DayStats { focusMs: number; focusCompleted: number; healthCompleted: number }
export interface UpdateState {
  phase: 'manual' | 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'installing' | 'error';
  message: string;
  currentVersion: string;
  nextVersion?: string;
}
export interface ActivityEvent { id: string; type: string; occurredAtUtc: string; localDate: string; offsetMinutes: number; entityId?: string; preview?: boolean; [key: string]: unknown }
export interface Runtime {
  focus: FocusState; remaining: Record<RuleId, number>; occurrences: Occurrence[];
  notice: { id: string; kind: 'break' | 'focus' } | null;
  quietUntil: number | null; graceMs: number; cardVisible: boolean; cardAgeMs: number; alertSequence: number;
}
export interface PersistedState {
  schemaVersion: 1; settings: Settings; settingsRevision: number; runtime: Runtime;
  stats: Record<string, DayStats>; position?: { x: number; y: number };
}
export interface Snapshot {
  settings: Settings; settingsRevision: number; focus: FocusState;
  occurrences: Occurrence[]; notice: Runtime['notice']; cardVisible: boolean; alertSequence: number;
  quietRemainingMs: number; graceMs: number; systemPaused: boolean;
  nextReminder: { ruleId: RuleId; remainingMs: number } | null;
  today: DayStats; pendingCount: number; storageError: string | null; recovered: boolean;
  update?: UpdateState;
}
export type Command =
  | { type: 'focus.start' | 'focus.pause' | 'focus.reset' }
  | { type: 'focus.select'; mode: Mode }
  | { type: 'settings.update'; settings: Settings; revision: number }
  | { type: 'health.toggle'; enabled: boolean }
  | { type: 'meeting.toggle' | 'settings.defaults' }
  | { type: 'reminder.start' | 'reminder.complete' | 'reminder.snooze' | 'reminder.skip'; id: string }
  | { type: 'reminder.preview'; ruleId: RuleId }
  | { type: 'reminders.open' | 'reminders.collapse' | 'notice.dismiss' }
  | { type: 'window.work-plans' | 'window.close-work-plans' }
  | { type: 'update.action' }
  | { type: 'window.settings' | 'window.hide' | 'window.compact' | 'window.pin' | 'window.close-settings' | 'window.menu' | 'app.quit' };
export interface DesktopAPI {
  readonly platform: string;
  getState(): Promise<Snapshot>;
  command(command: Command): Promise<Snapshot>;
  getWorkPlans(): Promise<WorkPlanView>;
  changeWorkPlan(change: WorkPlanChange): Promise<WorkPlanView>;
  onState(listener: (state: Snapshot) => void): () => void;
  onSound(listener: () => void): () => void;
}
declare global { interface Window { xijian: DesktopAPI } }
