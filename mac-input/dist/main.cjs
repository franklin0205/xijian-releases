"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/main/main.ts
var import_electron = require("electron");
var import_node_fs2 = require("node:fs");
var import_electron_updater = require("electron-updater");

// src/main/updates.ts
var Updates = class {
  constructor(client, enabled, currentVersion, changed, notifyAvailable, prepareInstall, cancelInstall) {
    this.client = client;
    this.enabled = enabled;
    this.changed = changed;
    this.notifyAvailable = notifyAvailable;
    this.prepareInstall = prepareInstall;
    this.cancelInstall = cancelInstall;
    this.value = {
      phase: enabled ? "idle" : "manual",
      message: enabled ? "\u53EF\u68C0\u67E5\u65B0\u7248\u672C" : "\u5F53\u524D\u7248\u672C\u901A\u8FC7\u5B89\u88C5\u5305\u66F4\u65B0",
      currentVersion
    };
    client.autoDownload = false;
    client.autoInstallOnAppQuit = false;
    client.allowDowngrade = false;
    client.on("update-available", (info) => {
      this.set({ phase: "available", nextVersion: info.version, message: `\u53D1\u73B0\u65B0\u7248\u672C ${info.version}` });
      if (this.automaticCheck) this.notifyAvailable();
    });
    client.on("update-not-available", () => this.set({ phase: "idle", message: "\u5DF2\u662F\u6700\u65B0\u7248\u672C", nextVersion: void 0 }));
    client.on("download-progress", (progress) => {
      this.set({ phase: "downloading", message: `\u6B63\u5728\u4E0B\u8F7D\u66F4\u65B0 ${Math.round(progress.percent)}%` });
    });
    client.on("update-downloaded", (info) => this.set({ phase: "ready", nextVersion: info.version, message: "\u66F4\u65B0\u5DF2\u4E0B\u8F7D\uFF0C\u53EF\u91CD\u542F\u5B89\u88C5" }));
    client.on("error", () => {
      if (this.value.phase === "installing") this.cancelInstall();
      this.set({ phase: "error", message: "\u66F4\u65B0\u672A\u5B8C\u6210\uFF0C\u8BF7\u7A0D\u540E\u91CD\u65B0\u68C0\u67E5" });
    });
  }
  client;
  enabled;
  changed;
  notifyAvailable;
  prepareInstall;
  cancelInstall;
  value;
  automaticCheck = false;
  snapshot() {
    return { ...this.value };
  }
  set(value) {
    this.value = { ...this.value, ...value };
    this.changed();
  }
  async check(automatic = false) {
    if (!this.enabled) return;
    if (!["idle", "error"].includes(this.value.phase)) return;
    this.automaticCheck = automatic;
    this.set({ phase: "checking", message: "\u6B63\u5728\u68C0\u67E5\u66F4\u65B0\u2026" });
    try {
      await this.client.checkForUpdates();
    } catch {
      this.set({ phase: "error", message: "\u6682\u65F6\u65E0\u6CD5\u68C0\u67E5\u66F4\u65B0\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" });
    } finally {
      this.automaticCheck = false;
    }
  }
  async perform() {
    if (!this.enabled) return;
    if (this.value.phase === "available") {
      this.set({ phase: "downloading", message: "\u6B63\u5728\u4E0B\u8F7D\u66F4\u65B0\u2026" });
      try {
        await this.client.downloadUpdate();
      } catch {
        this.set({ phase: "error", message: "\u4E0B\u8F7D\u672A\u5B8C\u6210\uFF0C\u8BF7\u91CD\u65B0\u68C0\u67E5\u540E\u91CD\u8BD5" });
      }
      return;
    }
    if (this.value.phase === "ready") {
      this.set({ phase: "installing", message: "\u6B63\u5728\u4FDD\u5B58\u6570\u636E\u5E76\u5B89\u88C5\u66F4\u65B0\u2026" });
      try {
        await this.prepareInstall();
        this.client.quitAndInstall(false, true);
      } catch {
        this.cancelInstall();
        this.set({ phase: "ready", message: "\u6570\u636E\u4FDD\u5B58\u672A\u5B8C\u6210\uFF0C\u8BF7\u91CD\u8BD5\u5B89\u88C5" });
      }
      return;
    }
    await this.check();
  }
};

// src/main/main.ts
var import_node_path2 = __toESM(require("node:path"));
var import_node_url = require("node:url");
var import_node_perf_hooks = require("node:perf_hooks");

// src/shared.ts
var RULE_INFO = {
  eyes: { name: "\u8FDC\u773A", title: "\u8BA9\u89C6\u7EBF\u53BB\u8FDC\u5904\u8D70\u8D70", description: "\u770B\u5411\u7A97\u5916\u6216\u8F83\u8FDC\u7684\u4F4D\u7F6E\uFF0C\u6682\u65F6\u653E\u4E0B\u5C4F\u5E55\u3002", icon: "eye", color: "sage" },
  water: { name: "\u559D\u6C34", title: "\u505C\u4E00\u4E0B\uFF0C\u559D\u51E0\u53E3\u6C34", description: "\u62FF\u8D77\u6C34\u676F\uFF0C\u6309\u81EA\u5DF1\u7684\u9700\u8981\u8865\u5145\u4E00\u70B9\u6C34\u5206\u3002", icon: "water", color: "lavender" },
  move: { name: "\u8D77\u8EAB", title: "\u8D77\u6765\u6D3B\u52A8\u4E00\u4E0B\u5427", description: "\u79BB\u5F00\u5EA7\u4F4D\u8D70\u4E00\u8D70\uFF0C\u8F7B\u8F7B\u8212\u5C55\u8EAB\u4F53\u3002", icon: "move", color: "coral" },
  close: { name: "\u95ED\u773C", title: "\u8BA9\u773C\u775B\u5B89\u9759\u4E00\u4F1A\u513F", description: "\u5728\u5B89\u5168\u3001\u8212\u9002\u7684\u73AF\u5883\u91CC\uFF0C\u8F7B\u8F7B\u95ED\u773C\u653E\u677E\u3002", icon: "moon", color: "lavender" }
};
var MODE_NAMES = { focus: "\u4E13\u6CE8", short: "\u77ED\u4F11\u606F", long: "\u957F\u4F11\u606F" };
function localDay(time) {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function defaultSettings() {
  return {
    schemaVersion: 1,
    focusPlan: { workMinutes: 25, shortMinutes: 5, longMinutes: 15, rounds: 4 },
    healthEnabled: false,
    alwaysOnTop: true,
    compact: false,
    soundEnabled: true,
    theme: "system",
    reminders: [
      { id: "eyes", enabled: true, intervalMinutes: 20, durationSeconds: 20 },
      { id: "water", enabled: true, intervalMinutes: 45, durationSeconds: 0 },
      { id: "move", enabled: true, intervalMinutes: 60, durationSeconds: 120 },
      { id: "close", enabled: false, intervalMinutes: 30, durationSeconds: 20 }
    ]
  };
}
var int = (value, min, max, label) => {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value < min || value > max) throw new Error(`${label}\u9700\u8981\u662F ${min}\u2013${max} \u4E4B\u95F4\u7684\u6574\u6570`);
  return value;
};
function validateSettings(raw) {
  if (!raw || typeof raw !== "object") throw new Error("\u8BBE\u7F6E\u683C\u5F0F\u4E0D\u6B63\u786E");
  const v = raw;
  if (v.schemaVersion !== 1) throw new Error("\u8BBE\u7F6E\u7248\u672C\u4E0D\u517C\u5BB9\uFF0C\u8BF7\u4F7F\u7528\u66F4\u65B0\u7684\u606F\u95F4\u7248\u672C");
  const theme = v.theme === void 0 ? "system" : v.theme;
  if (theme !== "light" && theme !== "dark" && theme !== "system") throw new Error("\u5916\u89C2\u4E3B\u9898\u4E0D\u6B63\u786E");
  for (const key of ["healthEnabled", "alwaysOnTop", "compact", "soundEnabled"]) {
    if (typeof v[key] !== "boolean") throw new Error("\u5F00\u5173\u8BBE\u7F6E\u4E0D\u6B63\u786E");
  }
  if (!v.focusPlan || !Array.isArray(v.reminders) || v.reminders.length !== 4) throw new Error("\u8282\u594F\u8BBE\u7F6E\u4E0D\u5B8C\u6574");
  const p = v.focusPlan;
  const rules = defaultSettings().reminders.map(({ id }) => {
    const matches = v.reminders.filter((r2) => r2?.id === id);
    if (matches.length !== 1 || typeof matches[0].enabled !== "boolean") throw new Error("\u5065\u5EB7\u63D0\u9192\u8BBE\u7F6E\u4E0D\u6B63\u786E");
    const r = matches[0];
    return { id, enabled: r.enabled, intervalMinutes: int(r.intervalMinutes, 1, 180, "\u63D0\u9192\u95F4\u9694"), durationSeconds: int(r.durationSeconds, id === "water" ? 0 : 5, 600, "\u4F11\u606F\u79D2\u6570") };
  });
  return {
    schemaVersion: 1,
    focusPlan: { workMinutes: int(p.workMinutes, 1, 180, "\u4E13\u6CE8\u65F6\u957F"), shortMinutes: int(p.shortMinutes, 1, 60, "\u77ED\u4F11\u606F\u65F6\u957F"), longMinutes: int(p.longMinutes, 1, 60, "\u957F\u4F11\u606F\u65F6\u957F"), rounds: int(p.rounds, 1, 12, "\u957F\u4F11\u606F\u8F6E\u6B21") },
    reminders: rules,
    healthEnabled: v.healthEnabled,
    alwaysOnTop: v.alwaysOnTop,
    compact: v.compact,
    soundEnabled: v.soundEnabled,
    theme
  };
}

