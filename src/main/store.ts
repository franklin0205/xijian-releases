import { promises as fs } from 'node:fs';
import path from 'node:path';
import { validateSettings, type PersistedState, type ActivityEvent } from '../shared';

export class JsonStore<T> {
  private lastValidText: string | undefined;
  private queue: Promise<void> = Promise.resolve();
  readonly file: string;
  recovered = false;
  readOnlyReason: string | null = null;
  constructor(
    readonly directory: string,
    filename: string,
    private readonly validate: (value: unknown) => T,
    private readonly versionError: string
  ) {
    this.file = path.join(directory, filename);
  }
  private parse(text: string): T {
    const raw = JSON.parse(text);
    if (typeof raw?.schemaVersion === 'number' && raw.schemaVersion > 1) {
      this.readOnlyReason = this.versionError;
      throw new Error(this.readOnlyReason);
    }
    return this.validate(raw);
  }
  async load(): Promise<T | undefined> {
    let mainExists = false;
    try {
      const text = await fs.readFile(this.file, 'utf8'); mainExists = true;
      const parsed = this.parse(text); this.lastValidText = text; return parsed;
    } catch (error) {
      if (this.readOnlyReason) return undefined;
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') this.recovered = true;
    }
    try {
      const text = await fs.readFile(`${this.file}.bak`, 'utf8');
      const parsed = this.parse(text); this.lastValidText = text; this.recovered = true;
      if (mainExists) await fs.copyFile(this.file, `${this.file}.invalid-${Date.now()}`).catch(() => {});
      return parsed;
    } catch { return undefined; }
  }
  save(state: T): Promise<void> {
    const text = JSON.stringify(state, null, 2);
    const job = this.queue.catch(() => {}).then(async () => {
      if (this.readOnlyReason) throw new Error(this.readOnlyReason);
      await fs.mkdir(this.directory, { recursive: true });
      if (this.lastValidText) {
        await fs.writeFile(`${this.file}.bak.tmp`, this.lastValidText, { encoding: 'utf8', flush: true });
        await fs.rename(`${this.file}.bak.tmp`, `${this.file}.bak`);
      }
      await fs.writeFile(`${this.file}.tmp`, text, { encoding: 'utf8', flush: true });
      await fs.rename(`${this.file}.tmp`, this.file);
      this.lastValidText = text;
    });
    this.queue = job;
    return job;
  }
}

function validateTimerState(value: unknown): PersistedState {
  const raw = value as Partial<PersistedState> | null;
  if (raw?.schemaVersion !== 1 || !raw.runtime || !raw.stats || typeof raw.stats !== 'object') throw new Error('数据格式不正确');
  validateSettings(raw.settings);
  return raw as PersistedState;
}

export class Store extends JsonStore<PersistedState> {
  constructor(directory: string) {
    super(directory, 'state.json', validateTimerState, '数据来自更新版本。为保留原数据，当前版本不会覆盖设置，请升级息间。');
  }

  async appendEvents(events: ActivityEvent[]) {
    if (this.readOnlyReason || !events.length) return;
    const grouped = new Map<string, ActivityEvent[]>();
    for (const event of events) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(event.localDate)) continue;
      const group = grouped.get(event.localDate) ?? []; group.push(event); grouped.set(event.localDate, group);
    }
    const dir = path.join(this.directory, 'events');
    await fs.mkdir(dir, { recursive: true });
    for (const [day, batch] of grouped) await fs.appendFile(path.join(dir, `${day}.jsonl`), batch.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');
  }
}
