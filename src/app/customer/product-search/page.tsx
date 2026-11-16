"use client";
import { useRef, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function CustomerProductSearchPage() {
  // Assistant search state
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantImages, setAssistantImages] = useState<{ name: string; url: string }[]>([]);
  const [assistantAnswer, setAssistantAnswer] = useState<string>('');
  const [assistantError, setAssistantError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Assistant: open file picker
  function openFilePicker() {
    try { fileRef.current?.click(); } catch {}
  }

  // Assistant: handle selected images (stored as data URLs for preview/API)
  function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const readers = files.map(f => new Promise<{name:string; url:string}>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve({ name: f.name, url: String(r.result) });
      r.readAsDataURL(f);
    }));
    Promise.all(readers).then(items => setAssistantImages(prev => [...prev, ...items]));
    // reset value so same file can be selected again
    e.target.value = '';
  }

  function removeAttachment(name: string) {
    setAssistantImages(prev => prev.filter(x => x.name !== name));
  }

  async function askAssistant() {
    if (!assistantQuery && assistantImages.length === 0) return;
    setAssistantError('');
    setAssistantAnswer('');
    setLoading(true);
    try {
      const resp = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: assistantQuery, images: assistantImages }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        const details = typeof data?.details === 'string' ? `\nDetails: ${data.details}` : '';
        setAssistantError((data?.error || 'Assistant request failed') + details);
      } else {
        setAssistantAnswer(data?.answer || '');
        setAssistantQuery('');
      }
    } catch (e: any) {
      setAssistantError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }
  return (
    <DashboardLayout role="customer" title="Product Search">
      <section className="p-6 bg-white rounded-2xl shadow-lg border border-[#EAF2FB]">
        <h3 className="text-2xl font-bold text-[#1A408D] mb-4">Product Search</h3>
        <div className="flex items-center mb-4 bg-[#EAF2FB] rounded-full px-4 py-2 shadow">
          <input type="text" placeholder="Search for products..." className="flex-1 bg-transparent border-none outline-none text-[#1A408D] placeholder-[#1A408D]" />
          <button className="ml-2 text-[#1A408D]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </button>
        </div>
        <div className="text-gray-700 text-sm mb-2">Recent searches: [Placeholder]</div>
      </section>

      {/* Assistant Search Bar */}
      <section className="mt-6 p-6 bg-white rounded-2xl shadow-lg border border-[#EAF2FB]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[#0f2a6b]">Assistant Search</h3>
        </div>
  <p className="text-xs text-gray-500 mb-2">Tip: Images you upload are analyzed directly (data URLs or public links are supported).</p>
        <div className="relative flex items-center gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#1A408D]"
            placeholder="Ask the assistant about products (e.g., 'find gluten‑free snacks')"
            value={assistantQuery}
            onChange={e=>setAssistantQuery(e.target.value)}
          />
          {/* Plus icon button to attach images */}
          <button
            type="button"
            aria-label="Add images"
            className="w-10 h-10 rounded bg-[#1A408D] text-white flex items-center justify-center"
            onClick={openFilePicker}
            title="Attach images"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          <button className="px-4 py-2 bg-[#059669] text-white rounded disabled:opacity-60" onClick={askAssistant} disabled={loading}>
            {loading ? 'Asking…' : 'Ask'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFilesSelected} />
        </div>
        {assistantImages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {assistantImages.map(img => (
              <div key={img.name} className="relative w-20 h-20 rounded overflow-hidden border">
                <img src={img.url} alt={img.name} className="object-cover w-full h-full" />
                <button
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs"
                  onClick={()=>removeAttachment(img.name)}
                  title="Remove"
                >×</button>
              </div>
            ))}
          </div>
        )}
        {assistantError && (
          <div className="mt-3 text-sm text-red-600">{assistantError}</div>
        )}
        {assistantAnswer && (
          <div className="mt-4 p-3 border rounded bg-gray-50 whitespace-pre-wrap text-sm text-gray-800">{assistantAnswer}</div>
        )}
      </section>
    </DashboardLayout>
  );
}