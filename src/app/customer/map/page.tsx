"use client";
import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

type MapItem = {
  id: string;
  name: string;
  emoji: string;
  x: number; // svg coords
  y: number; // svg coords
};

export default function CustomerMapPage() {
  const items = useMemo<MapItem[]>(() => [
    { id: 'A1', name: 'Apples', emoji: '🍎', x: 120, y: 120 },
    { id: 'A2', name: 'Bananas', emoji: '🍌', x: 120, y: 200 },
    { id: 'B1', name: 'Bread', emoji: '🍞', x: 260, y: 140 },
    { id: 'B2', name: 'Milk', emoji: '🥛', x: 260, y: 220 },
    { id: 'C1', name: 'Eggs', emoji: '🥚', x: 400, y: 140 },
    { id: 'C2', name: 'Cheese', emoji: '🧀', x: 400, y: 220 },
    { id: 'D1', name: 'Tomatoes', emoji: '🍅', x: 540, y: 140 },
    { id: 'D2', name: 'Lettuce', emoji: '🥬', x: 540, y: 220 },
    { id: 'E1', name: 'Chicken', emoji: '🍗', x: 680, y: 140 },
    { id: 'E2', name: 'Fish', emoji: '🐟', x: 680, y: 220 },
  ], []);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <DashboardLayout role="customer" title="Map & Waypoints">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 p-4 bg-white rounded-2xl shadow border">
          <h2 className="text-lg font-semibold text-[#0f2a6b] mb-3">Tap items on the map to select</h2>
          <div className="w-full overflow-auto">
            <svg viewBox="0 0 800 400" className="w-full h-auto border rounded-lg bg-[#f8fafc]">
              {/* Store boundary */}
              <rect x="10" y="10" width="780" height="380" rx="8" fill="#ffffff" stroke="#CBD5E1" />
              {/* Aisles */}
              {Array.from({length:5}).map((_,i)=>{
                const x = 80 + i*140;
                return (
                  <g key={i}>
                    <rect x={x} y={70} width={100} height={260} rx={6} fill="#e2e8f0" />
                    <text x={x+50} y={60} textAnchor="middle" fontSize="14" fill="#475569">{String.fromCharCode(65+i)}</text>
                  </g>
                );
              })}

              {/* Icons (items) */}
              {items.map((it) => {
                const isSel = selected.has(it.id);
                return (
                  <g key={it.id} onClick={() => toggle(it.id)} role="button" tabIndex={0}
                     aria-label={`${it.name}${isSel? ' selected':''}`}
                     style={{ cursor: 'pointer' }}>
                    <circle cx={it.x} cy={it.y} r={18} fill={isSel ? '#1A408D' : '#0ea5e9'} stroke="#0f172a" strokeWidth={isSel?2:1} />
                    <text x={it.x} y={it.y+6} fontSize="16" textAnchor="middle">{it.emoji}</text>
                    <text x={it.x} y={it.y+32} fontSize="11" textAnchor="middle" fill="#0f172a">{it.name}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        <aside className="p-4 bg-white rounded-2xl shadow border">
          <h3 className="text-lg font-semibold text-[#0f2a6b] mb-2">Selected Items ({selected.size})</h3>
          {selected.size === 0 ? (
            <p className="text-sm text-slate-600">Click on icons in the map to add items.</p>
          ) : (
            <ul className="space-y-2">
              {items.filter(i => selected.has(i.id)).map(i => (
                <li key={i.id} className="flex items-center justify-between bg-slate-50 rounded px-2 py-1">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{i.emoji}</span>
                    <span className="text-sm text-slate-800">{i.name}</span>
                  </span>
                  <button className="text-xs text-red-600" onClick={()=>toggle(i.id)}>remove</button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </DashboardLayout>
  );
}
