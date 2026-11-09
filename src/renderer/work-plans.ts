import './work-plans.css';
import { localDay } from '../shared';
import { WORK_NOTE_LIMIT, WORK_TITLE_LIMIT, type WorkPlan, type WorkPlanChange, type WorkPlanDraft } from '../domain/work-plans';
import { icon } from './icons';

type Filter = 'date' | 'pending' | 'completed';
const FILTER_NAMES: Record<Filter, string> = { date: '按日期', pending: '待完成', completed: '已完成' };
const EMPTY_MESSAGES: Record<Filter, string> = {
  date: '这一天暂无工作计划。',
  pending: '暂无待完成事项，可以在上方添加新的计划。',
  completed: '完成的事项会显示在这里。'
};
const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const completionFormat = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });

function utcDate(day: string) {
  return new Date(`${day}T00:00:00Z`);
}

function shiftDay(day: string, days: number): string | null {
  const date = utcDate(day);
  date.setUTCDate(date.getUTCDate() + days);
  const year = date.getUTCFullYear();
  return year >= 1 && year <= 9999 ? date.toISOString().slice(0, 10) : null;
}

function weekdayIndex(day: string) {
  return (utcDate(day).getUTCDay() + 6) % 7;
}

function monthLabel(day: string, showYear: boolean) {
  const year = showYear ? `${Number(day.slice(0, 4))}年` : '';
  return `${year}${Number(day.slice(5, 7))}月`;
}

function dayLabel(day: string, showYear: boolean) {
  return `${monthLabel(day, showYear)}${Number(day.slice(8))}日`;
}

function actionButton(label: string, action: () => void) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button secondary work-item-button';
  button.textContent = label;
  button.addEventListener('click', action);
  return button;
}

