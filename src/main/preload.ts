import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopAPI, Snapshot } from '../shared';

const api: DesktopAPI = {
  platform: process.platform,
  getState: () => ipcRenderer.invoke('xijian:get-state'),
  command: command => ipcRenderer.invoke('xijian:command', command),
  getWorkPlans: () => ipcRenderer.invoke('xijian:work-plans'),
  changeWorkPlan: change => ipcRenderer.invoke('xijian:change-work-plan', change),
  onState: listener => {
    const handler = (_event: Electron.IpcRendererEvent, state: Snapshot) => listener(state);
    ipcRenderer.on('xijian:state', handler);
    return () => ipcRenderer.removeListener('xijian:state', handler);
  },
  onSound: listener => {
    const handler = () => listener();
    ipcRenderer.on('xijian:sound', handler);
    return () => ipcRenderer.removeListener('xijian:sound', handler);
  }
};
contextBridge.exposeInMainWorld('xijian', api);
