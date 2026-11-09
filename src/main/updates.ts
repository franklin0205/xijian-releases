import type { AppUpdater } from 'electron-updater';
import type { UpdateState } from '../shared';

type UpdateClient = Pick<AppUpdater, 'on' | 'checkForUpdates' | 'downloadUpdate' | 'quitAndInstall' | 'autoDownload' | 'autoInstallOnAppQuit' | 'allowDowngrade'>;

export class Updates {
  private value: UpdateState;
  private automaticCheck = false;

  constructor(
    private readonly client: UpdateClient,
    private readonly enabled: boolean,
    currentVersion: string,
    private readonly changed: () => void,
    private readonly notifyAvailable: () => void,
    private readonly prepareInstall: () => Promise<void>,
    private readonly cancelInstall: () => void,
    manualMessage = '当前版本通过安装包更新'
  ) {
    this.value = {
      phase: enabled ? 'idle' : 'manual',
      message: enabled ? '可检查新版本' : manualMessage,
      currentVersion
    };
    client.autoDownload = false;
    client.autoInstallOnAppQuit = false;
    client.allowDowngrade = false;
    client.on('update-available', info => {
      this.set({ phase: 'available', nextVersion: info.version, message: `发现新版本 ${info.version}` });
      if (this.automaticCheck) this.notifyAvailable();
    });
    client.on('update-not-available', () => this.set({ phase: 'idle', message: '已是最新版本', nextVersion: undefined }));
    client.on('download-progress', progress => {
      this.set({ phase: 'downloading', message: `正在下载更新 ${Math.round(progress.percent)}%` });
    });
    client.on('update-downloaded', info => this.set({ phase: 'ready', nextVersion: info.version, message: '更新已下载，可重启安装' }));
    client.on('error', () => {
      if (this.value.phase === 'installing') this.cancelInstall();
      this.set({ phase: 'error', message: '更新未完成，请稍后重新检查' });
    });
  }

  snapshot(): UpdateState { return { ...this.value }; }

  private set(value: Partial<UpdateState>) {
    this.value = { ...this.value, ...value };
    this.changed();
  }

  async check(automatic = false) {
    if (!this.enabled) return;
    if (!['idle', 'error'].includes(this.value.phase)) return;
    this.automaticCheck = automatic;
    this.set({ phase: 'checking', message: '正在检查更新…' });
    try {
      await this.client.checkForUpdates();
    } catch {
      this.set({ phase: 'error', message: '暂时无法检查更新，请稍后重试' });
    } finally {
      this.automaticCheck = false;
    }
  }

  async perform() {
    if (!this.enabled) return;
    if (this.value.phase === 'available') {
      this.set({ phase: 'downloading', message: '正在下载更新…' });
      try { await this.client.downloadUpdate(); }
      catch { this.set({ phase: 'error', message: '下载未完成，请重新检查后重试' }); }
      return;
    }
    if (this.value.phase === 'ready') {
      this.set({ phase: 'installing', message: '正在保存数据并安装更新…' });
      try {
        await this.prepareInstall();
        this.client.quitAndInstall(false, true);
      } catch {
        this.cancelInstall();
        this.set({ phase: 'ready', message: '数据保存未完成，请重试安装' });
      }
      return;
    }
    await this.check();
  }
}
