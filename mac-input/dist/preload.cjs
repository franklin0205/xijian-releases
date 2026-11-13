"use strict";

// src/main/preload.ts
var import_electron = require("electron");
var api = {
  getState: () => import_electron.ipcRenderer.invoke("xijian:get-state"),
  command: (command) => import_electron.ipcRenderer.invoke("xijian:command", command),
  getWorkPlans: () => import_electron.ipcRenderer.invoke("xijian:work-plans"),
  changeWorkPlan: (change) => import_electron.ipcRenderer.invoke("xijian:change-work-plan", change),
  onState: (listener) => {
    const handler = (_, state) => listener(state);
    import_electron.ipcRenderer.on("xijian:state", handler);
    return () => import_electron.ipcRenderer.removeListener("xijian:state", handler);
  },
  onSound: (listener) => {
    const handler = () => listener();
    import_electron.ipcRenderer.on("xijian:sound", handler);
    return () => import_electron.ipcRenderer.removeListener("xijian:sound", handler);
  }
};
import_electron.contextBridge.exposeInMainWorld("xijian", api);
