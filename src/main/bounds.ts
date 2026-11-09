export interface Rect { x: number; y: number; width: number; height: number }
export function visibleBounds(position: { x: number; y: number } | undefined, size: { width: number; height: number }, areas: Rect[]): Rect {
  const displays = areas.length ? areas : [{ x: 0, y: 0, width: 1280, height: 720 }];
  const valid = position && Number.isFinite(position.x) && Number.isFinite(position.y) ? position : undefined;
  const area = valid ? displays.reduce((a, b) => {
    const distance = (r: Rect) => Math.max(r.x - valid.x, 0, valid.x - r.x - r.width) ** 2 + Math.max(r.y - valid.y, 0, valid.y - r.y - r.height) ** 2;
    return distance(a) <= distance(b) ? a : b;
  }) : displays[0];
  const width = Math.min(size.width, area.width), height = Math.min(size.height, area.height);
  return {
    x: Math.round(Math.max(area.x, Math.min(valid?.x ?? area.x + area.width - width - 28, area.x + area.width - width))),
    y: Math.round(Math.max(area.y, Math.min(valid?.y ?? area.y + 70, area.y + area.height - height))), width, height
  };
}
