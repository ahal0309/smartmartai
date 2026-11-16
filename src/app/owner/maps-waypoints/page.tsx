"use client";
import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { DEFAULT_BLOCKS, LayoutBlock, rotatePoint } from '@/lib/layout';

type AisleKey = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J';
const AISLES: AisleKey[] = ['A','B','C','D','E','F','G','H','I','J'];

export default function OwnerMapsWaypointsPage() {
  const [blocks, setBlocks] = useState<LayoutBlock[]>(DEFAULT_BLOCKS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('');
  const dragging = useRef<{ id: AisleKey; startX: number; startY: number; origX: number; origY: number }|null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch('/api/layout', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (alive && d?.blocks) setBlocks(d.blocks); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  function onMouseDown(e: React.MouseEvent, id: AisleKey) {
    e.preventDefault();
    const b = blocks.find(x => x.id === id)!;
    dragging.current = { id, startX: e.clientX, startY: e.clientY, origX: b.x, origY: b.y };
    window.addEventListener('mousemove', onMouseMove as any);
    window.addEventListener('mouseup', onMouseUp as any, { once: true });
  }
  function onMouseMove(e: MouseEvent) {
    const d = dragging.current; if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const nx = Math.max(34, Math.min(1246, d.origX + dx));
    const ny = Math.max(34, Math.min(446, d.origY + dy));
    setBlocks(prev => prev.map(b => b.id === d.id ? { ...b, x: nx, y: ny } : b));
  }
  function onMouseUp() {
    window.removeEventListener('mousemove', onMouseMove as any);
    dragging.current = null;
  }

  function rotate(id: AisleKey) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, rotation: ((b.rotation + 90) % 360) as 0|90|180|270 } : b));
  }

  async function onSave() {
    try {
      setSaving(true); setStatus('');
      const res = await fetch('/api/layout', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setBlocks(data.blocks);
      setStatus('Saved');
    } catch (e: any) {
      setStatus(`Save failed: ${e?.message || e}`);
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(''), 2500);
    }
  }
  function onReset() { setBlocks(DEFAULT_BLOCKS); }
  function onExport() {
    const blob = new Blob([JSON.stringify({ blocks }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'store-layout.json'; a.click(); URL.revokeObjectURL(url);
  }

  const BOX = { w: 68, h: 28 };
  const OFFSETS = [ {x:0,y:-120}, {x:0,y:-40}, {x:0,y:40}, {x:0,y:120} ];

  function rectFor(offset: {x:number;y:number}, rotation: 0|90|180|270) {
    const p = rotatePoint(offset.x, offset.y, rotation);
    // For 90/270, swap width/height; we still center at rotated point
    const rot = rotation % 180 === 0 ? { w: BOX.w, h: BOX.h } : { w: BOX.h, h: BOX.w };
    return { x: p.x - rot.w/2, y: p.y - rot.h/2, w: rot.w, h: rot.h };
  }

  return (
    <DashboardLayout role="owner" title="Maps & Waypoints Editor">
      <div className="flex items-center gap-2 mb-2">
        <button className="px-4 py-2 bg-[#1A408D] text-white rounded disabled:opacity-60" disabled={saving} onClick={onSave}>Save</button>
        <button className="px-3 py-2 bg-white border rounded" onClick={onReset}>Reset to Default</button>
        <button className="px-3 py-2 bg-white border rounded" onClick={onExport}>Export JSON</button>
        {status && <span className="text-sm text-gray-600 ml-2">{status}</span>}
        {loading && <span className="text-sm text-gray-500 ml-2">Loading…</span>}
      </div>
      <div className="relative w-[1280px] h-[480px] border rounded bg-white shadow overflow-hidden select-none">
        <img src="/store-layout.svg" alt="layout" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        <svg width={1280} height={480} viewBox="0 0 1280 480" className="absolute inset-0">
          {blocks.map((b) => (
            <g key={b.id} transform={`translate(${b.x} ${b.y})`}>
              {/* Drag area */}
              <rect x={-40} y={-160} width={80} height={320} fill="#1A408D" opacity={0.06} className="cursor-move" onMouseDown={(e) => onMouseDown(e, b.id as AisleKey)} />
              {/* Label badge */}
              <circle cx={0} cy={-180} r={14} fill="#1A408D" />
              <text x={0} y={-176} textAnchor="middle" fontSize={12} fill="#fff" fontWeight="bold">{b.id}</text>
              {/* Rotate button */}
              <g onClick={() => rotate(b.id as AisleKey)} className="cursor-pointer">
                <rect x={-14} y={170} width={28} height={22} rx={6} fill="#1A408D" />
                <text x={0} y={186} textAnchor="middle" fontSize={12} fill="#fff" fontWeight="bold">⟳</text>
              </g>
              {/* Shelves */}
              {OFFSETS.map((o, i) => {
                const r = rectFor(o, b.rotation);
                return <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={6} ry={6} fill="#fff" stroke="#1A408D" strokeWidth={1} />
              })}
            </g>
          ))}
        </svg>
      </div>
      <p className="text-sm text-gray-600 mt-2">Drag whole aisle blocks anywhere and rotate them. Save to apply. Note: customer routing still follows the original grid; dynamic routing is a forthcoming enhancement.</p>
    </DashboardLayout>
  );
}