// src/domain/engine.ts
var clone = (value) => structuredClone(value);
var positive = (n, fallback, max = Number.MAX_SAFE_INTEGER) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= max ? n : fallback;
var emptyStats = () => ({ focusMs: 0, focusCompleted: 0, healthCompleted: 0 });
var Engine = class {
  settings;
  settingsRevision = 0;
  runtime;
  stats = {};
  systemReasons = /* @__PURE__ */ new Set();
  events = [];
  now;
  constructor(saved, now = Date.now()) {
    this.now = now;
    this.settings = saved ? validateSettings(saved.settings) : defaultSettings();
    const duration = this.duration("focus");
    this.runtime = {
      focus: { mode: "focus", status: "idle", totalMs: duration, remainingMs: duration, completedRounds: 0, sessionId: crypto.randomUUID() },
      remaining: this.fullIntervals(),
      occurrences: [],
      notice: null,
      quietUntil: null,
      graceMs: 0,
      cardVisible: false,
      cardAgeMs: 0,
      alertSequence: 0
    };
    if (saved) this.restore(saved);
  }
  restore(saved) {
    this.settingsRevision = Math.floor(positive(saved.settingsRevision, 0));
    const f = saved.runtime?.focus;
    if (f && ["focus", "short", "long"].includes(f.mode)) {
      const total = positive(f.totalMs, this.duration(f.mode), 180 * 6e4) || this.duration(f.mode);
      this.runtime.focus = {
        mode: f.mode,
        status: ["idle", "ready"].includes(f.status) ? f.status : "paused",
        remainingMs: positive(f.remainingMs, total, total),
        totalMs: total,
        completedRounds: Math.floor(positive(f.completedRounds, 0)),
        sessionId: crypto.randomUUID()
      };
      if (this.runtime.focus.remainingMs === 0) {
        this.runtime.focus.remainingMs = this.duration(f.mode);
        this.runtime.focus.totalMs = this.duration(f.mode);
        this.runtime.focus.status = "idle";
      }
    }
    for (const r of this.settings.reminders) {
      this.runtime.remaining[r.id] = positive(saved.runtime?.remaining?.[r.id], r.intervalMinutes * 6e4, 180 * 6e4);
    }
    for (const o of Array.isArray(saved.runtime?.occurrences) ? saved.runtime.occurrences : []) {
      if (o && !o.preview && this.settings.reminders.some((r) => r.id === o.ruleId && r.enabled)) {
        if (o.state === "snoozed") {
          this.runtime.occurrences.push({ id: crypto.randomUUID(), ruleId: o.ruleId, state: "snoozed", remainingMs: 0, snoozeMs: positive(o.snoozeMs, 3e5, 3e5), preview: false });
        } else {
          this.runtime.remaining[o.ruleId] = this.interval(o.ruleId);
          this.emit("reminder_interrupted", o.id, { ruleId: o.ruleId });
        }
      }
    }
    if (this.settings.healthEnabled) this.runtime.graceMs = 3e4;
    if (typeof saved.runtime?.quietUntil === "number" && saved.runtime.quietUntil > this.now && saved.runtime.quietUntil <= this.now + 30 * 6e4) this.runtime.quietUntil = saved.runtime.quietUntil;
    for (const [day, value] of Object.entries(saved.stats ?? {})) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && value && typeof value === "object") this.stats[day] = {
        focusMs: positive(value.focusMs, 0, 864e5),
        focusCompleted: Math.floor(positive(value.focusCompleted, 0, 1440)),
        healthCompleted: Math.floor(positive(value.healthCompleted, 0, 1e4))
      };
    }
  }
  duration(mode) {
    const p = this.settings.focusPlan;
    return 6e4 * (mode === "focus" ? p.workMinutes : mode === "short" ? p.shortMinutes : p.longMinutes);
  }
  interval(id) {
    return this.settings.reminders.find((r) => r.id === id).intervalMinutes * 6e4;
  }
  fullIntervals() {
    return Object.fromEntries(this.settings.reminders.map((r) => [r.id, r.intervalMinutes * 6e4]));
  }
  emit(type, entityId, extra = {}) {
    this.events.push({ id: crypto.randomUUID(), type, entityId, occurredAtUtc: new Date(this.now).toISOString(), localDate: localDay(this.now), offsetMinutes: -new Date(this.now).getTimezoneOffset(), ...extra });
  }
  drainEvents() {
    return this.events.splice(0);
  }
  day(time = this.now) {
    return this.stats[localDay(time)] ??= emptyStats();
  }
  addFocusTime(ms, end) {
    let cursor = end - ms;
    while (cursor < end) {
      const d = new Date(cursor);
      const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
      const chunkEnd = Math.min(end, midnight);
      this.day(cursor).focusMs += chunkEnd - cursor;
      cursor = chunkEnd;
    }
  }
  reveal() {
    if (this.systemReasons.size || this.runtime.quietUntil) return;
    this.runtime.cardVisible = true;
    this.runtime.cardAgeMs = 0;
  }
  alert() {
    this.runtime.alertSequence++;
    this.reveal();
  }
  cleanCard() {
    if (!this.runtime.notice && !this.runtime.occurrences.some((o) => o.state !== "snoozed")) this.runtime.cardVisible = false;
  }
  advance(ms, now = this.now + ms) {
    if (!Number.isFinite(ms) || ms < 0 || !Number.isFinite(now)) throw new Error("\u65E0\u6548\u7684\u65F6\u95F4\u63A8\u8FDB");
    this.now = now;
    const rt = this.runtime;
    const previousAlert2 = rt.alertSequence;
    let availableMs = ms;
    if (rt.quietUntil) {
      if (now >= rt.quietUntil) {
        availableMs = Math.max(0, Math.min(ms, now - rt.quietUntil));
        rt.quietUntil = null;
        rt.graceMs = 3e4;
      } else availableMs = 0;
    }
    if (this.systemReasons.size) return;
    const f = rt.focus;
    let restConsumed = 0;
    if (f.status === "running") {
      const used = Math.min(ms, f.remainingMs);
      if (f.mode === "focus") this.addFocusTime(used, now - ms + used);
      else restConsumed = used;
      f.remainingMs = Math.max(0, f.remainingMs - used);
      if (f.remainingMs === 0) {
        if (f.mode === "focus") {
          this.day(now - ms + used).focusCompleted++;
          this.emit("focus_completed", f.sessionId);
          f.completedRounds++;
          f.mode = f.completedRounds % this.settings.focusPlan.rounds === 0 ? "long" : "short";
          rt.notice = { id: crypto.randomUUID(), kind: "break" };
        } else {
          this.emit("break_completed", f.sessionId);
          f.mode = "focus";
          rt.notice = { id: crypto.randomUUID(), kind: "focus" };
        }
        f.totalMs = this.duration(f.mode);
        f.remainingMs = f.totalMs;
        f.status = "ready";
        this.alert();
      }
    }
    const quiet = !!rt.quietUntil;
    const hadRunningAction = rt.occurrences.some((o) => o.state === "running");
    let healthMs = this.settings.healthEnabled && !quiet ? Math.min(availableMs, Math.max(0, ms - restConsumed)) : 0;
    if (rt.graceMs > 0) {
      const graceUsed = Math.min(availableMs, rt.graceMs);
      rt.graceMs -= graceUsed;
      healthMs = Math.max(0, healthMs - graceUsed);
    }
    if (!quiet) for (const o of rt.occurrences) {
      if (o.state === "running") {
        o.remainingMs = Math.max(0, o.remainingMs - availableMs);
        if (!o.remainingMs) {
          o.state = "ready";
          rt.cardAgeMs = 0;
        }
      }
    }
    if (healthMs > 0) {
      for (const o of rt.occurrences) {
        if (o.state === "snoozed") {
          o.snoozeMs = Math.max(0, o.snoozeMs - healthMs);
          if (!o.snoozeMs) {
            o.state = "pending";
            this.emit("reminder_shown", o.id, { ruleId: o.ruleId });
            this.alert();
          }
        }
      }
      for (const r of this.settings.reminders) {
        if (r.enabled && !rt.occurrences.some((o) => o.ruleId === r.id && !o.preview)) rt.remaining[r.id] = Math.max(0, rt.remaining[r.id] - healthMs);
      }
      if (this.settings.reminders.some((r) => r.enabled && rt.remaining[r.id] === 0 && !rt.occurrences.some((o) => o.ruleId === r.id && !o.preview))) {
        const hadCard = !!rt.notice || rt.occurrences.some((o) => o.state !== "snoozed");
        for (const r of this.settings.reminders) {
          if (r.enabled && rt.remaining[r.id] <= 6e4 && !rt.occurrences.some((o) => o.ruleId === r.id && !o.preview)) {
            const o = { id: crypto.randomUUID(), ruleId: r.id, state: "pending", remainingMs: r.durationSeconds * 1e3, snoozeMs: 0, preview: false };
            rt.occurrences = rt.occurrences.filter((x) => x.ruleId !== r.id);
            rt.occurrences.push(o);
            rt.remaining[r.id] = this.interval(r.id);
            this.emit("reminder_shown", o.id, { ruleId: r.id });
          }
        }
        if (!hadCard) this.alert();
      }
    }
    if (rt.cardVisible && rt.alertSequence === previousAlert2 && !hadRunningAction && !rt.occurrences.some((o) => o.state === "running")) {
      rt.cardAgeMs += ms;
      if (rt.cardAgeMs >= 6e4) rt.cardVisible = false;
    }
    this.cleanCard();
  }
  startFocus() {
    const f = this.runtime.focus;
    if (f.status === "running") return;
    const continuing = f.status === "paused";
    if (!continuing) f.sessionId = crypto.randomUUID();
    f.status = "running";
    this.runtime.notice = null;
    this.cleanCard();
    this.emit(continuing ? "focus_resumed" : f.mode === "focus" ? "focus_started" : "break_started", f.sessionId);
  }
  pauseFocus() {
    if (this.runtime.focus.status !== "running") return;
    this.runtime.focus.status = "paused";
    this.emit("focus_paused", this.runtime.focus.sessionId);
  }
  resetFocus(mode = this.runtime.focus.mode) {
    const f = this.runtime.focus;
    this.emit("focus_reset", f.sessionId);
    f.mode = mode;
    f.status = "idle";
    f.totalMs = this.duration(mode);
    f.remainingMs = f.totalMs;
    f.sessionId = crypto.randomUUID();
    this.runtime.notice = null;
    this.cleanCard();
  }
  updateSettings(raw) {
    const next = validateSettings(raw);
    const prev = this.settings;
    this.settings = next;
    this.settingsRevision++;
    for (const r of next.reminders) {
      const before = prev.reminders.find((v) => v.id === r.id);
      if (before.enabled !== r.enabled || before.intervalMinutes !== r.intervalMinutes || before.durationSeconds !== r.durationSeconds || prev.healthEnabled !== next.healthEnabled) {
        this.cancelRule(r.id, "reminder_cancelled");
        this.runtime.remaining[r.id] = this.interval(r.id);
      }
    }
    if (prev.healthEnabled !== next.healthEnabled) this.runtime.graceMs = 0;
    if (this.runtime.focus.status === "idle" || this.runtime.focus.status === "ready") {
      const duration = this.duration(this.runtime.focus.mode);
      this.runtime.focus.remainingMs = duration;
      this.runtime.focus.totalMs = duration;
    }
    this.cleanCard();
  }
  cancelRule(id, reason) {
    for (const o of this.runtime.occurrences.filter((o2) => o2.ruleId === id)) this.emit(reason, o.id, { ruleId: id, preview: o.preview });
    this.runtime.occurrences = this.runtime.occurrences.filter((o) => o.ruleId !== id);
  }
  deferPending() {
    const rt = this.runtime;
    for (const o of rt.occurrences.filter((o2) => o2.state !== "snoozed")) {
      this.emit("reminder_deferred", o.id, { ruleId: o.ruleId, preview: o.preview });
      rt.remaining[o.ruleId] = this.interval(o.ruleId);
    }
    rt.occurrences = rt.occurrences.filter((o) => o.state === "snoozed");
    rt.notice = null;
    rt.cardVisible = false;
  }
  toggleMeeting() {
    if (this.runtime.quietUntil) {
      this.runtime.quietUntil = null;
      this.runtime.graceMs = 3e4;
    } else {
      this.runtime.quietUntil = this.now + 30 * 6e4;
      this.deferPending();
    }
    this.emit("quiet_changed", void 0, { enabled: !!this.runtime.quietUntil });
  }
  setSystemPaused(reason, paused) {
    if (paused) {
      if (!this.systemReasons.has(reason) && !this.systemReasons.size) this.deferPending();
      this.systemReasons.add(reason);
    } else {
      const existed = this.systemReasons.delete(reason);
      if (existed && !this.systemReasons.size) this.runtime.graceMs = 3e4;
    }
  }
  preview(id) {
    if (!this.settings.reminders.some((r) => r.id === id)) throw new Error("\u627E\u4E0D\u5230\u8FD9\u9879\u63D0\u9192");
    if (this.runtime.quietUntil || this.systemReasons.size) throw new Error("\u8BF7\u5148\u6062\u590D\u63D0\u9192\uFF0C\u518D\u8BD5\u4E00\u4E0B");
    if (this.runtime.occurrences.some((o) => o.ruleId === id)) throw new Error("\u8FD9\u9879\u63D0\u9192\u6B63\u5728\u8FDB\u884C\uFF0C\u8BF7\u5148\u5904\u7406");
    const rule = this.settings.reminders.find((r) => r.id === id);
    this.runtime.occurrences.push({ id: crypto.randomUUID(), ruleId: id, state: "pending", remainingMs: rule.durationSeconds * 1e3, snoozeMs: 0, preview: true });
    this.alert();
  }
  action(id, action) {
    const o = this.runtime.occurrences.find((v) => v.id === id);
    if (!o) return;
    if (action === "start") {
      if (o.state !== "pending") return;
      o.state = o.remainingMs ? "running" : "ready";
      this.runtime.cardAgeMs = 0;
      this.emit("reminder_started", o.id, { ruleId: o.ruleId, preview: o.preview });
      return;
    }
    if (action === "complete" && o.state !== "ready") return;
    if (action === "snooze") {
      if (o.preview) {
        this.runtime.occurrences = this.runtime.occurrences.filter((v) => v.id !== id);
        this.cleanCard();
        return;
      }
      o.state = "snoozed";
      o.snoozeMs = 3e5;
      o.remainingMs = this.settings.reminders.find((r) => r.id === o.ruleId).durationSeconds * 1e3;
    } else {
      this.runtime.occurrences = this.runtime.occurrences.filter((v) => v.id !== id);
      if (!o.preview) {
        this.runtime.remaining[o.ruleId] = this.interval(o.ruleId);
        if (action === "complete") this.day().healthCompleted++;
      }
    }
    this.emit(action === "complete" ? "reminder_completed" : action === "snooze" ? "reminder_snoozed" : "reminder_skipped", o.id, { ruleId: o.ruleId, preview: o.preview });
    this.runtime.cardAgeMs = 0;
    this.cleanCard();
  }
  openCard() {
    if (this.runtime.notice || this.runtime.occurrences.some((o) => o.state !== "snoozed")) this.reveal();
  }
  collapseCard() {
    this.runtime.cardVisible = false;
  }
  dismissNotice() {
    this.runtime.notice = null;
    this.cleanCard();
  }
  serialize() {
    return clone({ schemaVersion: 1, settings: this.settings, settingsRevision: this.settingsRevision, runtime: this.runtime, stats: this.stats });
  }
  snapshot() {
    const rt = this.runtime;
    const options = this.settings.reminders.filter((r) => r.enabled && !rt.occurrences.some((o) => o.ruleId === r.id && !o.preview)).map((r) => ({ ruleId: r.id, remainingMs: rt.remaining[r.id] }));
    for (const o of rt.occurrences.filter((o2) => o2.state === "snoozed" && !o2.preview)) options.push({ ruleId: o.ruleId, remainingMs: o.snoozeMs });
    options.sort((a, b) => a.remainingMs - b.remainingMs);
    return clone({
      settings: this.settings,
      settingsRevision: this.settingsRevision,
      focus: rt.focus,
      occurrences: rt.occurrences.filter((o) => o.state !== "snoozed"),
      notice: rt.notice,
      cardVisible: rt.cardVisible && !this.systemReasons.size && !rt.quietUntil,
      alertSequence: rt.alertSequence,
      quietRemainingMs: Math.max(0, (rt.quietUntil ?? this.now) - this.now),
      graceMs: rt.graceMs,
      systemPaused: !!this.systemReasons.size,
      nextReminder: this.settings.healthEnabled ? options[0] ?? null : null,
      today: this.stats[localDay(this.now)] ?? emptyStats(),
      pendingCount: rt.occurrences.filter((o) => o.state !== "snoozed").length + (rt.notice ? 1 : 0),
      storageError: null,
      recovered: false
    });
  }
};

