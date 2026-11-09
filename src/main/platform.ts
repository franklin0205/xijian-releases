import type { Snapshot } from '../shared';

// Follow ordinary Spaces without turning the app into a Dock-less UI element.
// Electron 43.3.0's NativeWindowMac::SetVisibleOnAllWorkspaces calls DockHide()
// when visibleOnFullScreen is true. Prefer a persistent Dock entry to covering
// another application's exclusive fullscreen window.
export function workspaceOptions(platform: string, view: string) {
  return platform === 'darwin' && (view === 'widget' || view === 'reminder')
    ? { visibleOnFullScreen: false } : null;
}

export function menuBarTitle(state: Pick<Snapshot, 'focus' | 'systemPaused'>) {
  const seconds = Math.max(0, Math.ceil(state.focus.remainingMs / 1000));
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return `${state.focus.status === 'running' && !state.systemPaused ? '' : 'Ⅱ '}${time}`;
}
