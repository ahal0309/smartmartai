import { Point } from './store-data';

export type AisleKey = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J';

export const DEFAULT_AISLE_X: Record<AisleKey, number> = {
  A: 80,  B: 200, C: 320, D: 440, E: 560,
  F: 680, G: 800, H: 920, I: 1040, J: 1160,
};

// Fixed Y centers for shelf rows 1..4 (kept static for now)
export const SHELF_Y_CENTERS: Record<'1'|'2'|'3'|'4', number> = {
  '1': 120, '2': 200, '3': 280, '4': 360,
};

export function pixelForShelfFromLayout(aisleX: Record<string, number>, id: string) {
  const m = id.match(/^([A-J])([1-4])$/);
  if (!m) return { x: 0, y: 0 };
  const letter = m[1] as AisleKey;
  const level = m[2] as '1'|'2'|'3'|'4';
  const x = (aisleX?.[letter] ?? DEFAULT_AISLE_X[letter]);
  const y = SHELF_Y_CENTERS[level];
  return { x, y };
}

// --- Free-placement blocks layout ---
export type LayoutBlock = { id: AisleKey; x: number; y: number; rotation: 0|90|180|270 };

export const DEFAULT_BLOCKS: LayoutBlock[] = (['A','B','C','D','E','F','G','H','I','J'] as AisleKey[]).map((k, i) => ({
  id: k,
  x: DEFAULT_AISLE_X[k],
  y: 240,
  rotation: 0,
}));

const SHELF_OFFSETS: Record<'1'|'2'|'3'|'4', { x: number; y: number }> = {
  '1': { x: 0, y: -120 },
  '2': { x: 0, y: -40 },
  '3': { x: 0, y: 40 },
  '4': { x: 0, y: 120 },
};

export function rotatePoint(px: number, py: number, angle: 0|90|180|270) {
  switch (angle) {
    case 0: return { x: px, y: py };
    case 90: return { x: -py, y: px };
    case 180: return { x: -px, y: -py };
    case 270: return { x: py, y: -px };
  }
}

export function pixelForShelfFromBlocks(blocks: LayoutBlock[] | undefined, id: string) {
  const m = id.match(/^([A-J])([1-4])$/);
  if (!m) return { x: 0, y: 0 };
  const letter = m[1] as AisleKey;
  const level = m[2] as '1'|'2'|'3'|'4';
  const block = (blocks || DEFAULT_BLOCKS).find(b => b.id === letter) || DEFAULT_BLOCKS.find(b => b.id === letter)!;
  const base = SHELF_OFFSETS[level];
  const r = rotatePoint(base.x, base.y, block.rotation);
  return { x: block.x + r.x, y: block.y + r.y };
}

// Compute pixel X for a grid column using the layout.
// Odd grid columns (1,3,...,19) align to aisle centers left->right.
// Even grid columns (0,2,...,18) are walkway centers: midpoints between adjacent aisle centers;
// edges are offset by half of the nearest spacing.
export function gridToPixelXFromLayout(aisleX: Record<string, number>, col: number) {
  const keys: AisleKey[] = ['A','B','C','D','E','F','G','H','I','J'];
  const xs = keys.map(k => aisleX?.[k] ?? DEFAULT_AISLE_X[k]);
  if (col % 2 === 1) {
    const k = (col - 1) / 2;
    return xs[Math.max(0, Math.min(xs.length - 1, k))];
  }
  const k = col / 2; // walkway index 0..9
  if (k === 0) return xs[0] - (xs[1] - xs[0]) / 2;
  if (k === xs.length) return xs[xs.length - 1] + (xs[xs.length - 1] - xs[xs.length - 2]) / 2;
  return (xs[k - 1] + xs[k]) / 2;
}

export function toSvgWithLayout(aisleX: Record<string, number>, point: Point) {
  const x = gridToPixelXFromLayout(aisleX, point.x);
  const y = point.y * 40 + 20; // keep Y static for now
  return { x, y };
}

// Static mapping used as fallback for route polyline; does not reflect free-placement yet.
export function toSvgStatic(point: Point) {
  const col = point.x;
  const k = Math.floor(col / 2);
  const x = (col % 2 === 1) ? (80 + k * 120) : (20 + k * 120);
  const y = point.y * 40 + 20;
  return { x, y };
}