// src/main/store.ts
var import_node_fs = require("node:fs");
var import_node_path = __toESM(require("node:path"));
var JsonStore = class {
  constructor(directory, filename, validate, versionError) {
    this.directory = directory;
    this.validate = validate;
    this.versionError = versionError;
    this.file = import_node_path.default.join(directory, filename);
  }
  directory;
  validate;
  versionError;
  lastValidText;
  queue = Promise.resolve();
  file;
  recovered = false;
  readOnlyReason = null;
  parse(text) {
    const raw = JSON.parse(text);
    if (typeof raw?.schemaVersion === "number" && raw.schemaVersion > 1) {
      this.readOnlyReason = this.versionError;
      throw new Error(this.readOnlyReason);
    }
    return this.validate(raw);
  }
  async load() {
    let mainExists = false;
    try {
      const text = await import_node_fs.promises.readFile(this.file, "utf8");
      mainExists = true;
      const parsed = this.parse(text);
      this.lastValidText = text;
      return parsed;
    } catch (error) {
      if (this.readOnlyReason) return void 0;
      if (error.code !== "ENOENT") this.recovered = true;
    }
    try {
      const text = await import_node_fs.promises.readFile(`${this.file}.bak`, "utf8");
      const parsed = this.parse(text);
      this.lastValidText = text;
      this.recovered = true;
      if (mainExists) await import_node_fs.promises.copyFile(this.file, `${this.file}.invalid-${Date.now()}`).catch(() => {
      });
      return parsed;
    } catch {
      return void 0;
    }
  }
  save(state2) {
    const text = JSON.stringify(state2, null, 2);
    const job = this.queue.catch(() => {
    }).then(async () => {
      if (this.readOnlyReason) throw new Error(this.readOnlyReason);
      await import_node_fs.promises.mkdir(this.directory, { recursive: true });
      if (this.lastValidText) {
        await import_node_fs.promises.writeFile(`${this.file}.bak.tmp`, this.lastValidText, { encoding: "utf8", flush: true });
        await import_node_fs.promises.rename(`${this.file}.bak.tmp`, `${this.file}.bak`);
      }
      await import_node_fs.promises.writeFile(`${this.file}.tmp`, text, { encoding: "utf8", flush: true });
      await import_node_fs.promises.rename(`${this.file}.tmp`, this.file);
      this.lastValidText = text;
    });
    this.queue = job;
    return job;
  }
};
function validateTimerState(value) {
  const raw = value;
  if (raw?.schemaVersion !== 1 || !raw.runtime || !raw.stats || typeof raw.stats !== "object") throw new Error("\u6570\u636E\u683C\u5F0F\u4E0D\u6B63\u786E");
  validateSettings(raw.settings);
  return raw;
}
var Store = class extends JsonStore {
  constructor(directory) {
    super(directory, "state.json", validateTimerState, "\u6570\u636E\u6765\u81EA\u66F4\u65B0\u7248\u672C\u3002\u4E3A\u4FDD\u7559\u539F\u6570\u636E\uFF0C\u5F53\u524D\u7248\u672C\u4E0D\u4F1A\u8986\u76D6\u8BBE\u7F6E\uFF0C\u8BF7\u5347\u7EA7\u606F\u95F4\u3002");
  }
  async appendEvents(events2) {
    if (this.readOnlyReason || !events2.length) return;
    const grouped = /* @__PURE__ */ new Map();
    for (const event of events2) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(event.localDate)) continue;
      const group = grouped.get(event.localDate) ?? [];
      group.push(event);
      grouped.set(event.localDate, group);
    }
    const dir = import_node_path.default.join(this.directory, "events");
    await import_node_fs.promises.mkdir(dir, { recursive: true });
    for (const [day, batch] of grouped) await import_node_fs.promises.appendFile(import_node_path.default.join(dir, `${day}.jsonl`), batch.map((e) => JSON.stringify(e)).join("\n") + "\n", "utf8");
  }
};

