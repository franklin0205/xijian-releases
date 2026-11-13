"use strict";
(() => {
  // src/renderer/icons.ts
  var paths = {
    pin: '<path d="m16 3 5 5-4 1-2 5-3 3-5-5 3-3 5-2z"/><path d="m2 22 5-5"/>',
    settings: '<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3z"/><circle cx="12" cy="12" r="3"/>',
    mini: '<path d="M8 3v5H3m18 8h-5v5M3 8l6-6m12 14-6 6"/>',
    expand: '<path d="M8 3H3v5m13 13h5v-5M3 3l6 6m12 12-6-6"/>',
    reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
    play: '<path d="m8 5 11 7-11 7z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    water: '<path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11Z"/><path d="M9 14a3 3 0 0 0 3 3"/>',
    move: '<path d="M2 12h5l3-8 4 16 3-8h5"/>',
    moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    work: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m7 9 1.5 1.5L11 8m2 2h4M7 15h4m2 0h4"/>',
    previous: '<path d="m15 18-6-6 6-6"/>',
    next: '<path d="m9 18 6-6-6-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    quiet: '<path d="M9 9v3a3 3 0 0 0 5 2M15 9V5a3 3 0 0 0-5-2M5 10v2a7 7 0 0 0 11 6M19 10v2M12 19v3M8 22h8M3 3l18 18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    leaf: '<path d="M20 4c-9-2-15 2-15 8a6 6 0 0 0 6 6c6 0 9-6 9-14Z"/><path d="m4 21 11-11"/>',
    tray: '<path d="M3 12v7h18v-7M12 3v12m-4-4 4 4 4-4"/>'
  };
  function icon(name, size = 18) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.clock}</svg>`;
  }

  // src/shared.ts
  var RULE_INFO = {
    eyes: { name: "\u8FDC\u773A", title: "\u8BA9\u89C6\u7EBF\u53BB\u8FDC\u5904\u8D70\u8D70", description: "\u770B\u5411\u7A97\u5916\u6216\u8F83\u8FDC\u7684\u4F4D\u7F6E\uFF0C\u6682\u65F6\u653E\u4E0B\u5C4F\u5E55\u3002", icon: "eye", color: "sage" },
    water: { name: "\u559D\u6C34", title: "\u505C\u4E00\u4E0B\uFF0C\u559D\u51E0\u53E3\u6C34", description: "\u62FF\u8D77\u6C34\u676F\uFF0C\u6309\u81EA\u5DF1\u7684\u9700\u8981\u8865\u5145\u4E00\u70B9\u6C34\u5206\u3002", icon: "water", color: "lavender" },
    move: { name: "\u8D77\u8EAB", title: "\u8D77\u6765\u6D3B\u52A8\u4E00\u4E0B\u5427", description: "\u79BB\u5F00\u5EA7\u4F4D\u8D70\u4E00\u8D70\uFF0C\u8F7B\u8F7B\u8212\u5C55\u8EAB\u4F53\u3002", icon: "move", color: "coral" },
    close: { name: "\u95ED\u773C", title: "\u8BA9\u773C\u775B\u5B89\u9759\u4E00\u4F1A\u513F", description: "\u5728\u5B89\u5168\u3001\u8212\u9002\u7684\u73AF\u5883\u91CC\uFF0C\u8F7B\u8F7B\u95ED\u773C\u653E\u677E\u3002", icon: "moon", color: "lavender" }
  };
  var MODE_NAMES = { focus: "\u4E13\u6CE8", short: "\u77ED\u4F11\u606F", long: "\u957F\u4F11\u606F" };
  function localDay(time2) {
    const date = new Date(time2);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  // src/domain/work-plans.ts
  var WORK_TITLE_LIMIT = 120;
  var WORK_NOTE_LIMIT = 600;

  // src/renderer/work-plans.ts
  var FILTER_NAMES = { date: "\u65E5\u5386\u603B\u89C8", pending: "\u5F85\u5B8C\u6210", completed: "\u5DF2\u5B8C\u6210" };
  var VIEW_NAMES = { month: "\u6708", week: "\u5468", day: "\u65E5" };
  var WEEKDAYS = ["\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D", "\u5468\u65E5"];
  var completionFormat = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" });
  var utcDate = (day) => /* @__PURE__ */ new Date(`${day}T00:00:00Z`);
  function shiftDay(day, days) {
    const date = utcDate(day);
    date.setUTCDate(date.getUTCDate() + days);
    return date.getUTCFullYear() >= 1 && date.getUTCFullYear() <= 9999 ? date.toISOString().slice(0, 10) : null;
  }
  function shiftMonth(day, step) {
    const date = utcDate(day);
    const originalDay = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + step);
    if (date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999) return null;
    const month = date.getUTCMonth();
    date.setUTCDate(originalDay);
    if (date.getUTCMonth() !== month) date.setUTCDate(0);
    return date.toISOString().slice(0, 10);
  }
  var weekdayIndex = (day) => (utcDate(day).getUTCDay() + 6) % 7;
  var monthLabel = (day, year = true) => `${year ? `${Number(day.slice(0, 4))}\u5E74` : ""}${Number(day.slice(5, 7))}\u6708`;
  var dayLabel = (day, year = true) => `${monthLabel(day, year)}${Number(day.slice(8))}\u65E5`;
  var weekDays = (day) => WEEKDAYS.map((_, i) => shiftDay(day, i - weekdayIndex(day)));
  function monthDays(day) {
    const first = `${day.slice(0, 7)}-01`;
    return Array.from({ length: 42 }, (_, i) => shiftDay(first, i - weekdayIndex(first)));
  }
  function button(label, className, action) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = className;
    element.textContent = label;
    element.addEventListener("click", action);
    return element;
  }
  function mountWorkPlans(root2) {
    root2.innerHTML = `<main class="work-frame"><section class="work-shell surface">
    <header class="work-header drag">
      <div class="work-brand">${icon("leaf", 18)}<span>\u606F\u95F4</span><span class="work-header-divider"></span><h1>\u5DE5\u4F5C\u8BA1\u5212</h1></div>
      <span class="work-header-caption">\u7559\u51FA\u4E13\u6CE8\uFF0C\u4E5F\u7559\u51FA\u4F11\u606F</span>
      <button class="icon-btn" id="work-close" type="button" aria-label="\u5173\u95ED\u5DE5\u4F5C\u8BA1\u5212">${icon("close", 16)}</button>
    </header>
    <div class="work-body">
      <aside class="work-sidebar" aria-label="\u8BA1\u5212\u5BFC\u822A">
        <button type="button" id="work-add" class="button coral full"><span aria-hidden="true">\uFF0B</span>\u65B0\u589E\u5DE5\u4F5C\u8BA1\u5212</button>
        <section class="work-mini-calendar" aria-label="\u65E5\u671F\u5BFC\u822A">
          <div class="work-mini-toolbar"><h2 id="work-mini-month"></h2><div class="row">
            <button type="button" id="work-mini-previous" class="icon-btn" aria-label="\u6708\u5386\u4E0A\u4E2A\u6708">${icon("previous", 14)}</button>
            <button type="button" id="work-mini-next" class="icon-btn" aria-label="\u6708\u5386\u4E0B\u4E2A\u6708">${icon("next", 14)}</button>
          </div></div>
          <div class="work-mini-weekdays" aria-hidden="true">${WEEKDAYS.map((day) => `<span>${day.slice(1)}</span>`).join("")}</div>
          <div id="work-mini-grid" class="work-mini-grid"></div>
        </section>
        <p class="work-section-label">\u6211\u7684\u8BA1\u5212</p>
        <nav class="work-filters" aria-label="\u6309\u5DE5\u4F5C\u72B6\u6001\u67E5\u770B">
          ${Object.entries(FILTER_NAMES).map(([key, label]) => `<button type="button" data-work-filter="${key}" aria-pressed="${key === "date"}"><span class="work-filter-icon">${icon(key === "completed" ? "check" : key === "pending" ? "clock" : "work", 16)}</span>${label}<span class="work-count num"></span></button>`).join("")}
        </nav>
        <section class="work-today-summary" aria-label="\u4ECA\u65E5\u8BA1\u5212\u8FDB\u5EA6">
          <div class="row between"><h2>\u4ECA\u65E5\u8282\u594F</h2><span id="work-today-count" class="num"></span></div>
          <p id="work-today-summary"></p><progress id="work-progress" max="1" value="0" aria-label="\u4ECA\u65E5\u8BA1\u5212\u5B8C\u6210\u8FDB\u5EA6"></progress>
        </section>
        <p class="work-sidebar-note">${icon("leaf", 15)}<span>\u4E00\u6B21\u4E13\u6CE8\u4E00\u4EF6\u4E8B\u3002<br>\u7ED9\u6BCF\u4E00\u5929\u7559\u4E00\u70B9\u7A7A\u767D\u3002</span></p>
      </aside>
      <section class="work-main" aria-label="\u5DE5\u4F5C\u8BB0\u5F55">
        <div class="work-toolbar">
          <div><h2 id="work-month"></h2><p id="work-range-note" class="work-range-note"></p></div>
          <div class="work-view-switch" aria-label="\u65E5\u5386\u89C6\u56FE">${Object.entries(VIEW_NAMES).map(([key, label]) => `<button type="button" data-work-view="${key}" aria-pressed="${key === "week"}">${label}</button>`).join("")}</div>
          <div class="work-period-actions">
            <button type="button" id="work-previous-week" class="icon-btn" aria-label="\u4E0A\u5468">${icon("previous", 16)}</button>
            <button type="button" id="work-today" class="button secondary">\u4ECA\u5929</button>
            <button type="button" id="work-next-week" class="icon-btn" aria-label="\u4E0B\u5468">${icon("next", 16)}</button>
          </div>
        </div>
        <div class="work-content" tabindex="0" aria-label="\u6EDA\u52A8\u67E5\u770B\u8BA1\u5212">
          <div id="work-calendar" class="work-calendar">
            <div class="work-week-grid" aria-label="\u5DE5\u4F5C\u8BA1\u5212\u5468\u5386">${WEEKDAYS.map((label) => `<button type="button" class="work-week-day" aria-pressed="false"><span class="work-weekday">${label}</span><strong class="num"></strong><span class="work-day-dot" aria-hidden="true"></span></button>`).join("")}</div>
            <div id="work-list" class="work-groups"><p class="work-empty">\u6B63\u5728\u8BFB\u53D6\u5DE5\u4F5C\u8BA1\u5212\u2026</p></div>
          </div>
        </div>
        <footer class="work-footer"><p id="work-feedback" role="status">\u8BA1\u5212\u4FDD\u5B58\u5728\u672C\u673A</p><span id="work-footer-note">\u6309\u65E5\u671F\u5B89\u6392\uFF0C\u6309\u81EA\u5DF1\u7684\u8282\u594F\u5B8C\u6210</span></footer>
      </section>
    </div>
    <dialog class="work-composer" aria-labelledby="work-form-title">
      <div class="work-editor-header"><div><p class="eyebrow">\u5B89\u6392\u4E0B\u4E00\u4EF6\u4E8B</p><h2 id="work-form-title">\u65B0\u589E\u5DE5\u4F5C\u8BA1\u5212</h2></div><button type="button" id="work-editor-close" class="icon-btn" aria-label="\u6536\u8D77\u8BA1\u5212\u7F16\u8F91">${icon("close", 16)}</button></div>
      <form id="work-form" aria-labelledby="work-form-title"><fieldset class="work-form" disabled>
        <label>\u5DE5\u4F5C\u540D\u79F0<input name="title" required maxlength="${WORK_TITLE_LIMIT}" placeholder="\u4F8B\u5982\uFF1A\u6574\u7406\u5468\u4F1A\u8D44\u6599"></label>
        <div><label>\u8BA1\u5212\u65E5\u671F<input name="plannedOn" type="date" min="0001-01-01" max="9999-12-31" aria-describedby="work-date-help"></label><small id="work-date-help" class="work-field-help">\u7559\u7A7A\u65F6\uFF0C\u8BA1\u5212\u4F1A\u6536\u5728\u300C\u5F85\u5B8C\u6210\u300D\u4E2D\u3002</small></div>
        <label>\u5907\u6CE8 <small class="muted">\u9009\u586B</small><textarea name="note" rows="3" maxlength="${WORK_NOTE_LIMIT}" placeholder="\u8BB0\u4E0B\u76EE\u6807\u3001\u6B65\u9AA4\u6216\u9700\u8981\u786E\u8BA4\u7684\u7EC6\u8282"></textarea></label>
        <p id="work-form-error" class="work-feedback-error" role="alert" hidden></p>
        <div class="work-form-actions"><button type="button" class="button ghost" id="work-cancel" hidden>\u53D6\u6D88\u7F16\u8F91</button><button type="submit" class="button primary" id="work-submit">\u65B0\u589E\u8BA1\u5212</button></div>
      </fieldset></form>
    </dialog>
  </section></main>`;
    const get = (selector) => root2.querySelector(selector);
    const form = get("#work-form");
    const composer = get(".work-composer");
    const fields = get(".work-form");
    const title = form.elements.namedItem("title");
    const date = form.elements.namedItem("plannedOn");
    const note = form.elements.namedItem("note");
    const cancel = get("#work-cancel");
    const filters = Array.from(root2.querySelectorAll("[data-work-filter]"));
    const views = Array.from(root2.querySelectorAll("[data-work-view]"));
    const weekButtons = Array.from(root2.querySelectorAll(".work-week-day"));
    const previous = get("#work-previous-week");
    const next = get("#work-next-week");
    const list = get("#work-list");
    const feedback = get("#work-feedback");
    const formError = get("#work-form-error");
    let items = [];
    let filter = "date";
    let view2 = "week";
    let editingId = null;
    let addDraft = null;
    let busy = false;
    let available = false;
    let today = localDay(Date.now());
    let selectedDay = today;
    let miniMonth = today;
    let renderedSelection = "";
    let editorTrigger = null;
    date.value = selectedDay;
    function selectDay(day) {
      if (!editingId && date.value === selectedDay) date.value = day;
      if (addDraft?.plannedOn === selectedDay) addDraft.plannedOn = day;
      selectedDay = day;
      miniMonth = day;
      filter = "date";
    }
    const readDraft = () => ({ title: title.value, plannedOn: date.value || null, note: note.value });
    function fillForm(draft) {
      title.value = draft.title;
      date.value = draft.plannedOn ?? "";
      note.value = draft.note;
    }
    function resetForm() {
      editingId = null;
      get("#work-form-title").textContent = "\u65B0\u589E\u5DE5\u4F5C\u8BA1\u5212";
      get("#work-submit").textContent = "\u65B0\u589E\u8BA1\u5212";
      cancel.hidden = true;
      fillForm(addDraft ?? { title: "", plannedOn: selectedDay, note: "" });
      addDraft = null;
      formError.hidden = true;
    }
    function openEditor(trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null) {
      editorTrigger = trigger;
      if (!composer.open) composer.showModal();
      title.focus();
    }
    function closeEditor() {
      if (busy) return;
      composer.close();
      (editorTrigger?.isConnected ? editorTrigger : get("#work-add")).focus();
    }
    function add(day) {
      if (editingId) resetForm();
      if (day) {
        selectDay(day);
        date.value = day;
        renderList();
        openEditor(root2.querySelector(`section[aria-labelledby="work-day-${day}"] .work-quick-add`));
      } else openEditor();
    }
    function edit(item) {
      if (!editingId) addDraft = readDraft();
      editingId = item.id;
      get("#work-form-title").textContent = "\u7F16\u8F91\u5DE5\u4F5C\u8BA1\u5212";
      get("#work-submit").textContent = "\u4FDD\u5B58\u4FEE\u6539";
      cancel.hidden = false;
      fillForm(item);
      formError.hidden = true;
      openEditor();
    }
    function updateControls() {
      fields.disabled = !available || busy;
      list.querySelectorAll("[data-mutation]").forEach((control) => {
        control.disabled = fields.disabled;
      });
      get("#work-add").disabled = fields.disabled;
      get("#work-editor-close").disabled = busy;
    }
    function renderMiniCalendar() {
      get("#work-mini-month").textContent = monthLabel(miniMonth);
      get("#work-mini-previous").disabled = shiftMonth(miniMonth, -1) === null;
      get("#work-mini-next").disabled = shiftMonth(miniMonth, 1) === null;
      get("#work-mini-grid").replaceChildren(...monthDays(miniMonth).map((day) => {
        if (!day) return document.createElement("span");
        const cell = button(String(Number(day.slice(8))), "work-mini-day num", () => {
          selectDay(day);
          renderList();
          root2.querySelector(`[data-mini-day="${day}"]`)?.focus();
        });
        cell.dataset.miniDay = day;
        cell.dataset.outside = String(day.slice(0, 7) !== miniMonth.slice(0, 7));
        cell.dataset.hasItems = String(items.some((item) => item.plannedOn === day));
        cell.setAttribute("aria-label", dayLabel(day));
        cell.setAttribute("aria-pressed", String(day === selectedDay));
        if (day === today) cell.setAttribute("aria-current", "date");
        return cell;
      }));
    }
    function periodStep(step) {
      return view2 === "month" ? shiftMonth(selectedDay, step) : shiftDay(selectedDay, step * (view2 === "week" ? 7 : 1));
    }
    function renderCalendarHeader() {
      const days = weekDays(selectedDay);
      const valid = days.filter((day) => day !== null);
      const first = valid[0], last = valid[valid.length - 1];
      let label = view2 === "day" ? dayLabel(selectedDay) : monthLabel(view2 === "week" ? first : selectedDay);
      if (view2 === "week" && first.slice(0, 7) !== last.slice(0, 7)) label += ` \u2013 ${monthLabel(last, first.slice(0, 4) !== last.slice(0, 4))}`;
      get("#work-month").textContent = filter === "date" ? label : FILTER_NAMES[filter];
      const count = items.filter((item) => item.plannedOn && (view2 === "week" ? valid.includes(item.plannedOn) : view2 === "day" ? item.plannedOn === selectedDay : item.plannedOn.slice(0, 7) === selectedDay.slice(0, 7))).length;
      get("#work-range-note").textContent = filter === "date" ? `${view2 === "week" ? `${dayLabel(first, false)} \u2014 ${dayLabel(last, false)}` : view2 === "day" ? WEEKDAYS[weekdayIndex(selectedDay)] : "\u6574\u6708\u5B89\u6392\uFF0C\u4E00\u773C\u53EF\u89C1"} \xB7 ${count} \u9879\u8BA1\u5212` : filter === "pending" ? "\u6309\u8BA1\u5212\u65E5\u671F\u6392\u5217\uFF0C\u4E5F\u6536\u4E0B\u6682\u672A\u786E\u5B9A\u65E5\u671F\u7684\u4E8B" : "\u6BCF\u4E00\u4EF6\u5B8C\u6210\u7684\u5C0F\u4E8B\uFF0C\u90FD\u503C\u5F97\u88AB\u8BB0\u4E0B";
      for (const control of views) control.setAttribute("aria-pressed", String(filter === "date" && control.dataset.workView === view2));
      get(".work-period-actions").hidden = filter !== "date";
      const periodName = view2 === "month" ? "\u4E2A\u6708" : view2 === "week" ? "\u5468" : "\u4E00\u5929";
      previous.setAttribute("aria-label", `\u4E0A${periodName}`);
      next.setAttribute("aria-label", `\u4E0B${periodName}`);
      previous.disabled = periodStep(-1) === null;
      next.disabled = periodStep(1) === null;
      get(".work-week-grid").hidden = filter !== "date" || view2 !== "week";
      weekButtons.forEach((control, index) => {
        const day = days[index];
        control.hidden = !day;
        control.style.gridColumn = String(index + 1);
        if (!day) return;
        control.dataset.day = day;
        control.dataset.hasItems = String(items.some((item) => item.plannedOn === day));
        control.querySelector("strong").textContent = String(Number(day.slice(8)));
        control.setAttribute("aria-label", `${dayLabel(day)} ${WEEKDAYS[index]}`);
        control.setAttribute("aria-pressed", String(day === selectedDay));
        if (day === today) control.setAttribute("aria-current", "date");
        else control.removeAttribute("aria-current");
      });
    }
    function taskRow(item, index) {
      const row = document.createElement("li");
      row.className = "work-item";
      row.dataset.completed = String(!!item.completedAt);
      const heading = document.createElement("h3");
      heading.textContent = item.title;
      row.append(heading);
      if (item.note) {
        const detail = document.createElement("p");
        detail.className = "work-item-note";
        detail.textContent = item.note;
        row.append(detail);
      }
      if (item.completedAt) {
        const meta = document.createElement("p");
        meta.className = "work-item-meta";
        meta.textContent = `\u5B8C\u6210\u4E8E ${completionFormat.format(new Date(item.completedAt))}`;
        row.append(meta);
      }
      const actions = document.createElement("div");
      actions.className = "work-item-actions";
      const toggle = button("", "work-item-primary", () => {
        void saveChange({ type: "set-completed", id: item.id, completed: !item.completedAt }, item.completedAt ? "\u5DF2\u6062\u590D\u4E3A\u5F85\u5B8C\u6210" : "\u5DF2\u6807\u8BB0\u5B8C\u6210", () => {
          const controls = list.querySelectorAll(".work-item-primary");
          (controls[Math.min(index, controls.length - 1)] ?? filters.find((control) => control.dataset.workFilter === filter))?.focus();
        });
      });
      toggle.dataset.mutation = "";
      toggle.setAttribute("aria-label", item.completedAt ? "\u6062\u590D\u5F85\u5B8C\u6210" : "\u6807\u8BB0\u5B8C\u6210");
      toggle.title = item.completedAt ? "\u6062\u590D\u5F85\u5B8C\u6210" : "\u6807\u8BB0\u5B8C\u6210";
      toggle.innerHTML = `<span class="work-checkbox">${item.completedAt ? icon("check", 12) : ""}</span><span>${item.completedAt ? "\u5DF2\u5B8C\u6210" : "\u5F85\u5B8C\u6210"}</span>`;
      const editButton = button("\u7F16\u8F91", "work-edit", () => edit(item));
      editButton.dataset.mutation = "";
      actions.append(toggle, editButton);
      row.append(actions);
      return row;
    }
    function emptyMessage(text) {
      const message = document.createElement("p");
      message.className = "work-empty";
      message.textContent = text;
      return message;
    }
    const recordsFor = (day) => items.filter((item) => item.plannedOn === day).sort((a, b) => Number(!!a.completedAt) - Number(!!b.completedAt));
    function renderDay(day, records, firstIndex) {
      const section = document.createElement("section");
      section.className = "work-day-section";
      section.dataset.selected = String(day === selectedDay);
      const heading = document.createElement("h2");
      heading.id = `work-day-${day ?? "undated"}`;
      heading.textContent = day ? dayLabel(day, day.slice(0, 4) !== today.slice(0, 4)) : "\u672A\u5B9A\u65E5\u671F";
      const header = document.createElement("header");
      header.className = "work-date-heading";
      header.append(heading);
      const count = document.createElement("span");
      count.className = "work-date-count";
      count.textContent = `${records.length} \u9879`;
      header.append(count);
      if (day && (day === today || day < today && records.some((item) => !item.completedAt))) {
        const badge = document.createElement("span");
        badge.className = "work-date-badge";
        badge.textContent = day < today ? "\u5DF2\u8FC7\u8BA1\u5212\u65E5\u671F" : "\u4ECA\u5929";
        header.append(badge);
      }
      section.append(header);
      section.setAttribute("aria-labelledby", heading.id);
      if (records.length) {
        const tasks = document.createElement("ul");
        tasks.className = "work-list";
        tasks.setAttribute("aria-labelledby", heading.id);
        records.forEach((item, index) => tasks.append(taskRow(item, firstIndex + index)));
        section.append(tasks);
      } else {
        section.append(emptyMessage(filter === "date" && view2 === "week" ? "\u7559\u4E00\u70B9\u7A7A\u767D" : "\u8FD9\u4E00\u5929\u6682\u65E0\u5DE5\u4F5C\u8BA1\u5212\u3002"));
      }
      if (filter === "date" && day) {
        const quickAdd = button("+ \u6DFB\u52A0\u8BA1\u5212", "work-quick-add", () => add(day));
        quickAdd.dataset.mutation = "";
        quickAdd.setAttribute("aria-label", `\u6DFB\u52A0${dayLabel(day)}\u7684\u8BA1\u5212`);
        section.append(quickAdd);
      }
      return section;
    }
    function renderMonth() {
      const monthGrid = document.createElement("div");
      monthGrid.className = "work-month-grid";
      WEEKDAYS.forEach((label) => {
        const cell = document.createElement("div");
        cell.className = "work-month-weekday";
        cell.textContent = label;
        monthGrid.append(cell);
      });
      monthDays(selectedDay).forEach((day) => {
        const cell = document.createElement("section");
        cell.className = "work-month-cell";
        if (!day) {
          monthGrid.append(cell);
          return;
        }
        cell.dataset.outside = String(day.slice(0, 7) !== selectedDay.slice(0, 7));
        cell.dataset.selected = String(day === selectedDay);
        const records = recordsFor(day);
        const openDay = () => {
          selectDay(day);
          view2 = "day";
          renderList();
          get(".work-content").focus();
        };
        const dateButton = button(String(Number(day.slice(8))), "work-month-date num", openDay);
        dateButton.dataset.monthDay = day;
        dateButton.setAttribute("aria-label", `\u67E5\u770B${dayLabel(day)}\uFF0C${records.length}\u9879\u8BA1\u5212`);
        if (day === today) dateButton.setAttribute("aria-current", "date");
        cell.append(dateButton);
        records.slice(0, 2).forEach((item) => {
          const task = button(item.title, "work-month-task", () => edit(item));
          task.dataset.mutation = "";
          task.dataset.completed = String(!!item.completedAt);
          task.title = item.title;
          task.setAttribute("aria-label", `\u7F16\u8F91${item.completedAt ? "\u5DF2\u5B8C\u6210\u8BA1\u5212" : "\u8BA1\u5212"}\uFF1A${item.title}`);
          cell.append(task);
        });
        if (records.length > 2) cell.append(button(`\u8FD8\u6709 ${records.length - 2} \u9879`, "work-month-more", openDay));
        monthGrid.append(cell);
      });
      list.append(monthGrid);
    }
    function renderList() {
      today = localDay(Date.now());
      renderMiniCalendar();
      renderCalendarHeader();
      get("#work-calendar").dataset.layout = filter === "date" ? view2 : "agenda";
      const pending = items.filter((item) => !item.completedAt);
      const todayItems = items.filter((item) => item.plannedOn === today);
      const doneToday = todayItems.filter((item) => item.completedAt).length;
      get("#work-today-count").textContent = `${doneToday} / ${todayItems.length}`;
      get("#work-today-summary").textContent = todayItems.length ? doneToday === todayItems.length ? "\u4ECA\u5929\u7684\u8BA1\u5212\u90FD\u5B8C\u6210\u4E86\uFF0C\u4F11\u606F\u4E00\u4E0B\u5427\u3002" : `\u8FD8\u6709 ${todayItems.length - doneToday} \u4EF6\u4E8B\uFF0C\u6162\u6162\u6765\u3002` : "\u4ECA\u5929\u8FD8\u6CA1\u6709\u5B89\u6392\uFF0C\u4ECE\u4E00\u4EF6\u5C0F\u4E8B\u5F00\u59CB\u3002";
      get("#work-progress").value = todayItems.length ? doneToday / todayItems.length : 0;
      for (const control of filters) {
        const key = control.dataset.workFilter;
        control.setAttribute("aria-pressed", String(key === filter));
        control.querySelector(".work-count").textContent = String(key === "date" ? items.length : key === "pending" ? pending.length : items.length - pending.length);
      }
      list.replaceChildren();
      if (filter === "date" && view2 === "month") renderMonth();
      else if (filter === "date") {
        let index = 0;
        (view2 === "week" ? weekDays(selectedDay) : [selectedDay]).forEach((day, column) => {
          if (!day) return;
          const records = recordsFor(day);
          const section = renderDay(day, records, index);
          if (view2 === "week") section.style.gridColumn = String(column + 1);
          list.append(section);
          index += records.length;
        });
      } else {
        const byDate = /* @__PURE__ */ new Map();
        for (const item of filter === "pending" ? pending : items.filter((item2) => item2.completedAt)) {
          const records = byDate.get(item.plannedOn) ?? [];
          records.push(item);
          byDate.set(item.plannedOn, records);
        }
        const ordered = [...byDate.entries()].sort(([a], [b]) => a === null ? b === null ? 0 : 1 : b === null ? -1 : filter === "completed" ? b.localeCompare(a) : a.localeCompare(b));
        let index = 0;
        for (const [day, records] of ordered) {
          if (filter === "completed") records.sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
          list.append(renderDay(day, records, index));
          index += records.length;
        }
        if (!ordered.length) list.append(emptyMessage(filter === "pending" ? "\u6682\u65E0\u5F85\u5B8C\u6210\u4E8B\u9879\uFF0C\u7ED9\u81EA\u5DF1\u4E00\u70B9\u4F11\u606F\u65F6\u95F4\u3002" : "\u5B8C\u6210\u7684\u4E8B\u9879\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002"));
      }
      updateControls();
      const selection = `${filter}/${view2}/${selectedDay}`;
      if (selection !== renderedSelection && filter === "date" && view2 === "week") {
        weekButtons.find((control) => control.dataset.day === selectedDay)?.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
      renderedSelection = selection;
    }
    function showError(error) {
      const message = (error instanceof Error ? error.message : "\u5DE5\u4F5C\u8BA1\u5212\u64CD\u4F5C\u672A\u5B8C\u6210\uFF0C\u8BF7\u91CD\u8BD5").replace(/^Error invoking remote method '[^']+': Error: /, "");
      feedback.textContent = message;
      feedback.classList.add("work-feedback-error");
      if (composer.open) {
        formError.textContent = message;
        formError.hidden = false;
      }
    }
    async function saveChange(change, message, afterSave) {
      if (!available || busy) return;
      busy = true;
      updateControls();
      feedback.textContent = "\u6B63\u5728\u4FDD\u5B58\u2026";
      feedback.classList.remove("work-feedback-error");
      formError.hidden = true;
      try {
        items = (await window.xijian.changeWorkPlan(change)).items;
      } catch (error) {
        showError(error);
        return;
      } finally {
        busy = false;
        updateControls();
      }
      if (change.type === "add" || change.type === "edit" && filter === "date") {
        if (change.draft.plannedOn) selectDay(change.draft.plannedOn);
        else filter = change.type === "edit" && items.find((item) => item.id === change.id)?.completedAt ? "completed" : "pending";
      }
      renderList();
      feedback.textContent = message;
      afterSave();
    }
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const draft = readDraft();
      const change = editingId ? { type: "edit", id: editingId, draft } : { type: "add", draft };
      void saveChange(change, editingId ? "\u4FEE\u6539\u5DF2\u4FDD\u5B58" : "\u5DE5\u4F5C\u8BA1\u5212\u5DF2\u65B0\u589E", () => {
        const hasAddDraft = addDraft && (addDraft.title || addDraft.note || addDraft.plannedOn !== selectedDay);
        resetForm();
        if (hasAddDraft) title.focus();
        else closeEditor();
      });
    });
    cancel.addEventListener("click", () => {
      resetForm();
      title.focus();
    });
    get("#work-add").addEventListener("click", () => add());
    get("#work-editor-close").addEventListener("click", closeEditor);
    composer.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeEditor();
    });
    for (const control of filters) control.addEventListener("click", () => {
      filter = control.dataset.workFilter;
      renderList();
    });
    for (const control of views) control.addEventListener("click", () => {
      view2 = control.dataset.workView;
      filter = "date";
      renderList();
    });
    for (const control of weekButtons) control.addEventListener("click", () => {
      if (control.dataset.day) {
        selectDay(control.dataset.day);
        renderList();
      }
    });
    for (const [control, step] of [[previous, -1], [next, 1]]) control.addEventListener("click", () => {
      const day = periodStep(step);
      if (day) {
        selectDay(day);
        renderList();
      }
    });
    for (const [id, step] of [["#work-mini-previous", -1], ["#work-mini-next", 1]]) get(id).addEventListener("click", () => {
      const day = shiftMonth(miniMonth, step);
      if (day) {
        miniMonth = day;
        renderMiniCalendar();
      }
    });
    get("#work-today").addEventListener("click", () => {
      selectDay(localDay(Date.now()));
      renderList();
    });
    const close = () => {
      void window.xijian.command({ type: "window.close-work-plans" }).catch(showError);
    };
    get("#work-close").addEventListener("click", close);
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (composer.open) {
        event.preventDefault();
        closeEditor();
      } else close();
    });
    void window.xijian.getWorkPlans().then((state) => {
      items = state.items;
      available = !state.readOnlyReason;
      renderList();
      if (state.readOnlyReason) showError(new Error(state.readOnlyReason));
      window.setInterval(() => {
        const day = localDay(Date.now());
        if (day === today) return;
        if (selectedDay === today) {
          const currentFilter = filter;
          selectDay(day);
          filter = currentFilter;
        }
        renderList();
      }, 3e4);
    }).catch((error) => {
      list.replaceChildren(emptyMessage("\u6682\u65F6\u65E0\u6CD5\u6253\u5F00\u5DE5\u4F5C\u8BA1\u5212\uFF0C\u8BF7\u91CD\u5F00\u7A97\u53E3\u3002"));
      showError(error);
    });
  }

  // src/renderer/app.ts
  var root = document.getElementById("root");
  var el = (id) => document.getElementById(id);
  var escape = (text) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var time = (ms) => {
    const seconds = Math.max(0, Math.ceil(ms / 1e3));
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  };
  var minutes = (ms) => ms < 6e4 ? `${Math.max(1, Math.ceil(ms / 1e3))} \u79D2\u540E` : `${Math.ceil(ms / 6e4)} \u5206\u949F\u540E`;
  var view = new URLSearchParams(location.search).get("view") ?? "widget";
  var systemTheme = matchMedia("(prefers-color-scheme: dark)");
  var initialTheme = new URLSearchParams(location.search).get("theme");
  var themePreference = initialTheme === "light" || initialTheme === "dark" ? initialTheme : "system";
  function applyTheme(preference = themePreference) {
    themePreference = preference;
    const resolved = preference === "system" ? systemTheme.matches ? "dark" : "light" : preference;
    if (document.documentElement.dataset.theme !== resolved) document.documentElement.dataset.theme = resolved;
  }
  systemTheme.addEventListener("change", () => applyTheme());
  applyTheme();
  var current;
  var activeTab = "health";
  var compactState;
  var reminderKey = "";
  var toastTimer;
  var saveStatus = "\u5DF2\u4FDD\u5B58\u5230\u672C\u673A";
  var saveFailed = false;
  var switchButton = (action, label, extra = "") => `<button class="switch" role="switch" aria-label="${label}" aria-checked="false" data-action="${action}" ${extra}></button>`;
  function toast(message) {
    const t = el("toast");
    t.textContent = message;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.hidden = true;
    }, 5e3);
  }
  async function command(c) {
    try {
      const next = await window.xijian.command(c);
      render(next);
      return next;
    } catch (error) {
      toast((error instanceof Error ? error.message : "\u64CD\u4F5C\u6CA1\u6709\u5B8C\u6210").replace(/^Error invoking remote method '[^']+': Error: /, ""));
      throw error;
    }
  }
  function send(c) {
    void command(c).catch(() => {
    });
  }
  function phase(s) {
    if (s.systemPaused) return "\u7535\u8111\u4F11\u606F\u4E2D";
    if (s.focus.status === "running") return s.focus.mode === "focus" ? "\u4E13\u6CE8\u8FDB\u884C\u4E2D" : "\u6B63\u5728\u4F11\u606F";
    if (s.focus.status === "paused") return "\u5DF2\u6682\u505C";
    if (s.focus.status === "ready") return s.focus.mode === "focus" ? "\u51C6\u5907\u4E0B\u4E00\u6BB5" : "\u4F11\u606F\u4E00\u4E0B\u5427";
    return s.focus.mode === "focus" ? "\u51C6\u5907\u4E13\u6CE8" : "\u51C6\u5907\u4F11\u606F";
  }
  function mainAction(s) {
    if (s.focus.status === "running") return "\u6682\u505C";
    if (s.focus.status === "paused") return "\u7EE7\u7EED";
    return s.focus.mode === "focus" ? "\u5F00\u59CB\u4E13\u6CE8" : "\u5F00\u59CB\u4F11\u606F";
  }
  function nextLabel(s) {
    if (s.pendingCount) return `\u6709 ${s.pendingCount} \u9879\u5F85\u5904\u7406\u63D0\u9192`;
    if (s.quietRemainingMs) return `\u4F1A\u8BAE\u4E2D \xB7 ${Math.ceil(s.quietRemainingMs / 6e4)} \u5206\u949F\u540E\u6062\u590D`;
    if (!s.settings.healthEnabled) return "\u5065\u5EB7\u63D0\u9192\u672A\u5F00\u542F";
    if (s.systemPaused || s.graceMs) return "\u7A0D\u7B49\u7247\u523B\uFF0C\u81EA\u7136\u6062\u590D\u63D0\u9192";
    if (s.focus.mode !== "focus" && s.focus.status === "running") return "\u4F11\u606F\u671F\u95F4\uFF0C\u63D0\u9192\u4E5F\u6B47\u4E00\u4F1A\u513F";
    if (s.nextReminder) return `\u4E0B\u4E00\u6B21 \xB7 ${RULE_INFO[s.nextReminder.ruleId].name} \xB7 ${minutes(s.nextReminder.remainingMs)}`;
    return "\u6240\u6709\u5065\u5EB7\u63D0\u9192\u5DF2\u5173\u95ED";
  }
  function buildWidget(compact) {
    if (compact) {
      root.innerHTML = `<main class="widget-frame widget-frame--compact"><section id="mini-card" class="mini-card surface drag" aria-label="\u8FF7\u4F60\u8BA1\u65F6\u5668"><div class="mini-summary"><span id="mini-time" class="mini-time num" role="timer" aria-label="\u5269\u4F59\u65F6\u95F4"></span><span class="mini-status"><span class="mini-state-dot" aria-hidden="true"></span><span id="mini-phase" class="mini-phase"></span></span></div><div class="mini-actions"><button id="mini-start" class="icon-btn mini-toggle" data-action="focus-toggle" aria-label="\u5F00\u59CB\u8BA1\u65F6"></button><button class="icon-btn mini-expand" data-action="compact" aria-label="\u5C55\u5F00\u8BA1\u65F6\u7EC4\u4EF6" title="\u5C55\u5F00">${icon("expand", 15)}</button></div></section></main>`;
      return;
    }
    root.innerHTML = `<main class="widget-frame"><section class="widget-card surface">
    <header class="widget-top row between drag"><span class="wordmark">\u606F\u95F4</span><div class="row gap4">
      <button class="icon-btn" data-action="work-plans" aria-label="\u6253\u5F00\u5DE5\u4F5C\u8BA1\u5212" title="\u5DE5\u4F5C\u8BA1\u5212">${icon("work", 16)}</button>
      <button id="pin" class="icon-btn" data-action="pin" aria-label="\u53D6\u6D88\u7F6E\u9876" title="\u7F6E\u9876">${icon("pin", 16)}</button>
      <button class="icon-btn" data-action="settings" aria-label="\u6253\u5F00\u8BBE\u7F6E" title="\u8BBE\u7F6E">${icon("settings", 16)}</button>
      <button class="icon-btn" data-action="compact" aria-label="\u5207\u6362\u8FF7\u4F60\u6A21\u5F0F" title="\u8FF7\u4F60\u6A21\u5F0F">${icon("mini", 16)}</button>
    </div></header>
    <nav class="widget-tabs" role="tablist" aria-label="\u8BA1\u65F6\u6A21\u5F0F">${["focus", "short", "long"].map((m) => `<button role="tab" data-action="mode" data-mode="${m}" aria-selected="false">${MODE_NAMES[m]}</button>`).join("")}</nav>
    <div class="timer-region"><span id="timer" class="timer-value num" role="timer" aria-label="\u5269\u4F59\u65F6\u95F4"></span><span id="phase" class="badge phase-label"></span></div>
    <div class="widget-actions"><button id="focus-button" class="button primary" data-action="focus-toggle"></button><button class="reset-button" data-action="reset" aria-label="\u91CD\u7F6E\u5F53\u524D\u8BA1\u65F6" title="\u91CD\u7F6E\u5F53\u524D\u8BA1\u65F6">${icon("reset", 16)}</button></div>
    <footer class="widget-bottom"><button id="next-button" class="next-button" data-action="next" title="\u67E5\u770B\u63D0\u9192\u4E0E\u8BBE\u7F6E">${icon("eye", 14)}<span id="next-label"></span></button>${switchButton("health-toggle", "\u5F00\u542F\u5065\u5EB7\u63D0\u9192", 'id="health-toggle"')}</footer>
    <div class="progress-track" aria-hidden="true"><div id="progress" class="progress-fill"></div></div>
  </section><div class="widget-caption"><button id="widget-note" data-action="widget-note">\u6309\u4F60\u7684\u8282\u594F\uFF0C\u7167\u987E\u81EA\u5DF1\u3002</button><button data-action="menu" aria-label="\u66F4\u591A\u64CD\u4F5C" title="\u9690\u85CF\u3001\u9000\u51FA\u7B49\u64CD\u4F5C">${icon("more", 14)}</button></div></main>`;
  }
  function renderWidget(s) {
    if (compactState !== s.settings.compact) {
      compactState = s.settings.compact;
      buildWidget(compactState);
    }
    if (compactState) {
      const displayTime = time(s.focus.remainingMs);
      const mini = el("mini-card");
      mini.dataset.state = s.systemPaused ? "paused" : s.focus.status;
      mini.classList.toggle("long-time", displayTime.length > 5);
      mini.title = nextLabel(s);
      el("mini-time").textContent = displayTime;
      el("mini-phase").textContent = s.systemPaused || s.focus.status === "paused" ? "\u5DF2\u6682\u505C" : MODE_NAMES[s.focus.mode];
      el("mini-phase").title = phase(s);
      const button2 = el("mini-start");
      button2.innerHTML = icon(s.focus.status === "running" ? "pause" : "play", 15);
      button2.setAttribute("aria-label", mainAction(s));
      button2.setAttribute("aria-pressed", String(s.focus.status === "running"));
      button2.title = mainAction(s);
      return;
    }
    el("timer").textContent = time(s.focus.remainingMs);
    el("phase").textContent = phase(s);
    el("focus-button").innerHTML = `${icon(s.focus.status === "running" ? "pause" : "play", 16)}${mainAction(s)}`;
    document.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === s.focus.mode)));
    el("next-label").textContent = nextLabel(s);
    const toggle = el("health-toggle");
    toggle.setAttribute("aria-checked", String(s.settings.healthEnabled));
    toggle.setAttribute("aria-label", s.settings.healthEnabled ? "\u5173\u95ED\u5065\u5EB7\u63D0\u9192" : "\u5F00\u542F\u5065\u5EB7\u63D0\u9192");
    const pin = el("pin");
    pin.classList.toggle("active", s.settings.alwaysOnTop);
    pin.setAttribute("aria-label", s.settings.alwaysOnTop ? "\u53D6\u6D88\u7F6E\u9876" : "\u4FDD\u6301\u7F6E\u9876");
    el("progress").style.width = `${Math.min(100, Math.max(0, 100 * (1 - s.focus.remainingMs / s.focus.totalMs)))}%`;
    const note = el("widget-note");
    note.textContent = s.storageError ? "\u672C\u5730\u4FDD\u5B58\u9047\u5230\u95EE\u9898 \xB7 \u70B9\u6B64\u67E5\u770B" : s.recovered ? "\u5DF2\u6062\u590D\u672C\u5730\u8BBE\u7F6E \xB7 \u70B9\u6B64\u67E5\u770B" : s.today.focusCompleted ? `\u4ECA\u65E5\u4E13\u6CE8 ${s.today.focusCompleted} \u6BB5 \xB7 \u5065\u5EB7\u884C\u52A8 ${s.today.healthCompleted} \u6B21` : "\u6309\u4F60\u7684\u8282\u594F\uFF0C\u7167\u987E\u81EA\u5DF1\u3002";
    note.classList.toggle("storage-note", !!s.storageError);
  }
  function buildSettings() {
    const ruleRows = Object.keys(RULE_INFO).map((id) => {
      const info = RULE_INFO[id];
      return `<section class="rule-row" id="rule-${id}"><div class="icon-tile ${info.color}">${icon(info.icon, 20)}</div><div class="rule-info"><div class="rule-title"><h3>${info.name}</h3><button class="preview-button" data-action="preview" data-rule="${id}" aria-label="\u8BD5\u4E00\u4E0B${info.name}\u63D0\u9192">\u8BD5\u4E00\u4E0B</button></div><div class="rule-fields">\u6BCF <input class="number-input" id="interval-${id}" data-field="intervalMinutes" data-rule="${id}" type="number" min="1" max="180" step="1" aria-label="${info.name}\u95F4\u9694\u5206\u949F"> \u5206\u949F${id === "water" ? "<span> \xB7 \u6309\u9700\u8865\u6C34</span>" : `\u4F11\u606F <input class="number-input" id="duration-${id}" data-field="durationSeconds" data-rule="${id}" type="number" min="5" max="600" step="1" aria-label="${info.name}\u4F11\u606F\u79D2\u6570"> \u79D2`}</div></div>${switchButton("rule-toggle", `${info.name}\u63D0\u9192`, `id="toggle-${id}" data-rule="${id}"`)}</section>`;
    }).join("");
    root.innerHTML = `<main class="settings-frame"><section class="settings-shell surface">
    <aside class="settings-sidebar"><div class="sidebar-brand drag">\u606F\u95F4\u8BBE\u7F6E</div><nav class="settings-nav">${[["focus", "\u5DE5\u4F5C\u8282\u594F"], ["health", "\u5065\u5EB7\u63D0\u9192"], ["desktop", "\u684C\u9762\u4E0E\u901A\u77E5"]].map(([id, label]) => `<button class="nav-item" data-action="tab" data-tab="${id}">${label}</button>`).join("")}</nav><div class="sidebar-stats"><div>\u4ECA\u65E5\u4E13\u6CE8 <strong id="stat-focus">0</strong> \u6BB5</div><div>\u4E13\u6CE8 <span id="stat-minutes">0</span> \u5206\u949F</div><div>\u5065\u5EB7\u884C\u52A8 <span id="stat-health">0</span> \u6B21</div></div></aside>
    <div class="settings-main"><header class="settings-header drag"><span class="eyebrow">\u4F60\u7684\u5065\u5EB7\u5DE5\u4F5C\u8282\u594F</span><button class="icon-btn" data-action="close-settings" aria-label="\u5173\u95ED\u8BBE\u7F6E">${icon("close", 16)}</button></header>
    <div class="settings-content"><div class="settings-intro"><h1>\u627E\u5230\u4F60\u7684\u5DE5\u4F5C\u8282\u594F</h1><p>\u6309\u4F60\u7684\u4E60\u60EF\uFF0C\u8C03\u6574\u6BCF\u4E00\u6B21\u4E13\u6CE8\u4E0E\u4F11\u606F</p></div>
      <section id="panel-health"><div class="master-row"><div><h3>\u5065\u5EB7\u63D0\u9192</h3><p>\u72EC\u7ACB\u4E8E\u4E13\u6CE8\u8BA1\u65F6\uFF0C\u5F00\u542F\u540E\u6309\u95F4\u9694\u63D0\u9192</p></div>${switchButton("health-toggle", "\u5F00\u542F\u5065\u5EB7\u63D0\u9192", 'id="settings-health-toggle"')}</div>${ruleRows}<div class="setting-note">${icon("info", 16)}<span>\u540C\u65F6\u5230\u8FBE\u7684\u63D0\u9192\u4F1A\u5408\u5E76\u3002\u4FEE\u6539\u95F4\u9694\u540E\uFF0C\u4ECE\u65B0\u7684\u5B8C\u6574\u95F4\u9694\u5F00\u59CB\u3002</span></div></section>
      <section id="panel-focus" hidden><div class="section-title">\u4E00\u6BB5\u5DE5\u4F5C\uFF0C\u4E00\u70B9\u4F11\u606F</div><div class="plan-grid">${[["workMinutes", "\u4E13\u6CE8", 1, 180], ["shortMinutes", "\u77ED\u4F11\u606F", 1, 60], ["longMinutes", "\u957F\u4F11\u606F", 1, 60]].map(([field, label, min, max]) => `<div class="plan-item"><label for="plan-${field}">${label}</label><input id="plan-${field}" class="number-input" data-plan="${field}" type="number" min="${min}" max="${max}" step="1"><small>\u5206\u949F</small></div>`).join("")}</div><div class="option-row"><div><h3>\u957F\u4F11\u606F\u7684\u8282\u594F</h3><p>\u5B8C\u6210\u51E0\u6BB5\u4E13\u6CE8\u540E\uFF0C\u5B89\u6392\u4E00\u6B21\u957F\u4F11\u606F</p></div><label class="round-input">\u6BCF <input id="plan-rounds" class="number-input" data-plan="rounds" type="number" min="1" max="12" step="1" aria-label="\u957F\u4F11\u606F\u8F6E\u6B21"> \u6BB5</label></div><div class="setting-note">${icon("info", 16)}<span>\u6B63\u5728\u8FDB\u884C\u7684\u8BA1\u65F6\u4FDD\u6301\u4E0D\u53D8\uFF0C\u65B0\u65F6\u957F\u4ECE\u4E0B\u4E00\u6BB5\u751F\u6548\u3002\u6BCF\u6BB5\u7ED3\u675F\u540E\uFF0C\u7531\u4F60\u51B3\u5B9A\u4F55\u65F6\u7EE7\u7EED\u3002</span></div><p class="first-use">\u6682\u505C\u4E13\u6CE8\u4E0D\u4F1A\u6682\u505C\u5065\u5EB7\u63D0\u9192\u3002\u9700\u8981\u5B89\u9759\u4E00\u4F1A\u513F\u65F6\uFF0C\u53EF\u4F7F\u7528\u4E0B\u65B9\u7684\u4F1A\u8BAE\u6682\u505C\u3002</p></section>
      <section id="panel-desktop" hidden><div class="section-title">\u8BA9\u606F\u95F4\u5B89\u9759\u5730\u966A\u7740\u4F60</div>${[["alwaysOnTop", "\u59CB\u7EC8\u7F6E\u9876", "\u5728\u5176\u4ED6\u5E94\u7528\u4E0A\u65B9\u663E\u793A\u8BA1\u65F6\u7EC4\u4EF6\u3002"], ["compact", "\u8FF7\u4F60\u6A21\u5F0F", "\u53EA\u4FDD\u7559\u65F6\u95F4\u548C\u63A7\u5236\uFF0C\u968F\u65F6\u53EF\u4EE5\u5C55\u5F00\u3002"], ["soundEnabled", "\u8F7B\u58F0\u63D0\u793A", "\u63D0\u9192\u5230\u65F6\u64AD\u653E\u4E00\u58F0\u77ED\u63D0\u793A\u97F3\u3002"]].map(([key, label, description]) => `<div class="option-row"><div><h3>${label}</h3><p>${description}</p></div>${switchButton("setting-toggle", label, `id="option-${key}" data-key="${key}"`)}</div>`).join("")}<p class="first-use">\u7EC4\u4EF6\u53EF\u62D6\u52A8\uFF0C\u53F3\u952E\u53EF\u9690\u85CF\u6216\u9000\u51FA\u3002\u9690\u85CF\u5230\u6258\u76D8\u540E\u8BA1\u65F6\u548C\u63D0\u9192\u4F1A\u7EE7\u7EED\uFF0C\u660E\u786E\u9000\u51FA\u540E\u505C\u6B62\u3002</p><div class="restore-row"><button class="text-btn" data-action="restore-show">\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E</button><div id="restore-confirm" class="confirm-restore" hidden>\u6062\u590D\u521D\u59CB\u8282\u594F\u4E0E\u5F00\u5173\uFF1B\u4ECA\u65E5\u8BB0\u5F55\u4F1A\u4FDD\u7559\u3002<div class="row"><button class="button primary" data-action="restore">\u6062\u590D\u9ED8\u8BA4</button><button class="button secondary" data-action="restore-cancel">\u53D6\u6D88</button></div></div></div><div class="option-row"><div><h3 id="update-version">\u606F\u95F4</h3><p id="update-status" role="status">\u6B63\u5728\u8BFB\u53D6\u7248\u672C\u4FE1\u606F</p></div><button id="update-action" class="button secondary" data-action="update-action" hidden>\u68C0\u67E5\u66F4\u65B0</button></div></section>
    </div><footer class="settings-footer"><button id="meeting-button" class="meeting-button" data-action="meeting">${icon("quiet", 16)}<span id="meeting-label">\u4F1A\u8BAE\u4E2D \xB7 \u6682\u505C\u63D0\u919230\u5206\u949F</span></button><span id="save-status" class="save-status" role="status">\u5DF2\u4FDD\u5B58\u5230\u672C\u673A</span></footer></div>
  </section></main>`;
    chooseTab(activeTab);
    const appearance = document.createElement("div");
    appearance.className = "option-row theme-setting";
    appearance.innerHTML = `<div><h3>\u5916\u89C2\u4E3B\u9898</h3><p>\u5207\u6362\u4EAE\u6697\u5916\u89C2\uFF0C\u6216\u8DDF\u968F\u7CFB\u7EDF\u3002</p></div><div class="theme-options" role="group" aria-label="\u5916\u89C2\u4E3B\u9898">${[["light", "\u4EAE\u8272"], ["dark", "\u6697\u8272"], ["system", "\u8DDF\u968F\u7CFB\u7EDF"]].map(([value, label]) => `<button type="button" data-action="theme" data-theme-choice="${value}" aria-pressed="false">${label}</button>`).join("")}</div>`;
    el("panel-desktop").prepend(appearance);
  }
  function chooseTab(tab) {
    activeTab = tab;
    for (const name of ["focus", "health", "desktop"]) el(`panel-${name}`).hidden = name !== tab;
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("selected", b.dataset.tab === tab));
  }
  function setInput(id, value) {
    const input = el(id);
    if (input && document.activeElement !== input) input.value = String(value);
  }
  function renderSettings(s) {
    if (!el("panel-health")) buildSettings();
    el("settings-health-toggle").setAttribute("aria-checked", String(s.settings.healthEnabled));
    el("settings-health-toggle").setAttribute("aria-label", s.settings.healthEnabled ? "\u5173\u95ED\u5065\u5EB7\u63D0\u9192" : "\u5F00\u542F\u5065\u5EB7\u63D0\u9192");
    for (const rule of s.settings.reminders) {
      el(`toggle-${rule.id}`).setAttribute("aria-checked", String(rule.enabled));
      el(`rule-${rule.id}`).classList.toggle("off", !rule.enabled);
      setInput(`interval-${rule.id}`, rule.intervalMinutes);
      setInput(`duration-${rule.id}`, rule.durationSeconds);
      const preview = document.querySelector(`[data-action=preview][data-rule=${rule.id}]`);
      preview.disabled = !!s.quietRemainingMs || s.systemPaused;
    }
    for (const [key, value] of Object.entries(s.settings.focusPlan)) setInput(`plan-${key}`, value);
    for (const key of ["alwaysOnTop", "compact", "soundEnabled"]) el(`option-${key}`).setAttribute("aria-checked", String(s.settings[key]));
    document.querySelectorAll("[data-theme-choice]").forEach((button2) => button2.setAttribute("aria-pressed", String(button2.dataset.themeChoice === s.settings.theme)));
    el("stat-focus").textContent = String(s.today.focusCompleted);
    el("stat-minutes").textContent = String(Math.floor(s.today.focusMs / 6e4));
    el("stat-health").textContent = String(s.today.healthCompleted);
    el("meeting-label").textContent = s.quietRemainingMs ? `\u4F1A\u8BAE\u4E2D \xB7 ${Math.ceil(s.quietRemainingMs / 6e4)}\u5206\u949F\u540E\u6062\u590D\uFF08\u70B9\u6B64\u63D0\u524D\u6062\u590D\uFF09` : "\u4F1A\u8BAE\u4E2D \xB7 \u6682\u505C\u63D0\u919230\u5206\u949F";
    el("meeting-button").classList.toggle("quiet", !!s.quietRemainingMs);
    el("save-status").textContent = s.storageError ? "\u4FDD\u5B58\u9047\u5230\u95EE\u9898\uFF0C\u8BF7\u91CD\u8BD5" : saveStatus;
    el("save-status").classList.toggle("failed", saveFailed || !!s.storageError);
    if (s.update) {
      const update = s.update;
      const labels = { manual: "", idle: "\u68C0\u67E5\u66F4\u65B0", checking: "\u68C0\u67E5\u4E2D\u2026", available: "\u4E0B\u8F7D\u66F4\u65B0", downloading: "\u4E0B\u8F7D\u4E2D\u2026", ready: "\u91CD\u542F\u5B89\u88C5", installing: "\u5B89\u88C5\u4E2D\u2026", error: "\u91CD\u65B0\u68C0\u67E5" };
      const button2 = el("update-action");
      el("update-version").textContent = `\u606F\u95F4 ${update.currentVersion}`;
      el("update-status").textContent = update.message;
      button2.textContent = labels[update.phase];
      button2.hidden = update.phase === "manual";
      button2.disabled = ["checking", "downloading", "installing"].includes(update.phase);
    }
  }
  function reminderMarkup(o) {
    const info = RULE_INFO[o.ruleId];
    return `<section class="reminder-item" id="occ-${o.id}">${o.preview ? '<span class="preview-tag">\u63D0\u9192\u9884\u89C8 \xB7 \u4E0D\u8BA1\u5165\u4ECA\u65E5\u8BB0\u5F55</span>' : ""}<div class="reminder-tag">${icon(info.icon, 15)}${info.name}</div><h2>${escape(info.title)}</h2><p class="reminder-description">${escape(info.description)}</p><div id="duration-${o.id}" class="action-duration num"></div><button id="action-${o.id}" class="button coral full" data-action="occ-primary" data-id="${o.id}"></button><div class="reminder-secondary"><button class="button secondary" data-action="occ-snooze" data-id="${o.id}">${o.preview ? "\u5173\u95ED\u9884\u89C8" : "5 \u5206\u949F\u540E"}</button><button class="button ghost" data-action="occ-skip" data-id="${o.id}">${o.preview ? "\u8DF3\u8FC7\u4F53\u9A8C" : "\u8DF3\u8FC7\u8FD9\u6B21"}</button></div></section>`;
  }
  function renderReminder(s) {
    const key = `${s.notice?.id ?? ""}/${s.occurrences.map((o) => o.id).join(",")}`;
    const previousList = el("reminder-list");
    const previousScrollTop = previousList?.scrollTop ?? 0;
    const restoreListFocus = previousList === document.activeElement;
    let rebuilt = false;
    if (key !== reminderKey || !el("reminder-list")) {
      rebuilt = true;
      reminderKey = key;
      root.innerHTML = `<main class="reminder-frame"><section class="reminder-shell surface"><header class="reminder-header drag"><span class="reminder-label">${icon("leaf", 16)}\u4F11\u606F\u4E00\u4E0B</span><button class="icon-btn" data-action="collapse" aria-label="\u6536\u8D77\u63D0\u9192">${icon("close", 16)}</button></header><div id="reminder-list" class="reminder-scroll" role="region" aria-label="\u5065\u5EB7\u63D0\u9192\u5217\u8868" tabindex="0">${s.notice ? `<section class="reminder-item notice-item"><span class="eyebrow">${s.notice.kind === "break" ? "\u4E13\u6CE8\u5DF2\u5B8C\u6210" : "\u4F11\u606F\u5DF2\u7ED3\u675F"}</span><h2>${s.notice.kind === "break" ? "\u505A\u5F97\u4E0D\u9519\uFF0C\u6B47\u4E00\u4F1A\u513F" : "\u6162\u6162\u56DE\u6765\uFF0C\u518D\u51FA\u53D1"}</h2><p>${s.notice.kind === "break" ? "\u653E\u4E0B\u624B\u8FB9\u7684\u4E8B\uFF0C\u7ED9\u81EA\u5DF1\u4E00\u70B9\u6062\u590D\u7684\u65F6\u95F4\u3002" : "\u51C6\u5907\u597D\u4E86\uFF0C\u518D\u5F00\u59CB\u4E0B\u4E00\u6BB5\u4E13\u6CE8\u3002"}</p><button class="button coral full" data-action="focus-start">${s.notice.kind === "break" ? `\u5F00\u59CB${MODE_NAMES[s.focus.mode]}` : "\u5F00\u59CB\u4E0B\u4E00\u6BB5\u4E13\u6CE8"}</button><button class="button ghost full" data-action="notice-dismiss">\u7A0D\u540E\u5F00\u59CB</button></section>` : ""}${s.occurrences.map(reminderMarkup).join("")}${s.occurrences.length > 1 ? '<div class="group-action"><button data-action="snooze-all">\u5168\u90E8 5 \u5206\u949F\u540E\u63D0\u9192</button></div>' : ""}${!s.notice && !s.occurrences.length ? '<p class="reminder-description">\u8FD9\u4E00\u523B\uFF0C\u5B89\u5FC3\u505A\u81EA\u5DF1\u7684\u4E8B\u3002</p>' : ""}</div></section></main>`;
    }
    for (const o of s.occurrences) {
      const duration = el(`duration-${o.id}`);
      duration.hidden = o.ruleId === "water";
      duration.innerHTML = `${time(o.remainingMs)}<small>${o.state === "pending" ? "\u5EFA\u8BAE\u4F11\u606F\u65F6\u957F" : o.state === "running" ? "\u4F11\u606F\u4E2D\uFF0C\u6162\u6162\u6765" : "\u8BA1\u65F6\u7ED3\u675F\uFF0C\u8BF7\u786E\u8BA4\u5B8C\u6210"}</small>`;
      const button2 = el(`action-${o.id}`);
      button2.disabled = o.state === "running";
      button2.textContent = o.state === "ready" ? "\u5DF2\u5B8C\u6210" : o.state === "running" ? "\u6B63\u5728\u4F11\u606F\u2026" : o.ruleId === "water" ? "\u6211\u559D\u597D\u4E86" : "\u5F00\u59CB\u4F11\u606F";
    }
    if (rebuilt) {
      const list = el("reminder-list");
      list.scrollTop = previousScrollTop;
      if (restoreListFocus) list.focus({ preventScroll: true });
    }
  }
  function render(s) {
    current = s;
    applyTheme(s.settings.theme);
    if (view === "settings") renderSettings(s);
    else if (view === "reminder") renderReminder(s);
    else if (view !== "work-plans") renderWidget(s);
  }
  async function saveSettings(settings) {
    saveStatus = "\u6B63\u5728\u4FDD\u5B58\u2026";
    saveFailed = false;
    render(current);
    try {
      await command({ type: "settings.update", settings, revision: current.settingsRevision });
      saveStatus = "\u5DF2\u4FDD\u5B58\u5230\u672C\u673A";
    } catch {
      saveStatus = "\u672A\u4FDD\u5B58\uFF0C\u8BF7\u8C03\u6574\u540E\u91CD\u8BD5";
      saveFailed = true;
    }
    if (view === "settings") renderSettings(current);
  }
  document.addEventListener("click", (event) => {
    const button2 = event.target.closest("[data-action]");
    if (!button2 || !current || button2.disabled) return;
    const action = button2.dataset.action, id = button2.dataset.id;
    switch (action) {
      case "focus-toggle":
        send({ type: current.focus.status === "running" ? "focus.pause" : "focus.start" });
        break;
      case "focus-start":
        send({ type: "focus.start" });
        break;
      case "mode":
        send({ type: "focus.select", mode: button2.dataset.mode });
        break;
      case "reset":
        send({ type: "focus.reset" });
        break;
      case "pin":
        send({ type: "window.pin" });
        break;
      case "compact":
        send({ type: "window.compact" });
        break;
      case "settings":
        send({ type: "window.settings" });
        break;
      case "work-plans":
        send({ type: "window.work-plans" });
        break;
      case "update-action":
        send({ type: "update.action" });
        break;
      case "close-settings":
        send({ type: "window.close-settings" });
        break;
      case "menu":
        send({ type: "window.menu" });
        break;
      case "health-toggle":
        send({ type: "health.toggle", enabled: !current.settings.healthEnabled });
        break;
      case "meeting":
        send({ type: "meeting.toggle" });
        break;
      case "next":
        send({ type: current.pendingCount ? "reminders.open" : "window.settings" });
        break;
      case "collapse":
        send({ type: "reminders.collapse" });
        break;
      case "notice-dismiss":
        send({ type: "notice.dismiss" });
        break;
      case "tab":
        chooseTab(button2.dataset.tab);
        break;
      case "theme":
        void saveSettings({ ...current.settings, theme: button2.dataset.themeChoice });
        break;
      case "preview":
        send({ type: "reminder.preview", ruleId: button2.dataset.rule });
        break;
      case "rule-toggle": {
        const settings = structuredClone(current.settings);
        const rule = settings.reminders.find((r) => r.id === button2.dataset.rule);
        rule.enabled = !rule.enabled;
        void saveSettings(settings);
        break;
      }
      case "setting-toggle": {
        const settings = structuredClone(current.settings);
        const key = button2.dataset.key;
        settings[key] = !settings[key];
        void saveSettings(settings);
        break;
      }
      case "occ-primary": {
        const o = current.occurrences.find((v) => v.id === id);
        if (!o) break;
        if (o.state === "ready") send({ type: "reminder.complete", id: o.id });
        else if (o.state === "pending" && o.ruleId === "water") void command({ type: "reminder.start", id: o.id }).then(() => command({ type: "reminder.complete", id: o.id })).catch(() => {
        });
        else send({ type: "reminder.start", id: o.id });
        break;
      }
      case "occ-snooze":
        if (id) send({ type: "reminder.snooze", id });
        break;
      case "occ-skip":
        if (id) send({ type: "reminder.skip", id });
        break;
      case "snooze-all": {
        const ids = current.occurrences.map((o) => o.id);
        void (async () => {
          for (const item of ids) await command({ type: "reminder.snooze", id: item });
        })().catch(() => {
        });
        break;
      }
      case "restore-show":
        el("restore-confirm").hidden = false;
        break;
      case "restore-cancel":
        el("restore-confirm").hidden = true;
        break;
      case "restore":
        void command({ type: "settings.defaults" }).then(() => {
          el("restore-confirm").hidden = true;
          toast("\u5DF2\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E\uFF0C\u4ECA\u65E5\u8BB0\u5F55\u5DF2\u4FDD\u7559");
        }).catch(() => {
        });
        break;
      case "widget-note":
        if (current.storageError) toast(current.storageError);
        else if (current.recovered) toast("\u68C0\u6D4B\u5230\u4E0A\u6B21\u6570\u636E\u5F02\u5E38\uFF0C\u5DF2\u6062\u590D\u53EF\u7528\u8BBE\u7F6E\u3002\u4E13\u6CE8\u8BA1\u65F6\u9700\u8981\u4F60\u624B\u52A8\u7EE7\u7EED\u3002");
        else send({ type: "window.settings" });
        break;
    }
  });
  document.addEventListener("change", (event) => {
    const input = event.target;
    if (!current || !input.matches("input[data-field],input[data-plan]")) return;
    if (!input.checkValidity() || !Number.isFinite(input.valueAsNumber)) {
      toast("\u8BF7\u8F93\u5165\u5B57\u6BB5\u5141\u8BB8\u8303\u56F4\u5185\u7684\u6574\u6570\uFF0C\u4FEE\u6539\u5C1A\u672A\u4FDD\u5B58");
      saveStatus = "\u672A\u4FDD\u5B58\uFF0C\u8BF7\u68C0\u67E5\u8F93\u5165";
      saveFailed = true;
      renderSettings(current);
      return;
    }
    const settings = structuredClone(current.settings);
    if (input.dataset.plan) settings.focusPlan[input.dataset.plan] = input.valueAsNumber;
    else settings.reminders.find((r) => r.id === input.dataset.rule)[input.dataset.field] = input.valueAsNumber;
    void saveSettings(settings);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (view === "settings") send({ type: "window.close-settings" });
      else if (view === "reminder") send({ type: "reminders.collapse" });
    }
  });
  if (view === "work-plans") {
    mountWorkPlans(root);
    window.xijian.onState(render);
    void window.xijian.getState().then(render).catch(() => {
    });
  } else {
    window.xijian.onState(render);
    if (view === "widget") window.xijian.onSound(() => {
      const audio = new Audio("chime.wav");
      audio.volume = 0.35;
      void audio.play().catch(() => {
      });
    });
    void window.xijian.getState().then(render).catch(() => {
      root.innerHTML = '<main class="widget-frame"><section class="surface widget-card"><h2>\u606F\u95F4\u6682\u65F6\u6CA1\u6709\u8FDE\u63A5\u597D</h2><p class="first-use">\u8BF7\u9000\u51FA\u5E76\u91CD\u65B0\u6253\u5F00\u5E94\u7528\u3002</p></section></main>';
    });
  }
})();
//# sourceMappingURL=renderer.js.map
