import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

type ImageItem = { name?: string; url: string };

function parseDataUrl(u: string): { mimeType: string; data: string } | null {
  const m = u.match(/^data:(.+?);base64,([A-Za-z0-9+/=]+)$/i);
  return m ? { mimeType: m[1], data: m[2] } : null;
}
function isHttp(u: string) { return /^https?:\/\//i.test(u); }
async function fetchToInline(u: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    const r = await fetch(u);
    if (!r.ok) return null;
    const ab = await r.arrayBuffer();
    const mime = r.headers.get('content-type') || 'image/jpeg';
    const data = Buffer.from(ab).toString('base64');
    return { mimeType: mime, data };
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing GEMINI_API_KEY. Set it in .env.local' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { query = '', images = [] as ImageItem[] } = await req.json().catch(() => ({ query: '', images: [] }));
    if (!query && (!images || images.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Please provide a query or at least one image.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const envModel = process.env.GEMINI_MODEL;
    const preferredVision = [
      envModel || 'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro-vision',
      'gemini-pro-vision',
    ].filter(Boolean) as string[];
    const preferredText = [
      envModel || 'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
      'gemini-pro',
    ].filter(Boolean) as string[];

    const parts: any[] = [];
    const system = 'You are a helpful retail and culinary assistant. If images are provided, describe them. For food/ingredients, infer a likely dish and provide a practical recipe: Title, Ingredients (metric + US), Steps (numbered), and Notes/Substitutions. Avoid identifying real people.';
    parts.push({ text: system });

    const prompt = (query?.trim()
      ? `User request: ${query.trim()}`
      : (images?.length ? 'Analyze the attached image(s) and provide a description and a suitable recipe.' : 'Answer the user request.')) + ' Be concise and practical.';
    parts.push({ text: prompt });

    // Convert images to inlineData for Gemini (supports data URLs and http URLs)
    const valid = Array.isArray(images) ? images : [];
    for (const img of valid) {
      if (!img?.url) continue;
      const asData = parseDataUrl(img.url);
      let inline = asData;
      if (!inline && isHttp(img.url)) inline = await fetchToInline(img.url);
      if (inline) {
        parts.push({ inlineData: { mimeType: inline.mimeType, data: inline.data } });
      }
    }

    // Helper: try a sequence of models
    const tryModels = async (models: string[]) => {
      let lastErr: any = null;
      for (const m of models) {
        try {
          const mdl = genAI.getGenerativeModel({ model: m });
          const result = await mdl.generateContent({ contents: [{ role: 'user', parts }] });
          const text = result?.response?.text()?.trim() || '';
          return { ok: true, model: m, text } as const;
        } catch (e: any) {
          const msg = String(e?.message || e);
          if (/404|not found|not\s+supported|unsupported/i.test(msg)) {
            lastErr = msg;
            continue;
          }
          return { ok: false, error: msg } as const;
        }
      }
      return { ok: false, error: lastErr || 'All candidate models failed' } as const;
    };

    // First, try preferred hard-coded list
    const wantsVision = parts.length > 2;
    const firstTry = await tryModels(wantsVision ? preferredVision : preferredText);
    if (firstTry.ok) {
      return new Response(
        JSON.stringify({ answer: firstTry.text, modelUsed: firstTry.model, usedVision: wantsVision }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If that failed, list available models from API and filter for generateContent support
    try {
      const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
      const listJson: any = await listResp.json().catch(() => ({}));
      const names: string[] = Array.isArray(listJson?.models) ? listJson.models.map((m: any) => m?.name).filter(Boolean) : [];
      // For vision we prefer models that include 1.5 and (flash|pro), otherwise vision variants; for text similar sans vision
      const filtered = names.filter(n => typeof n === 'string' && /gemini/i.test(n) && /1\.\d|pro|flash|vision/i.test(n));
      // Keep order preference by sorting with a simple heuristic
      const score = (n: string) => (
        (/(1\.5)/.test(n) ? 100 : 0) +
        (/(flash)/.test(n) ? 40 : 0) +
        (/(pro)/.test(n) ? 30 : 0) +
        (/(vision|pro-vision)/.test(n) ? 20 : 0)
      );
      const sorted = filtered.sort((a, b) => score(b) - score(a));
      const dynamicCandidates = (wantsVision
        ? sorted.filter(n => /(vision|1\.5)/.test(n))
        : sorted.filter(n => !/vision/.test(n))
      ).slice(0, 6);

      if (dynamicCandidates.length) {
        const secondTry = await tryModels(dynamicCandidates);
        if (secondTry.ok) {
          return new Response(
            JSON.stringify({ answer: secondTry.text, modelUsed: secondTry.model, usedVision: wantsVision }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ error: 'Gemini API error', details: secondTry.error || firstTry.error }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Gemini API error', details: firstTry.error || 'No models returned by list API' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: 'Gemini API error', details: firstTry.error || String(e?.message || e) }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Gemini API error', details: String(err?.message || err) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