// src/domain/work-plans.ts
var WORK_TITLE_LIMIT = 120;
var WORK_NOTE_LIMIT = 600;
function isPlannedDate(value) {
  if (value === null) return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) return false;
  const date = /* @__PURE__ */ new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function validateDraft(value) {
  if (!value || typeof value !== "object") throw new Error("\u5DE5\u4F5C\u8BA1\u5212\u683C\u5F0F\u4E0D\u6B63\u786E");
  const draft = value;
  const title = typeof draft.title === "string" ? draft.title.trim() : "";
  if (!title || title.length > WORK_TITLE_LIMIT) throw new Error(`\u5DE5\u4F5C\u540D\u79F0\u9700\u586B\u5199 1\u2013${WORK_TITLE_LIMIT} \u4E2A\u5B57\u7B26`);
  if (typeof draft.note !== "string" || draft.note.length > WORK_NOTE_LIMIT) throw new Error(`\u5907\u6CE8\u4E0D\u80FD\u8D85\u8FC7 ${WORK_NOTE_LIMIT} \u4E2A\u5B57\u7B26`);
  if (!isPlannedDate(draft.plannedOn)) throw new Error("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u8BA1\u5212\u65E5\u671F");
  return { title, note: draft.note.trim(), plannedOn: draft.plannedOn };
}
function validateWorkPlanData(raw) {
  const data = raw;
  if (data?.schemaVersion !== 1 || !Array.isArray(data.items)) throw new Error("\u5DE5\u4F5C\u8BA1\u5212\u6587\u4EF6\u683C\u5F0F\u4E0D\u6B63\u786E");
  const ids = /* @__PURE__ */ new Set();
  const items = data.items.map((item) => {
    const draft = validateDraft(item);
    if (typeof item.id !== "string" || !item.id || item.id.length > 100 || ids.has(item.id)) {
      throw new Error("\u5DE5\u4F5C\u8BA1\u5212\u7F16\u53F7\u65E0\u6548");
    }
    if (item.completedAt !== null && (typeof item.completedAt !== "string" || !Number.isFinite(Date.parse(item.completedAt)))) {
      throw new Error("\u5DE5\u4F5C\u8BA1\u5212\u5B8C\u6210\u65F6\u95F4\u65E0\u6548");
    }
    ids.add(item.id);
    return { ...draft, id: item.id, completedAt: item.completedAt };
  });
  return { schemaVersion: 1, items };
}
function applyWorkPlanChange(data, raw) {
  if (!raw || typeof raw !== "object") throw new Error("\u5DE5\u4F5C\u8BA1\u5212\u64CD\u4F5C\u683C\u5F0F\u4E0D\u6B63\u786E");
  const change = raw;
  if (change.type === "add") {
    const item = { ...validateDraft(change.draft), id: crypto.randomUUID(), completedAt: null };
    return { ...data, items: [...data.items, item] };
  }
  if (change.type !== "edit" && change.type !== "set-completed") throw new Error("\u4E0D\u652F\u6301\u7684\u5DE5\u4F5C\u8BA1\u5212\u64CD\u4F5C");
  const index = data.items.findIndex((item) => item.id === change.id);
  if (index < 0) throw new Error("\u627E\u4E0D\u5230\u8FD9\u6761\u5DE5\u4F5C\u8BA1\u5212");
  const items = [...data.items];
  if (change.type === "edit") {
    items[index] = { ...items[index], ...validateDraft(change.draft) };
  } else {
    if (typeof change.completed !== "boolean") throw new Error("\u5B8C\u6210\u72B6\u6001\u65E0\u6548");
    const completedAt = change.completed ? items[index].completedAt ?? (/* @__PURE__ */ new Date()).toISOString() : null;
    items[index] = { ...items[index], completedAt };
  }
  return { ...data, items };
}

