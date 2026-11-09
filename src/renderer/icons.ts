const paths: Record<string, string> = {
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
export function icon(name: string, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.clock}</svg>`;
}
