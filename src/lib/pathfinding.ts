import { GRID_COLS, GRID_ROWS, inBounds, isBlocked, Point } from './store-data';

type Node = Point & { g: number; h: number; f: number; parent?: Node };

function heuristic(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function aStar(start: Point, goal: Point): Point[] | null {
  const open: Node[] = [{ x: start.x, y: start.y, g: 0, h: heuristic(start, goal), f: 0 }];
  open[0].f = open[0].g + open[0].h;
  const closed = new Set<string>();

  function key(p: Point) { return `${p.x},${p.y}`; }

  while (open.length) {
    // get node with lowest f
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    if (current.x === goal.x && current.y === goal.y) {
      const path: Point[] = [];
      let n: Node | undefined = current;
      while (n) { path.push({ x: n.x, y: n.y }); n = n.parent; }
      return path.reverse();
    }
    closed.add(key(current));

    const dirs = [ [1,0], [-1,0], [0,1], [0,-1] ];
    for (const [dx, dy] of dirs) {
      const nx = current.x + dx, ny = current.y + dy;
      if (!inBounds(nx, ny) || isBlocked(nx, ny)) continue;
      const k = `${nx},${ny}`;
      if (closed.has(k)) continue;

      const g = current.g + 1;
      const h = heuristic({ x: nx, y: ny }, goal);
      const f = g + h;
      const existing = open.find(n => n.x === nx && n.y === ny);
      if (!existing || g < existing.g) {
        const node: Node = { x: nx, y: ny, g, h, f, parent: current };
        if (!existing) open.push(node); else Object.assign(existing, node);
      }
    }
  }
  return null;
}