// src/main/bounds.ts
function visibleBounds(position2, size, areas2) {
  const displays = areas2.length ? areas2 : [{ x: 0, y: 0, width: 1280, height: 720 }];
  const valid = position2 && Number.isFinite(position2.x) && Number.isFinite(position2.y) ? position2 : void 0;
  const area = valid ? displays.reduce((a, b) => {
    const distance = (r) => Math.max(r.x - valid.x, 0, valid.x - r.x - r.width) ** 2 + Math.max(r.y - valid.y, 0, valid.y - r.y - r.height) ** 2;
    return distance(a) <= distance(b) ? a : b;
  }) : displays[0];
  const width = Math.min(size.width, area.width), height = Math.min(size.height, area.height);
  return {
    x: Math.round(Math.max(area.x, Math.min(valid?.x ?? area.x + area.width - width - 28, area.x + area.width - width))),
    y: Math.round(Math.max(area.y, Math.min(valid?.y ?? area.y + 70, area.y + area.height - height))),
    width,
    height
  };
}

// src/main/main.ts
import_electron.app.setName("\u606F\u95F4");
import_electron.app.disableHardwareAcceleration();
if (process.env.XIJIAN_DATA_DIR) import_electron.app.setPath("userData", import_node_path2.default.resolve(process.env.XIJIAN_DATA_DIR));
var testMode = process.env.XIJIAN_TEST === "1" && !import_electron.app.isPackaged;
var gotLock = import_electron.app.requestSingleInstanceLock();
if (!gotLock) import_electron.app.quit();
var engine;
var store;
var workStore;
var workPlans;
var workWrites = Promise.resolve();
var widget;
var reminder;
var settingsWindow;
var workWindow;
var updates;
var preparingUpdate = false;
var tray;
var position;
var quitting = false;
var savedForQuit = false;
var storageError = null;
var events = [];
var lastTick = import_node_perf_hooks.performance.now();
var lastSound = -Infinity;
var previousAlert = 0;
var settingsReady = false;
var reminderReady = false;
var commandQueue = Promise.resolve();
var lastTrayText = "";
var lastMenuKey = "";
var uiFile = import_node_path2.default.join(__dirname, "index.html");
var allWindows = () => [widget, reminder, settingsWindow, workWindow].filter((w) => !!w && !w.isDestroyed());
var areas = () => import_electron.screen.getAllDisplays().map((d) => d.workArea);
var widgetSize = () => engine.settings.compact ? { width: 232, height: 68 } : { width: 320, height: 462 };
var state = () => ({ ...engine.snapshot(), storageError, recovered: store.recovered, update: updates?.snapshot() });
var savedState = () => ({ ...engine.serialize(), position });
async function persist() {
  events.push(...engine.drainEvents());
  const batch = events.splice(0);
  try {
    await store.save(savedState());
    await store.appendEvents(batch);
    storageError = null;
  } catch (error) {
    events.unshift(...batch);
    storageError = error instanceof Error ? error.message : "\u672C\u5730\u4FDD\u5B58\u5931\u8D25";
    if (events.length > 5e3) events = events.slice(-5e3);
  }
}
function secure(win) {
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event) => event.preventDefault());
  win.webContents.on("will-attach-webview", (event) => event.preventDefault());
}
function makeWindow(view, size, transparent = true) {
  const win = new import_electron.BrowserWindow({
    ...visibleBounds(void 0, size, areas()),
    show: false,
    frame: false,
    transparent,
    backgroundColor: transparent ? "#00000000" : "#FDFCF8",
    resizable: view === "work-plans",
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    skipTaskbar: view === "widget" || view === "reminder",
    title: { settings: "\u606F\u95F4 \xB7 \u8BBE\u7F6E", reminder: "\u606F\u95F4 \xB7 \u4F11\u606F\u4E00\u4E0B", "work-plans": "\u606F\u95F4 \xB7 \u5DE5\u4F5C\u8BA1\u5212" }[view] ?? "\u606F\u95F4",
    icon: import_node_path2.default.join(import_electron.app.getAppPath(), "assets", "icon.png"),
    webPreferences: { preload: import_node_path2.default.join(__dirname, "preload.cjs"), contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false, autoplayPolicy: "no-user-gesture-required" }
  });
  secure(win);
  void win.loadFile(uiFile, { query: { view, theme: engine.settings.theme } });
  return win;
}
function showWidget() {
  if (widget && !widget.isDestroyed()) {
    if (widget.isMinimized()) widget.restore();
    widget.show();
    publish();
  }
}
function fitWidget() {
  if (!widget || widget.isDestroyed()) return;
  const p = widget.getPosition();
  widget.setBounds(visibleBounds({ x: p[0], y: p[1] }, widgetSize(), areas()));
  widget.setAlwaysOnTop(engine.settings.alwaysOnTop, "floating");
}
function openSettings() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    return;
  }
  settingsReady = false;
  settingsWindow = makeWindow("settings", { width: 720, height: 742 });
  settingsWindow.once("ready-to-show", () => {
    settingsReady = true;
    settingsWindow?.show();
    publish();
  });
  settingsWindow.on("closed", () => {
    settingsWindow = void 0;
    settingsReady = false;
  });
}
function openWorkPlans() {
  if (workWindow && !workWindow.isDestroyed()) {
    workWindow.show();
    return;
  }
  workWindow = makeWindow("work-plans", { width: 1180, height: 760 });
  const [width, height] = workWindow.getSize();
  workWindow.setMinimumSize(Math.min(760, width), Math.min(520, height));
  workWindow.once("ready-to-show", () => workWindow?.show());
  workWindow.on("closed", () => {
    workWindow = void 0;
  });
}
function workPlanView() {
  return { items: workPlans.items, readOnlyReason: workStore.readOnlyReason };
}
function changeWorkPlan(change) {
  if (quitting || preparingUpdate) return Promise.reject(new Error("\u606F\u95F4\u6B63\u5728\u9000\u51FA\u6216\u5B89\u88C5\u66F4\u65B0"));
  const job = workWrites.catch(() => {
  }).then(async () => {
    if (workStore.readOnlyReason) throw new Error(workStore.readOnlyReason);
    const next = applyWorkPlanChange(workPlans, change);
    try {
      await workStore.save(next);
    } catch {
      throw new Error("\u5DE5\u4F5C\u8BA1\u5212\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u672C\u673A\u5B58\u50A8\u540E\u91CD\u8BD5");
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
  reminder = makeWindow("reminder", { width: 360, height: 450 });
  reminder.setAlwaysOnTop(true, "floating");
  reminder.once("ready-to-show", () => {
    reminderReady = true;
    publish();
  });
  reminder.on("close", (event) => {
    if (!quitting) {
      event.preventDefault();
      engine.collapseCard();
      reminder?.hide();
      publish();
    }
  });
  reminder.on("closed", () => {
    reminder = void 0;
    reminderReady = false;
  });
}
function placeReminder(s) {
  if (!reminder || reminder.isDestroyed()) return;
  const count = s.occurrences.length + (s.notice ? 1 : 0);
  const size = { width: 360, height: Math.min(660, 170 + count * 220) };
  const w = widget.getBounds();
  const area = import_electron.screen.getDisplayMatching(w).workArea;
  const p = { x: w.x >= area.x + area.width / 2 ? w.x - size.width - 8 : w.x + w.width + 8, y: w.y };
  const next = visibleBounds(p, size, areas());
  const old = reminder.getBounds();
  if (old.width !== next.width || old.height !== next.height || !reminder.isVisible()) reminder.setBounds(next);
}
function trayMenu() {
  return import_electron.Menu.buildFromTemplate([
    { label: "\u6253\u5F00\u606F\u95F4", click: showWidget },
    { label: "\u5DE5\u4F5C\u8BA1\u5212", click: openWorkPlans },
    { label: engine.runtime.focus.status === "running" ? "\u6682\u505C\u8BA1\u65F6" : "\u5F00\u59CB / \u7EE7\u7EED\u8BA1\u65F6", click: () => fromTray({ type: engine.runtime.focus.status === "running" ? "focus.pause" : "focus.start" }) },
    { type: "separator" },
    { label: "\u5065\u5EB7\u63D0\u9192", type: "checkbox", checked: engine.settings.healthEnabled, click: (item) => fromTray({ type: "health.toggle", enabled: item.checked }) },
    { label: engine.runtime.quietUntil ? "\u6062\u590D\u5065\u5EB7\u63D0\u9192" : "\u4F1A\u8BAE\u4E2D \xB7 \u6682\u505C\u63D0\u919230\u5206\u949F", click: () => fromTray({ type: "meeting.toggle" }) },
    { label: "\u59CB\u7EC8\u7F6E\u9876", type: "checkbox", checked: engine.settings.alwaysOnTop, click: () => fromTray({ type: "window.pin" }) },
    { label: "\u5207\u6362\u8FF7\u4F60\u6A21\u5F0F", click: () => fromTray({ type: "window.compact" }) },
    { label: "\u8BBE\u7F6E", click: openSettings },
    { label: updateMenuLabel(), enabled: !!updates && !["manual", "checking", "downloading", "installing"].includes(updates.snapshot().phase), click: () => void updates.perform() },
    { type: "separator" },
    { label: "\u9690\u85CF\u5230\u6258\u76D8", click: () => widget.hide() },
    { label: "\u9000\u51FA\u606F\u95F4", click: () => import_electron.app.quit() }
  ]);
}
function publish() {
  if (!engine || !widget || widget.isDestroyed() || quitting) return;
  const s = state();
  for (const win of allWindows()) if (win.isVisible() && !win.webContents.isLoadingMainFrame()) win.webContents.send("xijian:state", s);
  if (s.cardVisible && !s.systemPaused) {
    ensureReminder();
    if (reminderReady && reminder) {
      placeReminder(s);
      if (!reminder.isVisible()) reminder.showInactive();
    }
  } else if (reminder && !reminder.isDestroyed()) {
    reminder.destroy();
    reminder = void 0;
    reminderReady = false;
  }
  if (s.alertSequence !== previousAlert) {
    previousAlert = s.alertSequence;
    if (s.settings.soundEnabled && s.cardVisible && import_node_perf_hooks.performance.now() - lastSound >= 6e4) {
      lastSound = import_node_perf_hooks.performance.now();
      widget.webContents.send("xijian:sound");
    }
  }
  const mins = Math.ceil(s.focus.remainingMs / 6e4);
  const trayText = `\u606F\u95F4 \xB7 ${MODE_NAMES[s.focus.mode]} ${mins}\u5206\u949F \xB7 ${s.focus.status === "running" ? "\u8FDB\u884C\u4E2D" : "\u5DF2\u6682\u505C"}`;
  if (tray && trayText !== lastTrayText) {
    tray.setToolTip(trayText);
    lastTrayText = trayText;
  }
  const menuKey = `${s.settingsRevision}/${s.focus.status}/${!!s.quietRemainingMs}/${s.update?.phase}`;
  if (tray && menuKey !== lastMenuKey) {
    tray.setContextMenu(trayMenu());
    lastMenuKey = menuKey;
  }
}
function tick() {
  const now = import_node_perf_hooks.performance.now(), delta = Math.max(0, now - lastTick);
  lastTick = now;
  if (delta > 15e3) {
    engine.setSystemPaused("unobserved", true);
    engine.setSystemPaused("unobserved", false);
    engine.advance(0, Date.now());
  } else engine.advance(delta, Date.now());
}
async function updateSettings(next) {
  const valid = validateSettings(next);
  const prospective = savedState();
  prospective.settings = valid;
  prospective.settingsRevision++;
  try {
    await store.save(prospective);
  } catch (error) {
    storageError = error instanceof Error ? error.message : "\u672C\u5730\u4FDD\u5B58\u5931\u8D25";
    throw new Error(`\u8BBE\u7F6E\u6CA1\u6709\u4FDD\u5B58\uFF1A${storageError}`);
  }
  engine.updateSettings(valid);
  storageError = null;
  fitWidget();
  tray?.setContextMenu(trayMenu());
}
async function dispatch(raw) {
  if (preparingUpdate) throw new Error("\u6B63\u5728\u4FDD\u5B58\u6570\u636E\u5E76\u5B89\u88C5\u66F4\u65B0\uFF0C\u8BF7\u7A0D\u5019");
  if (!raw || typeof raw !== "object" || typeof raw.type !== "string") throw new Error("\u64CD\u4F5C\u683C\u5F0F\u4E0D\u6B63\u786E");
  const c = raw;
  tick();
  switch (c.type) {
    case "focus.start":
      engine.startFocus();
      break;
    case "focus.pause":
      engine.pauseFocus();
      break;
    case "focus.reset":
      engine.resetFocus();
      break;
    case "focus.select":
      if (!["focus", "short", "long"].includes(c.mode)) throw new Error("\u8BA1\u65F6\u6A21\u5F0F\u4E0D\u6B63\u786E");
      engine.resetFocus(c.mode);
      break;
    case "settings.update":
      if (c.revision !== engine.settingsRevision) throw new Error("\u8BBE\u7F6E\u5DF2\u5728\u53E6\u4E00\u7A97\u53E3\u66F4\u65B0\uFF0C\u8BF7\u91CD\u65B0\u8C03\u6574\u8FD9\u9879\u8BBE\u7F6E");
      await updateSettings(c.settings);
      break;
    case "settings.defaults":
      await updateSettings(defaultSettings());
      break;
    case "health.toggle":
      if (typeof c.enabled !== "boolean") throw new Error("\u5F00\u5173\u8BBE\u7F6E\u4E0D\u6B63\u786E");
      await updateSettings({ ...engine.settings, healthEnabled: c.enabled });
      break;
    case "meeting.toggle":
      engine.toggleMeeting();
      break;
    case "reminder.start":
    case "reminder.complete":
    case "reminder.snooze":
    case "reminder.skip":
      if (typeof c.id !== "string" || c.id.length > 100) throw new Error("\u63D0\u9192\u7F16\u53F7\u4E0D\u6B63\u786E");
      engine.action(c.id, c.type.split(".")[1]);
      break;
    case "reminder.preview":
      if (!Object.hasOwn(RULE_INFO, c.ruleId)) throw new Error("\u63D0\u9192\u7C7B\u578B\u4E0D\u6B63\u786E");
      engine.preview(c.ruleId);
      break;
    case "reminders.open":
      engine.openCard();
      break;
    case "reminders.collapse":
      engine.collapseCard();
      break;
    case "notice.dismiss":
      engine.dismissNotice();
      break;
    case "window.settings":
      openSettings();
      break;
    case "window.close-settings":
      settingsWindow?.close();
      break;
    case "window.work-plans":
      openWorkPlans();
      return state();
    case "window.close-work-plans":
      workWindow?.close();
      return state();
    case "update.action":
      void updates.perform();
      return state();
    case "window.hide":
      widget.hide();
      break;
    case "window.compact":
      await updateSettings({ ...engine.settings, compact: !engine.settings.compact });
      break;
    case "window.pin":
      await updateSettings({ ...engine.settings, alwaysOnTop: !engine.settings.alwaysOnTop });
      break;
    case "window.menu":
      trayMenu().popup({ window: widget });
      break;
    case "app.quit":
      import_electron.app.quit();
      break;
    default:
      throw new Error("\u4E0D\u652F\u6301\u7684\u64CD\u4F5C");
  }
  publish();
  await persist();
  publish();
  return state();
}
function run(command) {
  const result = commandQueue.catch(() => {
  }).then(() => dispatch(command));
  commandQueue = result;
  return result;
}
function fromTray(command) {
  void run(command).catch((error) => {
    storageError = error instanceof Error ? error.message : "\u64CD\u4F5C\u672A\u5B8C\u6210";
    showWidget();
    publish();
  });
}
function updateMenuLabel() {
  if (!updates) return "\u68C0\u67E5\u66F4\u65B0";
  const update = updates.snapshot();
  if (update.phase === "manual") return "\u901A\u8FC7\u5B89\u88C5\u5305\u66F4\u65B0";
  if (update.phase === "available") return "\u4E0B\u8F7D\u65B0\u7248\u606F\u95F4";
  if (update.phase === "ready") return "\u91CD\u542F\u5E76\u5B89\u88C5\u66F4\u65B0";
  return ["checking", "downloading", "installing"].includes(update.phase) ? update.message : "\u68C0\u67E5\u66F4\u65B0";
}
async function prepareUpdateInstall() {
  await commandQueue.catch(() => {
  });
  if (quitting) throw new Error("\u5E94\u7528\u6B63\u5728\u9000\u51FA");
  preparingUpdate = true;
  await workWrites;
  tick();
  await persist();
  if (storageError) throw new Error(storageError);
  savedForQuit = true;
}
function trusted(event) {
  const sender = allWindows().some((w) => w.webContents === event.sender);
  try {
    return sender && event.senderFrame === event.sender.mainFrame && import_node_path2.default.normalize((0, import_node_url.fileURLToPath)(event.senderFrame.url)) === import_node_path2.default.normalize(uiFile);
  } catch {
    return false;
  }
}
if (gotLock) void import_electron.app.whenReady().then(async () => {
  import_electron.app.setAppUserModelId("com.xijian.desktop");
  import_electron.Menu.setApplicationMenu(process.platform === "darwin" ? import_electron.Menu.buildFromTemplate([
    { label: "\u606F\u95F4", submenu: [{ label: "\u663E\u793A\u606F\u95F4", click: showWidget }, { label: "\u5DE5\u4F5C\u8BA1\u5212", click: openWorkPlans }, { label: "\u8BBE\u7F6E", accelerator: "Command+,", click: openSettings }, { type: "separator" }, { role: "quit", label: "\u9000\u51FA\u606F\u95F4" }] },
    { label: "\u7F16\u8F91", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }] }
  ]) : null);
  import_electron.session.defaultSession.setPermissionRequestHandler((_web, _permission, callback) => callback(false));
  import_electron.session.defaultSession.webRequest.onBeforeRequest({ urls: ["http://*/*", "https://*/*"] }, (_details, callback) => callback({ cancel: true }));
  const dataDirectory = import_electron.app.getPath("userData");
  store = new Store(dataDirectory);
  workStore = new JsonStore(dataDirectory, "work-plans.json", validateWorkPlanData, "\u5DE5\u4F5C\u8BA1\u5212\u6765\u81EA\u66F4\u65B0\u7248\u672C\uFF0C\u8BF7\u5347\u7EA7\u606F\u95F4\u540E\u67E5\u770B");
  const [saved, savedWorkPlans] = await Promise.all([store.load(), workStore.load()]);
  workPlans = savedWorkPlans ?? { schemaVersion: 1, items: [] };
  if (!savedWorkPlans && workStore.recovered && !workStore.readOnlyReason) {
    workStore.readOnlyReason = "\u5DE5\u4F5C\u8BA1\u5212\u6587\u4EF6\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559";
  }
  engine = new Engine(saved);
  const updateEnabled = process.platform === "win32" && import_electron.app.isPackaged && !process.env.PORTABLE_EXECUTABLE_DIR && (0, import_node_fs2.existsSync)(import_node_path2.default.join(process.resourcesPath, "app-update.yml"));
  import_electron_updater.autoUpdater.logger = null;
  updates = new Updates(import_electron_updater.autoUpdater, updateEnabled, import_electron.app.getVersion(), publish, () => {
    if (import_electron.Notification.isSupported()) new import_electron.Notification({ title: "\u606F\u95F4\u6709\u65B0\u7248\u672C", body: "\u53EF\u4ECE\u6258\u76D8\u83DC\u5355\u4E0B\u8F7D\u66F4\u65B0\uFF0C\u51C6\u5907\u597D\u540E\u518D\u91CD\u542F\u5B89\u88C5\u3002" }).show();
  }, prepareUpdateInstall, () => {
    if (preparingUpdate) {
      preparingUpdate = false;
      savedForQuit = false;
    }
  });
  storageError = store.readOnlyReason;
  if (saved?.position && Number.isFinite(saved.position.x) && Number.isFinite(saved.position.y)) position = saved.position;
  widget = makeWindow("widget", widgetSize());
  widget.setBounds(visibleBounds(position, widgetSize(), areas()));
  widget.setAlwaysOnTop(engine.settings.alwaysOnTop, "floating");
  widget.once("ready-to-show", () => {
    widget.show();
    publish();
  });
  widget.on("close", (event) => {
    if (!quitting) {
      event.preventDefault();
      widget.hide();
    }
  });
  widget.on("moved", () => {
    const [x, y] = widget.getPosition();
    position = { x, y };
    void persist();
  });
  widget.webContents.on("context-menu", () => trayMenu().popup({ window: widget }));
  const iconPath = import_node_path2.default.join(import_electron.app.getAppPath(), "assets", "icon.png");
  const icon = import_electron.nativeImage.createFromPath(iconPath).resize({ width: process.platform === "darwin" ? 18 : 20, height: process.platform === "darwin" ? 18 : 20 });
  tray = new import_electron.Tray(icon);
  tray.setToolTip("\u606F\u95F4 \xB7 \u6309\u4F60\u7684\u8282\u594F");
  tray.setContextMenu(trayMenu());
  tray.on("click", showWidget);
  tray.on("double-click", showWidget);
  import_electron.ipcMain.handle("xijian:get-state", (event) => {
    if (!trusted(event)) throw new Error("\u672A\u6388\u6743\u7684\u754C\u9762");
    return state();
  });
  import_electron.ipcMain.handle("xijian:command", (event, c) => {
    if (!trusted(event)) throw new Error("\u672A\u6388\u6743\u7684\u754C\u9762");
    return run(c);
  });
  import_electron.ipcMain.handle("xijian:work-plans", async (event) => {
    if (event.sender !== workWindow?.webContents || !trusted(event)) throw new Error("\u672A\u6388\u6743\u7684\u754C\u9762");
    await workWrites.catch(() => {
    });
    return workPlanView();
  });
  import_electron.ipcMain.handle("xijian:change-work-plan", (event, change) => {
    if (event.sender !== workWindow?.webContents || !trusted(event)) throw new Error("\u672A\u6388\u6743\u7684\u754C\u9762");
    return changeWorkPlan(change);
  });
  const suspend = (reason, value) => {
    tick();
    engine.setSystemPaused(reason, value);
    lastTick = import_node_perf_hooks.performance.now();
    publish();
    void persist();
  };
  import_electron.powerMonitor.on("suspend", () => suspend("sleep", true));
  import_electron.powerMonitor.on("resume", () => suspend("sleep", false));
  import_electron.powerMonitor.on("lock-screen", () => suspend("lock", true));
  import_electron.powerMonitor.on("unlock-screen", () => suspend("lock", false));
  if (import_electron.powerMonitor.getSystemIdleState(60) === "locked") engine.setSystemPaused("lock", true);
  import_electron.screen.on("display-removed", fitWidget);
  import_electron.screen.on("display-metrics-changed", fitWidget);
  lastTick = import_node_perf_hooks.performance.now();
  setInterval(() => {
    tick();
    publish();
  }, 500);
  setInterval(() => void persist(), 3e4);
  import_electron.app.on("second-instance", showWidget);
  import_electron.app.on("activate", showWidget);
  if (updateEnabled) {
    setTimeout(() => void updates.check(true), 3e4).unref();
    setInterval(() => void updates.check(true), 6 * 60 * 6e4).unref();
  }
  if (testMode) import_electron.app.__xijianTest = {
    state,
    run,
    advance: (ms) => {
      engine.advance(ms, Date.now());
      lastTick = import_node_perf_hooks.performance.now();
      publish();
      return state();
    },
    pauseSystem: (reason, value) => {
      engine.setSystemPaused(reason, value);
      lastTick = import_node_perf_hooks.performance.now();
      publish();
      return state();
    },
    hide: () => widget.hide(),
    show: showWidget,
    windowState: () => ({ widgetVisible: widget.isVisible(), alwaysOnTop: widget.isAlwaysOnTop(), bounds: widget.getBounds(), settingsVisible: !!settingsReady && !!settingsWindow?.isVisible(), reminderVisible: !!reminderReady && !!reminder?.isVisible() })
  };
}).catch((error) => {
  console.error(error);
  import_electron.app.exit(1);
});
import_electron.app.on("before-quit", (event) => {
  if (testMode) console.error("[xijian-test] before-quit", { savedForQuit, windows: allWindows().length });
  quitting = true;
  if (!savedForQuit && engine && store) {
    event.preventDefault();
    tick();
    savedForQuit = true;
    void Promise.allSettled([persist(), workWrites]).finally(() => {
      if (testMode) console.error("[xijian-test] persisted", storageError);
      tray?.destroy();
      import_electron.app.quit();
    });
  }
});
import_electron.app.on("window-all-closed", () => {
});
import_electron.app.on("will-quit", () => {
  if (testMode) console.error("[xijian-test] will-quit");
});
import_electron.app.on("quit", () => {
  if (testMode) console.error("[xijian-test] quit");
});
//# sourceMappingURL=main.cjs.map
