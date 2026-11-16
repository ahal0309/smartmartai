// Grid definition (20 cols x 12 rows); entrance at (1,11)
export type Point = { x: number; y: number };

export const GRID_COLS = 20;
export const GRID_ROWS = 12;

// Shelves occupy columns: A: x=4..5, B: x=9..10, C: x=14..15; rows 2..9
// We'll use center points for waypoints near each shelf bay
export const shelfCenters: Record<string, Point> = {
  // Align aisles to odd grid columns for clear walkways between aisles
  // A..E at x: 1,3,5,7,9
  A1: { x: 1, y: 3 }, A2: { x: 1, y: 5 }, A3: { x: 1, y: 7 }, A4: { x: 1, y: 9 },
  B1: { x: 3, y: 3 }, B2: { x: 3, y: 5 }, B3: { x: 3, y: 7 }, B4: { x: 3, y: 9 },
  C1: { x: 5, y: 3 }, C2: { x: 5, y: 5 }, C3: { x: 5, y: 7 }, C4: { x: 5, y: 9 },
  D1: { x: 7, y: 3 }, D2: { x: 7, y: 5 }, D3: { x: 7, y: 7 }, D4: { x: 7, y: 9 },
  E1: { x: 9, y: 3 }, E2: { x: 9, y: 5 }, E3: { x: 9, y: 7 }, E4: { x: 9, y: 9 },
  // F..J at x: 11,13,15,17,19
  F1: { x: 11, y: 3 }, F2: { x: 11, y: 5 }, F3: { x: 11, y: 7 }, F4: { x: 11, y: 9 },
  G1: { x: 13, y: 3 }, G2: { x: 13, y: 5 }, G3: { x: 13, y: 7 }, G4: { x: 13, y: 9 },
  H1: { x: 15, y: 3 }, H2: { x: 15, y: 5 }, H3: { x: 15, y: 7 }, H4: { x: 15, y: 9 },
  I1: { x: 17, y: 3 }, I2: { x: 17, y: 5 }, I3: { x: 17, y: 7 }, I4: { x: 17, y: 9 },
  J1: { x: 19, y: 3 }, J2: { x: 19, y: 5 }, J3: { x: 19, y: 7 }, J4: { x: 19, y: 9 },
};

// Products to shelf mapping (sample)
export const productToShelf: Record<string, string> = {
  milk: 'A2',
  bread: 'A1',
  eggs: 'A3',
  rice: 'B2',
  pasta: 'B1',
  chips: 'B3',
  shampoo: 'C2',
  soap: 'C1',
  cereal: 'C3',
  // D aisle
  sugar: 'D1',
  flour: 'D2',
  oil: 'D3',
  // E aisle
  tea: 'E1',
  coffee: 'E2',
  biscuits: 'E3',
  cocoa: 'E4',
  // F aisle
  juice: 'F1',
  soda: 'F2',
  water: 'F3',
  sports_drink: 'F4',
  // G aisle
  cookies: 'G1',
  crackers: 'G2',
  candy: 'G3',
  chocolate: 'G4',
  // H aisle
  beans: 'H1',
  lentils: 'H2',
  oats: 'H3',
  nuts: 'H4',
  // I aisle
  detergent: 'I1',
  bleach: 'I2',
  cleaner: 'I3',
  sponges: 'I4',
  // Extra for A..D position 4
  cheese: 'A4',
  sauce: 'B4',
  tissue: 'C4',
  salt: 'D4',
  // J aisle
  fruits: 'J1',
  vegetables: 'J2',
  spices: 'J3',
  snacks: 'J4',
};

export const entrance: Point = { x: 1, y: 11 };

// Checkout point on the walkway (bottom-right). Must be walkable (not inside shelf columns 4..5, 9..10, 14..15 for rows 2..9)
export const checkout: Point = { x: 18, y: 11 };

// Obstacles represent shelf cells (unwalkable). We'll block columns 4..5, 9..10, 14..15, rows 2..9
export function isBlocked(x: number, y: number): boolean {
  // Block shelf columns (odd columns) for rows 2..9 to prevent path through aisles A..J
  const inRows = y >= 2 && y <= 9;
  const shelfCols = new Set([1,3,5,7,9,11,13,15,17,19]);
  return inRows && shelfCols.has(x);
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
}
