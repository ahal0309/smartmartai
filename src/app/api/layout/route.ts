import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { StoreLayout, IStoreLayout } from '@/models/StoreLayout';
import { DEFAULT_AISLE_X } from '@/lib/layout';

const DEFAULT_LAYOUT: Record<string, number> = DEFAULT_AISLE_X as any;

function blocksFromAisleX(aisleX: Record<string, number>) {
  return (['A','B','C','D','E','F','G','H','I','J'] as const).map((k) => ({ id: k as string, x: aisleX[k] ?? DEFAULT_LAYOUT[k], y: 240, rotation: 0 as 0|90|180|270 }));
}

export async function GET(_req: NextRequest) {
  try {
    await connectToDatabase();
  const doc = await StoreLayout.findById('default').lean<IStoreLayout | null>();
  const aisleX = (doc?.aisleX as any) || DEFAULT_LAYOUT;
  const blocks = (doc?.blocks as any) || blocksFromAisleX(aisleX);
  return NextResponse.json({ aisleX, blocks });
  } catch (err: any) {
    return NextResponse.json({ aisleX: DEFAULT_LAYOUT, error: err?.message || 'failed' }, { status: 200 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const payloadBlocks = body?.blocks as Array<{ id: string; x: number; y: number; rotation: number }> | undefined;
    const incomingAisleX = (body?.aisleX || {}) as Record<string, number>;
    const allowed = ['A','B','C','D','E','F','G','H','I','J'];
    let cleaned: Record<string, number> = {};
    for (const k of allowed) {
      const v = incomingAisleX[k] ?? DEFAULT_LAYOUT[k as keyof typeof DEFAULT_LAYOUT];
      const num = Number(v);
      cleaned[k] = Number.isFinite(num) ? Math.min(1260, Math.max(20, num)) : DEFAULT_LAYOUT[k as keyof typeof DEFAULT_LAYOUT];
    }
    let blocks = payloadBlocks?.map(b => ({
      id: String(b.id).toUpperCase(),
      x: Math.max(34, Math.min(1246, Number(b.x) || 0)),
      y: Math.max(34, Math.min(446, Number(b.y) || 0)),
      rotation: ([0,90,180,270].includes(b.rotation) ? b.rotation : 0) as 0|90|180|270,
    }));
    if (!blocks || !blocks.length) {
      blocks = blocksFromAisleX(cleaned);
    }
    const saved = await StoreLayout.findByIdAndUpdate(
      'default',
      { _id: 'default', aisleX: cleaned, blocks },
      { upsert: true, new: true }
    ).lean<IStoreLayout | null>();
    return NextResponse.json({ aisleX: (saved?.aisleX as any) || cleaned, blocks: (saved?.blocks as any) || blocks });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Save failed' }, { status: 500 });
  }
}