export function mountWorkPlans(root: HTMLElement) {
  root.innerHTML = `<main class="work-frame">
    <section class="work-shell surface">
      <header class="work-header drag">
        <div><span class="eyebrow">息间</span><h1>工作计划</h1></div>
        <button class="icon-btn" id="work-close" type="button" aria-label="关闭工作计划">${icon('close', 16)}</button>
      </header>
      <div class="work-content">
        <section class="work-week" aria-label="工作计划周历">
          <div class="work-week-toolbar">
            <p id="work-month" class="work-month"></p>
            <div class="work-week-actions">
              <button type="button" id="work-previous-week" class="icon-btn" aria-label="上周">${icon('previous', 16)}</button>
              <button type="button" id="work-today" class="button secondary">今天</button>
              <button type="button" id="work-next-week" class="icon-btn" aria-label="下周">${icon('next', 16)}</button>
            </div>
          </div>
          <div class="work-week-grid">
            ${WEEKDAYS.map(label => `<button type="button" class="work-week-day" aria-pressed="false">
              <span class="work-weekday">${label}</span><strong class="num"></strong><span class="work-day-dot" aria-hidden="true"></span>
            </button>`).join('')}
          </div>
        </section>
        <nav class="work-filters" aria-label="按工作状态查看">
          ${(Object.entries(FILTER_NAMES) as [Filter, string][]).map(([key, label]) =>
            `<button type="button" data-work-filter="${key}" aria-pressed="${key === 'date'}">${label}<span class="work-count num"></span></button>`).join('')}
        </nav>
        <details class="work-composer">
          <summary id="work-form-title">新增工作计划</summary>
          <form id="work-form" aria-labelledby="work-form-title">
            <fieldset class="work-form" disabled>
              <div class="work-fields">
                <label>工作名称<input name="title" required maxlength="${WORK_TITLE_LIMIT}" placeholder="例如：整理周会资料"></label>
                <label>计划日期<input name="plannedOn" type="date" min="0001-01-01" max="9999-12-31"></label>
              </div>
              <label>备注 <small class="muted">选填</small><textarea name="note" rows="2" maxlength="${WORK_NOTE_LIMIT}" placeholder="需要记下的细节"></textarea></label>
              <div class="work-form-actions">
                <button type="button" class="button ghost" id="work-cancel" hidden>取消编辑</button>
                <button type="submit" class="button primary" id="work-submit">新增计划</button>
              </div>
            </fieldset>
          </form>
        </details>
        <div id="work-list" class="work-groups" role="region" aria-label="工作记录">
          <p class="work-empty">正在读取工作计划…</p>
        </div>
      </div>
      <p id="work-feedback" class="work-feedback" role="status">计划保存在本机</p>
    </section>
  </main>`;

  const form = root.querySelector<HTMLFormElement>('#work-form')!;
  const composer = root.querySelector<HTMLDetailsElement>('.work-composer')!;
  const fields = form.querySelector<HTMLFieldSetElement>('fieldset')!;
  const title = form.elements.namedItem('title') as HTMLInputElement;
  const date = form.elements.namedItem('plannedOn') as HTMLInputElement;
  const note = form.elements.namedItem('note') as HTMLTextAreaElement;
  const formTitle = root.querySelector('#work-form-title')!;
  const submit = root.querySelector('#work-submit')!;
  const cancel = root.querySelector<HTMLButtonElement>('#work-cancel')!;
  const filters = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-work-filter]'));
  const month = root.querySelector('#work-month')!;
  const weekButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('.work-week-day'));
  const previousWeek = root.querySelector<HTMLButtonElement>('#work-previous-week')!;
  const nextWeek = root.querySelector<HTMLButtonElement>('#work-next-week')!;
  const list = root.querySelector('#work-list')!;
  const feedback = root.querySelector<HTMLParagraphElement>('#work-feedback')!;
  let items: WorkPlan[] = [];
  let filter: Filter = 'date';
  let editingId: string | null = null;
  let addDraft: WorkPlanDraft | null = null;
  let busy = false;
  let available = false;
  let today = localDay(Date.now());
  let selectedDay = today;
  date.value = selectedDay;

  function selectDay(day: string) {
    if (!editingId && date.value === selectedDay) date.value = day;
    if (addDraft?.plannedOn === selectedDay) addDraft.plannedOn = day;
    selectedDay = day;
    filter = 'date';
  }

  function readDraft(): WorkPlanDraft {
    return { title: title.value, plannedOn: date.value || null, note: note.value };
  }

  function fillForm(draft: WorkPlanDraft) {
    title.value = draft.title;
    date.value = draft.plannedOn ?? '';
    note.value = draft.note;
  }

  function resetForm() {
    editingId = null;
    formTitle.textContent = '新增工作计划';
    submit.textContent = '新增计划';
    cancel.hidden = true;
    fillForm(addDraft ?? { title: '', plannedOn: selectedDay, note: '' });
    addDraft = null;
  }

  function edit(item: WorkPlan) {
    if (!editingId) addDraft = readDraft();
    editingId = item.id;
    formTitle.textContent = '编辑工作计划';
    submit.textContent = '保存修改';
    cancel.hidden = false;
    fillForm(item);
    composer.open = true;
    title.focus();
  }

  function updateControls() {
    fields.disabled = !available || busy;
    list.querySelectorAll('button').forEach(button => { button.disabled = fields.disabled; });
  }

  function renderWeek() {
    const offset = weekdayIndex(selectedDay);
    const days = WEEKDAYS.map((_, index) => shiftDay(selectedDay, index - offset));
    const visibleDays = days.filter(day => day !== null);
    const first = visibleDays[0];
    const last = visibleDays[visibleDays.length - 1];
    month.textContent = monthLabel(first, true);
    if (first.slice(0, 7) !== last.slice(0, 7)) {
      month.textContent += ` – ${monthLabel(last, first.slice(0, 4) !== last.slice(0, 4))}`;
    }
    previousWeek.disabled = shiftDay(selectedDay, -7) === null;
    nextWeek.disabled = shiftDay(selectedDay, 7) === null;
    weekButtons.forEach((button, index) => {
      const day = days[index];
      button.hidden = day === null;
      if (!day) return;
      const count = items.filter(item => item.plannedOn === day).length;
      button.dataset.day = day;
      button.dataset.hasItems = String(count > 0);
      button.querySelector('strong')!.textContent = String(Number(day.slice(8)));
      button.setAttribute('aria-label', `${dayLabel(day, true)} ${WEEKDAYS[index]}，${count} 项计划`);
      button.setAttribute('aria-pressed', String(filter === 'date' && day === selectedDay));
      if (day === today) button.setAttribute('aria-current', 'date');
      else button.removeAttribute('aria-current');
    });
  }

  function taskRow(item: WorkPlan, index: number) {
    const row = document.createElement('li');
    row.className = 'work-item';
    const heading = document.createElement('h3');
    heading.textContent = item.title;
    row.append(heading);
    if (item.completedAt) {
      const meta = document.createElement('p');
      meta.className = 'work-item-meta';
      meta.textContent = `完成于 ${completionFormat.format(new Date(item.completedAt))}`;
      row.append(meta);
    }
    if (item.note) {
      const detail = document.createElement('p');
      detail.className = 'work-item-note';
      detail.textContent = item.note;
      row.append(detail);
    }
    const actions = document.createElement('div');
    actions.className = 'work-item-actions';
    const completed = !item.completedAt;
    const toggle = actionButton(completed ? '标记完成' : '恢复待完成', () => {
      void saveChange({ type: 'set-completed', id: item.id, completed }, completed ? '已标记完成' : '已恢复为待完成', () => {
        const buttons = list.querySelectorAll<HTMLButtonElement>('.work-item-primary');
        const next = buttons[Math.min(index, buttons.length - 1)];
        (next ?? filters.find(button => button.dataset.workFilter === filter))?.focus();
      });
    });
    toggle.classList.add('work-item-primary');
    actions.append(actionButton('编辑', () => edit(item)), toggle);
    row.append(actions);
    return row;
  }

  function emptyMessage(text: string) {
    const message = document.createElement('p');
    message.className = 'work-empty';
    message.textContent = text;
    return message;
  }

  function renderDay(day: string | null, records: WorkPlan[], firstIndex: number) {
    const section = document.createElement('section');
    const heading = document.createElement('h2');
    heading.id = `work-day-${day ?? 'undated'}`;
    heading.textContent = day ? dayLabel(day, day.slice(0, 4) !== today.slice(0, 4)) : '未定日期';
    const header = document.createElement('header');
    header.className = 'work-date-heading';
    header.append(heading);
    if (day) {
      const weekday = document.createElement('span');
      weekday.className = 'muted';
      weekday.textContent = WEEKDAYS[weekdayIndex(day)];
      header.append(weekday);
      const isOverdue = day < today && records.some(item => !item.completedAt);
      if (day === today || isOverdue) {
        const badge = document.createElement('span');
        badge.className = isOverdue ? 'badge coral work-overdue' : 'badge';
        badge.textContent = isOverdue ? '已过计划日期' : '今天';
        header.append(badge);
      }
    }
    const count = document.createElement('span');
    count.className = 'muted work-date-count';
    count.textContent = `${records.length} 项`;
    header.append(count);
    section.append(header);
    section.setAttribute('aria-labelledby', heading.id);
    if (records.length) {
      const tasks = document.createElement('ul');
      tasks.className = 'work-list';
      tasks.setAttribute('aria-labelledby', heading.id);
      records.forEach((item, index) => tasks.append(taskRow(item, firstIndex + index)));
      section.append(tasks);
    } else {
      section.append(emptyMessage(EMPTY_MESSAGES.date));
    }
    return section;
  }

  function renderList() {
    today = localDay(Date.now());
    renderWeek();
    const groups: Record<Filter, WorkPlan[]> = {
      date: items.filter(item => item.plannedOn === selectedDay),
      pending: items.filter(item => !item.completedAt),
      completed: items.filter(item => item.completedAt)
    };
    for (const button of filters) {
      const key = button.dataset.workFilter as Filter;
      button.setAttribute('aria-pressed', String(key === filter));
      button.querySelector('.work-count')!.textContent = String(groups[key].length);
    }
    const byDate = new Map<string | null, WorkPlan[]>();
    if (filter === 'date') byDate.set(selectedDay, []);
    for (const item of groups[filter]) {
      const group = byDate.get(item.plannedOn) ?? [];
      group.push(item);
      byDate.set(item.plannedOn, group);
    }
    const ordered = [...byDate.entries()].sort(([a], [b]) => {
      if (a === null) return b === null ? 0 : 1;
      if (b === null) return -1;
      return filter === 'completed' ? b.localeCompare(a) : a.localeCompare(b);
    });
    let firstIndex = 0;
    const sections = ordered.map(([day, group]) => {
      if (filter === 'completed') {
        group.sort((a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!));
      } else {
        group.sort((a, b) => Number(!!a.completedAt) - Number(!!b.completedAt));
      }
      const section = renderDay(day, group, firstIndex);
      firstIndex += group.length;
      return section;
    });
    list.replaceChildren(...(sections.length ? sections : [emptyMessage(EMPTY_MESSAGES[filter])]));
    updateControls();
  }

  function showError(error: unknown) {
    const message = error instanceof Error ? error.message : '工作计划操作未完成，请重试';
    feedback.textContent = message.replace(/^Error invoking remote method '[^']+': Error: /, '');
    feedback.classList.add('work-feedback-error');
  }

  async function saveChange(change: WorkPlanChange, message: string, afterSave: () => void) {
    if (!available || busy) return;
    busy = true;
    updateControls();
    feedback.textContent = '正在保存…';
    feedback.classList.remove('work-feedback-error');
    try {
      items = (await window.xijian.changeWorkPlan(change)).items;
    } catch (error) {
      showError(error);
      return;
    } finally {
      busy = false;
      updateControls();
    }
    if (change.type === 'add' || (change.type === 'edit' && filter === 'date')) {
      if (change.draft.plannedOn) selectDay(change.draft.plannedOn);
      else filter = change.type === 'edit' && items.find(item => item.id === change.id)?.completedAt ? 'completed' : 'pending';
    }
    renderList();
    feedback.textContent = message;
    afterSave();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const draft = readDraft();
    const change: WorkPlanChange = editingId ? { type: 'edit', id: editingId, draft } : { type: 'add', draft };
    void saveChange(change, editingId ? '修改已保存' : '工作计划已新增', () => {
      const hasAddDraft = addDraft && (addDraft.title || addDraft.note || addDraft.plannedOn !== selectedDay);
      resetForm();
      if (hasAddDraft) {
        title.focus();
      } else {
        composer.open = false;
        (formTitle as HTMLElement).focus();
      }
    });
  });
  cancel.addEventListener('click', () => { resetForm(); title.focus(); });
  for (const button of filters) {
    button.addEventListener('click', () => { filter = button.dataset.workFilter as Filter; renderList(); });
  }
  for (const button of weekButtons) {
    button.addEventListener('click', () => {
      if (!button.dataset.day) return;
      selectDay(button.dataset.day);
      renderList();
    });
  }
  for (const [button, step] of [[previousWeek, -7], [nextWeek, 7]] as const) {
    button.addEventListener('click', () => {
      const day = shiftDay(selectedDay, step);
      if (!day) return;
      selectDay(day);
      renderList();
    });
  }
  root.querySelector('#work-today')!.addEventListener('click', () => {
    selectDay(localDay(Date.now()));
    renderList();
  });
  const close = () => { void window.xijian.command({ type: 'window.close-work-plans' }).catch(showError); };
  root.querySelector('#work-close')!.addEventListener('click', close);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });

  void window.xijian.getWorkPlans().then(state => {
    items = state.items;
    available = !state.readOnlyReason;
    composer.open = available && items.length === 0;
    renderList();
    if (state.readOnlyReason) showError(new Error(state.readOnlyReason));
    else if (composer.open) title.focus();
    window.setInterval(() => {
      const day = localDay(Date.now());
      if (day === today) return;
      if (selectedDay === today) {
        const currentFilter = filter;
        selectDay(day);
        filter = currentFilter;
      }
      renderList();
    }, 30_000);
  }).catch(error => {
    list.replaceChildren(emptyMessage('暂时无法打开工作计划，请重开窗口。'));
    showError(error);
  });
}
