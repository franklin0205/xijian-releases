export const WORK_TITLE_LIMIT = 120;
export const WORK_NOTE_LIMIT = 600;

export interface WorkPlanDraft {
  title: string;
  note: string;
  plannedOn: string | null;
}

export interface WorkPlan extends WorkPlanDraft {
  id: string;
  completedAt: string | null;
}

export interface WorkPlanData {
  schemaVersion: 1;
  items: WorkPlan[];
}

export interface WorkPlanView {
  items: WorkPlan[];
  readOnlyReason: string | null;
}

export type WorkPlanChange =
  | { type: 'add'; draft: WorkPlanDraft }
  | { type: 'edit'; id: string; draft: WorkPlanDraft }
  | { type: 'set-completed'; id: string; completed: boolean };

function isPlannedDate(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateDraft(value: unknown): WorkPlanDraft {
  if (!value || typeof value !== 'object') throw new Error('工作计划格式不正确');
  const draft = value as Partial<WorkPlanDraft>;
  const title = typeof draft.title === 'string' ? draft.title.trim() : '';
  if (!title || title.length > WORK_TITLE_LIMIT) throw new Error(`工作名称需填写 1–${WORK_TITLE_LIMIT} 个字符`);
  if (typeof draft.note !== 'string' || draft.note.length > WORK_NOTE_LIMIT) throw new Error(`备注不能超过 ${WORK_NOTE_LIMIT} 个字符`);
  if (!isPlannedDate(draft.plannedOn)) throw new Error('请选择有效的计划日期');
  return { title, note: draft.note.trim(), plannedOn: draft.plannedOn };
}

export function validateWorkPlanData(raw: unknown): WorkPlanData {
  const data = raw as Partial<WorkPlanData> | null;
  if (data?.schemaVersion !== 1 || !Array.isArray(data.items)) throw new Error('工作计划文件格式不正确');
  const ids = new Set<string>();
  const items = data.items.map(item => {
    const draft = validateDraft(item);
    if (typeof item.id !== 'string' || !item.id || item.id.length > 100 || ids.has(item.id)) {
      throw new Error('工作计划编号无效');
    }
    if (item.completedAt !== null && (typeof item.completedAt !== 'string' || !Number.isFinite(Date.parse(item.completedAt)))) {
      throw new Error('工作计划完成时间无效');
    }
    ids.add(item.id);
    return { ...draft, id: item.id, completedAt: item.completedAt };
  });
  return { schemaVersion: 1, items };
}

export function applyWorkPlanChange(data: WorkPlanData, raw: unknown): WorkPlanData {
  if (!raw || typeof raw !== 'object') throw new Error('工作计划操作格式不正确');
  const change = raw as WorkPlanChange;
  if (change.type === 'add') {
    const item = { ...validateDraft(change.draft), id: crypto.randomUUID(), completedAt: null };
    return { ...data, items: [...data.items, item] };
  }
  if (change.type !== 'edit' && change.type !== 'set-completed') throw new Error('不支持的工作计划操作');
  const index = data.items.findIndex(item => item.id === change.id);
  if (index < 0) throw new Error('找不到这条工作计划');
  const items = [...data.items];
  if (change.type === 'edit') {
    items[index] = { ...items[index], ...validateDraft(change.draft) };
  } else {
    if (typeof change.completed !== 'boolean') throw new Error('完成状态无效');
    const completedAt = change.completed ? items[index].completedAt ?? new Date().toISOString() : null;
    items[index] = { ...items[index], completedAt };
  }
  return { ...data, items };
}
