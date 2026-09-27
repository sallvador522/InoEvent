import React, { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { EventPass } from '../../components/passes/EventPass';
import { EVENTS } from '../../mockData';

/**
 * Página de TESTE (interna) — validar o design do passe Ouro Imperial.
 * NÃO vai para produção: sem links, sem sitemap, noindex.
 * Dados 100% mockados: evento chany-pedro + convidados fictícios.
 */
const MOCK_EVENTS = [
  { id: 'chany-pedro-wedding', label: 'Ouro Imperial' },
  { id: 'marnela-evandro-wedding', label: 'Nobreza de Luanda' },
  { id: 'wedding-essential', label: 'Clássico Romântico' },
  { id: 'wedding-ethereal', label: 'Minimalista Etéreo' },
  { id: 'wedding-garden', label: 'Jardim Elegante' },
  { id: 'wedding-royal', label: 'Luxuoso Black Tie' },
  { id: 'wedding-rustic', label: 'Rústico Chic' },
  { id: 'wedding-industrial', label: 'Industrial Urbano' },
];

const MOCK_GUESTS = [
  'Ana dos Santos',
  'José Manuel Çamba',
  'Luísa Gonçalves',
  'Domingos Kiala',
  'Esperança dos Anjos',
  'Mário Sérgio Fonseca',
];

const mockEventFallback = EVENTS.find((e) => e.id === 'chany-pedro-wedding') || EVENTS[0];

export const TestePassePage: React.FC = () => {
  const passRef = useRef<HTMLDivElement>(null);
  const [mockEventId, setMockEventId] = useState(MOCK_EVENTS[0].id);
  const [guestName, setGuestName] = useState(MOCK_GUESTS[0]);
  const [customName, setCustomName] = useState('');
  const [downloading, setDownloading] = useState(false);
  // Trava de altura: o passe tem 1350px — se o conteúdo passar, o rodapé corta.
  const [overflowPx, setOverflowPx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      const h = passRef.current?.scrollHeight || 0;
      setOverflowPx(h > 1350 ? Math.round(h - 1350) : 0);
    }, 300);
    return () => clearTimeout(t);
  }, [mockEventId, guestName, customName]);

  const mockEvent = EVENTS.find((e) => e.id === mockEventId) || mockEventFallback;

  const activeName = customName.trim() || guestName;
  const guestId = `TESTE-${activeName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase() || 'CONVIDADO'}`;

  const handleDownload = async () => {
    if (!passRef.current || downloading) return;
    setDownloading(true);
    const toastId = toast.loading('A gerar PNG do passe…');
    try {
      try {
        await (document as any).fonts?.ready;
      } catch { /* segue sem fontes */ }
      const dataUrl = await toPng(passRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.download = `Passe_${mockEvent.layoutMode}_${activeName.replace(/[^a-zA-Z0-9À-ÿ ]/g, '').trim().replace(/\s+/g, '_') || 'Convidado'}.png`;
      a.href = dataUrl;
      a.click();
      toast.success('Passe descarregado!', { id: toastId });
    } catch {
      toast.error('Falha ao gerar. Tenta de novo.', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const scale = 0.32;
  const eventData = {
    title: mockEvent.title,
    brideName: mockEvent.brideName,
    groomName: mockEvent.groomName,
    isoDate: mockEvent.isoDate,
    date: mockEvent.date,
    time: mockEvent.time,
    locationName: mockEvent.locationName,
    address: mockEvent.address,
    heroImage: mockEvent.heroImage,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-display">
      <SEO
        title="Teste de Passe (interno)"
        description="Página interna de teste — não indexar."
      />
      {/* noindex: página de teste fora de produção */}
      <meta name="robots" content="noindex,nofollow" />
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10 pt-28">
        <div className="mb-6 inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full">
          🧪 Ambiente de teste — dados fictícios, QR não faz check-in real
        </div>
        <h1 className="text-3xl font-serif font-bold mb-1">Passes elegantes</h1>
        <p className="text-slate-400 text-sm mb-6">
          Evento mock: <strong className="text-slate-200">{mockEvent.title}</strong> · troca o tema e o convidado para validar cada design.
        </p>
        <div className="flex flex-wrap gap-2 mb-8">
          {MOCK_EVENTS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMockEventId(m.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${mockEventId === m.id ? 'bg-[#dcb349] text-black' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">
          {/* Controlos */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Convidado mockado</p>
              <div className="flex flex-wrap gap-2">
                {MOCK_GUESTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => { setGuestName(n); setCustomName(''); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${!customName && guestName === n ? 'bg-[#dcb349] text-black' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Ou nome livre</p>
              <input
                type="text"
                placeholder="Ex: Maria João dos Santos"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                maxLength={60}
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-sm outline-none focus:border-[#dcb349] text-white placeholder:text-slate-500"
              />
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              Ativo: <strong className="text-slate-100">{activeName}</strong>
              <br />QR: <span className="font-mono">guest={guestId}</span>
              <br />Altura: <span className={overflowPx > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {overflowPx > 0 ? `⚠ corta ${overflowPx}px — rodapé em risco` : '✅ cabe em 1350px'}
              </span>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full bg-[#dcb349] hover:bg-[#c9a13f] disabled:opacity-60 text-black rounded-full py-3.5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Download size={16} /> {downloading ? 'A gerar…' : 'Baixar PNG do passe'}
            </button>
          </div>

          {/* Pré-visualização */}
          <div className="flex justify-center">
            <div
              style={{
                width: 1080 * scale,
                height: 1350 * scale,
                overflow: 'hidden',
                borderRadius: 24,
                boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1080 }}>
                {/* Pré-visualização (escalada) — o export usa o nó escondido em tamanho real */}
                <EventPass
                  layoutMode={mockEvent.layoutMode}
                  event={eventData}
                  guestName={activeName}
                  guestId={guestId}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Nó de export em tamanho real (fora da tela) */}
      <div style={{ position: 'fixed', left: -20000, top: 0 }} aria-hidden="true">
        <EventPass
          ref={passRef}
          layoutMode={mockEvent.layoutMode}
          event={eventData}
          guestName={activeName}
          guestId={guestId}
        />
      </div>
    </div>
  );
};
