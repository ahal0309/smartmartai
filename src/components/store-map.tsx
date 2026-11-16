"use client";
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { aStar } from '@/lib/pathfinding';
import { entrance, checkout, productToShelf, shelfCenters, Point, isBlocked, inBounds } from '@/lib/store-data';
import { DEFAULT_AISLE_X, pixelForShelfFromLayout, toSvgWithLayout, DEFAULT_BLOCKS, pixelForShelfFromBlocks, toSvgStatic } from '@/lib/layout';

// Fetch and use dynamic aisle layout (X-axis); Y stays fixed for now

export default function StoreMap() {
  const [aisleX, setAisleX] = useState<Record<string, number>>(DEFAULT_AISLE_X);
  const [blocks, setBlocks] = useState<any[]>(DEFAULT_BLOCKS);
  const [query, setQuery] = useState('');
  const [path, setPath] = useState<Point[] | null>(null);
  const [directions, setDirections] = useState<string>('');
  const [directionList, setDirectionList] = useState<string[]>([]);
  const [selectedShelf, setSelectedShelf] = useState<string>(''); // last clicked for details panel
  const [selectedShelves, setSelectedShelves] = useState<Set<string>>(new Set()); // multi-select set
  const [shelfProducts, setShelfProducts] = useState<string[]>([]);
  const [showProductLabels, setShowProductLabels] = useState<boolean>(true);
  const [returnToCheckout, setReturnToCheckout] = useState<boolean>(false);
  const [orderByShelf, setOrderByShelf] = useState<Record<string, number>>({});
  const targets = useMemo(() => {
    // If user has selected shelves, route to those. Otherwise, use query products mapping.
    if (selectedShelves.size > 0) {
      return Array.from(selectedShelves).map(id => ({ name: id, shelf: id }));
    }
    return query
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
      .map(name => ({ name, shelf: productToShelf[name] }))
      .filter(x => !!x.shelf) as { name: string; shelf: string }[];
  }, [query, selectedShelves]);

  function manhattan(a: Point, b: Point) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }

  // Return a walkable adjacent cell to a shelf center (since shelf center is blocked)
  function shelfAccessPoint(shelfId: string): Point {
    const c = shelfCenters[shelfId];
    if (!c) return c as any;
    const candidates: Point[] = [
      { x: c.x - 1, y: c.y }, // left aisle
      { x: c.x + 1, y: c.y }, // right aisle
      { x: c.x, y: c.y - 1 }, // above
      { x: c.x, y: c.y + 1 }, // below
    ];
    for (const p of candidates) {
      if (inBounds(p.x, p.y) && !isBlocked(p.x, p.y)) return p;
    }
    // Fallback: if all blocked (shouldn't happen), just return original (will likely fail)
    return c;
  }

  function computeOrder(points: { name: string; shelf: string }[]): { name: string; shelf: string }[] {
    if (points.length <= 1) return points;
    // Nearest neighbor from entrance
    const remaining = [...points];
    const ordered: { name: string; shelf: string }[] = [];
    let current = entrance;
    while (remaining.length) {
      remaining.sort((a,b) => manhattan(shelfAccessPoint(a.shelf), current) - manhattan(shelfAccessPoint(b.shelf), current));
      const next = remaining.shift()!;
      ordered.push(next);
      current = shelfAccessPoint(next.shelf);
    }
    // 2-opt improvement
    let improved = true;
    while (improved) {
      improved = false;
      for (let i=0;i<ordered.length-2;i++) {
        for (let j=i+2;j<ordered.length;j++) {
          const a1 = i === 0 ? entrance : shelfAccessPoint(ordered[i-1].shelf);
            const a2 = shelfAccessPoint(ordered[i].shelf);
            const b1 = shelfAccessPoint(ordered[j-1].shelf);
            const b2 = shelfAccessPoint(ordered[j].shelf);
          const currentDist = manhattan(a1,a2)+manhattan(b1,b2);
          const swappedDist = manhattan(a1,b1)+manhattan(a2,b2);
          if (swappedDist < currentDist) {
            const segment = ordered.slice(i, j).reverse();
            ordered.splice(i, segment.length, ...segment);
            improved = true;
          }
        }
      }
    }
    return ordered;
  }

  function compute() {
    if (!targets.length) { setPath(null); setDirections(''); setDirectionList([]); setSelectedShelf(''); setOrderByShelf({}); return; }
    const ordered = computeOrder(targets);
    const ordMap: Record<string, number> = {};
    ordered.forEach((t, idx) => { ordMap[t.shelf] = idx + 1; });
    setOrderByShelf(ordMap);
    let current = entrance;
    const fullPath: Point[] = [];
    const shelfSteps: string[] = [];
    for (const item of ordered) {
      const goal = shelfAccessPoint(item.shelf);
      const partial = aStar(current, goal);
      if (!partial) continue;
      if (fullPath.length) partial.shift();
      fullPath.push(...partial);
      shelfSteps.push(`Pick ${item.name} @ ${item.shelf}`);
      current = goal;
      setSelectedShelf(item.shelf);
    }
    // If return path requested, append path from last shelf back to entrance
    if (returnToCheckout && fullPath.length) {
      const last = fullPath[fullPath.length - 1];
      const back = aStar(last, checkout);
      if (back && back.length) {
        back.shift(); // remove duplicate starting point
        fullPath.push(...back);
        shelfSteps.push('Go to Checkout');
      }
    }
    setPath(fullPath);
    if (fullPath && fullPath.length) {
      // Derive cardinal directions
      const moves: string[] = [];
      for (let i=1;i<fullPath.length;i++) {
        const prev = fullPath[i-1];
        const cur = fullPath[i];
        const dx = cur.x - prev.x; const dy = cur.y - prev.y;
        let dir = '';
        if (dx === 1) dir = 'E'; else if (dx === -1) dir = 'W'; else if (dy === 1) dir = 'S'; else if (dy === -1) dir = 'N';
        moves.push(dir);
      }
      // Compress moves into run-length
      const compressed: string[] = [];
      for (let i=0;i<moves.length;i++) {
        let count = 1;
        while (i+1 < moves.length && moves[i+1] === moves[i]) { count++; i++; }
        compressed.push(`${count} ${cardinalWord(moves[i], count)}`);
      }
      const total = fullPath.length - 1;
      const arrivalShelf = shelfSteps.find(s => s.startsWith('Pick')) ? shelfSteps.filter(s=>s.startsWith('Pick')).slice(-1)[0].split('@').pop()?.trim() : '';
      const list = [
        'Start at Entrance',
        ...compressed,
        ...shelfSteps,
        returnToCheckout ? 'Arrive at Checkout' : (arrivalShelf ? `Arrive at final shelf ${arrivalShelf}` : 'Arrive at destination')
      ];
      setDirectionList(list);
      setDirections(`${total} steps (optimized route)`);
    } else {
      setDirections('');
      setDirectionList([]);
    }
  }

  function cardinalWord(code: string, count: number) {
    switch(code) {
      case 'N': return count === 1 ? 'step North' : 'steps North';
      case 'S': return count === 1 ? 'step South' : 'steps South';
      case 'E': return count === 1 ? 'step East' : 'steps East';
      case 'W': return count === 1 ? 'step West' : 'steps West';
      default: return 'step';
    }
  }

  function handleShelfClick(id: string) {
    // gather products assigned to this shelf
    const products = Object.entries(productToShelf).filter(([p, shelf]) => shelf === id).map(([p]) => p);
    setShelfProducts(products);
    setSelectedShelf(id);
    // toggle selection in multi-select set
    setSelectedShelves(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Auto compute whenever targets or return option changes
  useEffect(() => {
    // Debounce small delay to avoid rapid recompute on quick toggles
    const t = setTimeout(() => compute(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets, returnToCheckout]);

  const polylinePoints = useMemo(() => {
    if (!path) return '';
    return path.map(p => {
      const { x, y } = toSvgStatic(p);
      return `${x},${y}`;
    }).join(' ');
  }, [path]);

  useEffect(() => {
    let alive = true;
    fetch('/api/layout', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (alive) { if (d?.aisleX) setAisleX(d.aisleX); if (d?.blocks) setBlocks(d.blocks); } })
      .catch(() => {/* ignore, keep defaults */});
    return () => { alive = false; };
  }, []);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex gap-2 items-center flex-wrap">
        <input className="border rounded px-3 py-2 w-64 bg-white text-black" placeholder="Search product (e.g., milk, rice)" value={query} onChange={e => setQuery(e.target.value)} />
        <button className="px-4 py-2 bg-[#1A408D] text-white rounded" onClick={compute}>Find</button>
        {selectedShelf && <span className="text-sm text-gray-600">Target shelf: {selectedShelf}</span>}
        <label className="flex items-center gap-1 text-sm text-[#1A408D] font-medium select-none ml-2">
          <input type="checkbox" checked={showProductLabels} onChange={e => setShowProductLabels(e.target.checked)} /> Show products
        </label>
        <label className="flex items-center gap-1 text-sm text-[#1A408D] font-medium select-none ml-2">
          <input type="checkbox" checked={returnToCheckout} onChange={e => setReturnToCheckout(e.target.checked)} /> Go to Checkout after
        </label>
      </div>
      <div className="relative w-[1280px] h-[480px] border rounded shadow">
        <Image src="/store-layout.svg" alt="Store layout" fill style={{ objectFit: 'contain', pointerEvents: 'none' }} />
        {/* Path overlay */}
  <svg width={1280} height={480} viewBox="0 0 1280 480" className="absolute inset-0 z-10">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff3d00" />
            </marker>
          </defs>
          {/* Shelf labels overlay */}
          {Object.entries(shelfCenters).map(([id]) => {
            const { x, y } = pixelForShelfFromBlocks(blocks as any, id);
            const products = Object.entries(productToShelf).filter(([, shelf]) => shelf === id).map(([p]) => p);
            const primary = products[0] || '';
            const w = 68; const h = 28; // larger rect to fit icon + text
            const rx = 6; const ry = 6;
            const number = orderByShelf[id];
            const icon = getIcon(primary);
            const isSelected = selectedShelves.has(id);
            return (
              <g key={id} onClick={() => handleShelfClick(id)} className="cursor-pointer" style={{ pointerEvents: 'auto' }}>
                {/* Shelf ID above */}
                <text x={x} y={y - (h/2) - 6} fontSize={11} textAnchor="middle" fill="#0f2a6b" fontWeight={isSelected? 'bold':'normal'}>{id}</text>
                {/* Product badge rectangle */}
                <rect x={x - w/2} y={y - h/2} width={w} height={h} rx={rx} ry={ry}
                      fill={isSelected? 'rgba(26,64,141,0.18)':'#ffffff'} stroke={isSelected? '#1A408D':'#1A408D'} strokeWidth={isSelected? 2:1} />
                {showProductLabels && (
                  <g>
                    {/* Icon at left */}
                    <text x={x - w/2 + 12} y={y+6} fontSize={16} textAnchor="middle" dominantBaseline="middle">{icon}</text>
                    {/* Product name to the right */}
                    <text x={x - w/2 + 24} y={y+6} fontSize={10} textAnchor="start" dominantBaseline="middle" fill="#0f2a6b">
                      {truncateLabel(primary, 10)}
                    </text>
                  </g>
                )}
                {/* Full list tooltip on hover */}
                {products.length > 1 && <title>{products.join(', ')}</title>}
                {/* Order badge */}
                {number && (
                  <g>
                    <circle cx={x + w/2 - 8} cy={y - h/2 + 8} r={9} fill="#ff8a00" stroke="#fff" strokeWidth={1.5} />
                    <text x={x + w/2 - 8} y={y - h/2 + 11} fontSize={10} textAnchor="middle" fill="#fff" fontWeight="bold">{number}</text>
                  </g>
                )}
              </g>
            );
          })}
          {path && (
            <g>
              <polyline points={polylinePoints} fill="none" stroke="#ff3d00" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arrow)" />
              {path.map((p,i) => {
                if (i===0 || i===path.length-1) return null;
                // Place tiny directional dots; could compute orientation but keep simple
                const {x,y} = toSvgWithLayout(aisleX, p);
                return <circle key={i} cx={x} cy={y} r={2} fill="#ff3d00" />;
              })}
              {/* Entrance marker */}
              {(() => { const {x,y}=toSvgStatic(entrance); return <rect x={x-10} y={y-10} width={20} height={20} fill="#1A408D" rx={4} ry={4} />; })()}
              <text x={toSvgStatic(entrance).x} y={toSvgStatic(entrance).y+4} fontSize={10} textAnchor="middle" fill="#fff">ENT</text>
              {/* Destination (last path point) marker */}
              {(() => { if(!path.length) return null; const last=path[path.length-1]; const {x,y}=toSvgStatic(last); return <circle cx={x} cy={y} r={8} fill="#ff3d00" stroke="#fff" strokeWidth={2} />; })()}
              {/* Checkout marker */}
              {(() => { const {x,y}=toSvgStatic(checkout); return <g>
                <rect x={x-10} y={y-10} width={20} height={20} fill="#059669" rx={4} ry={4} />
                <text x={x} y={y+4} fontSize={10} textAnchor="middle" fill="#fff">CHK</text>
              </g>; })()}
              {/* Highlight actual shelf centers of targets with outline (even if blocked) */}
              {targets.map(t => {
                const {x,y}=pixelForShelfFromBlocks(blocks as any, t.shelf); return <circle key={t.shelf+"_center"} cx={x} cy={y} r={6} fill="none" stroke="#ff3d00" strokeDasharray="2 2" strokeWidth={2} />; })}
            </g>
          )}
        </svg>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
        <h3 className="text-lg font-semibold text-[#1A408D]">Directions to Product Location</h3>
        <p className="text-sm text-gray-700 mb-2 min-h-[1.5rem]">{directions || '[Directions Placeholder]'}</p>
        {directionList.length > 0 && (
          <ol className="list-decimal list-inside text-sm text-gray-800 space-y-1">
            {directionList.map((d,i) => <li key={i}>{d}</li>)}
          </ol>
        )}
        {selectedShelf && (
          <div className="mt-4 p-3 border rounded bg-white shadow-sm max-w-sm">
            <h4 className="font-semibold text-[#1A408D] mb-1">Shelf {selectedShelf} Products</h4>
            {shelfProducts.length ? (
              <ul className="list-disc list-inside text-sm">
                {shelfProducts.map(p => <li key={p}>{p}</li>)}
              </ul>
            ) : <p className="text-xs text-gray-500">No mapped products on this shelf.</p>}
          </div>
        )}
        </div>
        <div className="w-64 border rounded bg-white p-3 shadow-sm self-start">
          <h4 className="text-sm font-semibold text-[#1A408D] mb-2">Route Preview</h4>
          <svg viewBox="0 0 1280 480" className="w-full h-40 bg-[#f9fafb] rounded">
            <defs>
              <marker id="arrow-mini" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff3d00" />
              </marker>
            </defs>
            {Object.entries(shelfCenters).map(([id]) => {
              const {x,y} = pixelForShelfFromBlocks(blocks as any, id);
              const w = 26; const h = 12;
              return <rect key={id} x={x - w/2} y={y - h/2} width={w} height={h} rx={4} ry={4} fill={selectedShelf===id? '#1A408D':'#cbd5e1'} />;
            })}
            {path && (
              <polyline points={polylinePoints} fill="none" stroke="#ff3d00" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arrow-mini)" />
            )}
          </svg>
          {path && <p className="text-[11px] text-gray-600 mt-2">Stops: {directionList.filter(d=>d.startsWith('Pick ')).length} • Steps: {path.length - 1}</p>}
          <div className="mt-3 text-[12px] text-gray-700">
            <div className="font-medium mb-1">Legend</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(sampleLegend()).map(([label, icon]) => (
                <div key={label} className="flex items-center gap-1 border rounded px-1.5 py-0.5">
                  <span className="text-base leading-none">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Map product names to emoji icons (category chips)
function getIcon(name: string): string {
  const n = (name || '').toLowerCase();
  const map: Record<string, string> = {
    milk: '🥛', bread: '🥖', eggs: '🥚', cheese: '🧀',
    pasta: '🍝', rice: '🍚', chips: '🍟', sauce: '🍅',
    soap: '🧼', shampoo: '🧴', cereal: '🥣', tissue: '🧻',
    sugar: '🍬', flour: '🌾', oil: '🧴', salt: '🧂',
    tea: '🍵', coffee: '☕', biscuits: '🍪', cocoa: '🍫',
    juice: '🧃', soda: '🥤', water: '💧', sports_drink: '🥤',
    cookies: '🍪', crackers: '🍘', candy: '🍬', chocolate: '🍫',
    beans: '🫘', lentils: '🫘', oats: '🌾', nuts: '🥜',
    detergent: '🧴', bleach: '🧪', cleaner: '🧽', sponges: '🧽',
    fruits: '🍎', vegetables: '🥦', spices: '🌶️', snacks: '🍿',
  };
  return map[n] || '🛒';
}

// Provide a small legend subset
function sampleLegend(): Record<string, string> {
  return {
    Dairy: '🥛', Bakery: '🥖', Produce: '🥦', Meat: '🍖', Snacks: '🍿', Beverages: '🥤', Pantry: '🌾', Household: '🧽'
  };
}

function truncateLabel(name: string, max: number): string {
  if (!name) return '';
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}
