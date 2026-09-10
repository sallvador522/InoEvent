import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase, db } from '../../components/FirebaseProvider';
import { Navbar } from '../../components/Navbar';
import { SEO } from '../../components/SEO';
import { normalizePlanId, getEventCreationLimit, getValidityDays, isBusinessPlan } from '../../config/plans';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Gift, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const WEDDING_LAYOUTS = [
  { id: 'CLASSIC', label: 'Essencial Moderno', premium: false },
  { id: 'MODERN', label: 'Cosmopolita', premium: false },
  { id: 'LUXURY', label: 'Luxo de Realeza', premium: true },
  { id: 'GARDEN', label: 'Jardim Encantado', premium: true },
  { id: 'RUSTIC', label: 'Rústico Natural', premium: true },
  { id: 'INDUSTRIAL', label: 'Industrial Loft', premium: true },
  { id: 'LIMINTSO_GOLD', label: 'Ouro Imperial', premium: true },
  { id: 'LIMINTSO_ME', label: 'Nobreza de Luanda', premium: true },
];

const MUSIC_OPTIONS = [
  { id: 'romantic', label: 'Piano Romântico' },
  { id: 'orchestra', label: 'Melodia Real' },
  { id: 'acoustic', label: 'Violão Acústico' },
  { id: 'none', label: 'Sem música' },
];

const BANKS = ['BAI', 'BFA', 'BIC', 'SOL', 'BPC', 'Outro'];
const GIFT_EMOJIS = ['🎁', '💍', '🍯', '🏝️', '🍳', '🏠', '🚗', '💝'];

interface GiftItem {
  id: string;
  title: string;
  price: string;
  emoji: string;
}

const STEPS = ['O casal', 'Quando e onde', 'História e foto', 'Presentes', 'Tema'];

const inputCls =
  'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-[#C5A028] focus:ring-2 focus:ring-[#C5A028]/20 font-light';
const labelCls =
  'block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5';

const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > height && width > MAX) {
          height *= MAX / width;
          width = MAX;
        } else if (height >= width && height > MAX) {
          width *= MAX / height;
          height = MAX;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

export const WeddingQuestionnaire: React.FC = () => {
  const { user, userProfile } = useFirebase();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [eventId, setEventId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [receptionName, setReceptionName] = useState('');
  const [receptionAddress, setReceptionAddress] = useState('');
  const [description, setDescription] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [musicTrack, setMusicTrack] = useState('romantic');
  const [dressCode, setDressCode] = useState('');
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [newGift, setNewGift] = useState({ title: '', price: '', emoji: '🎁' });
  const [bankName, setBankName] = useState('BAI');
  const [iban, setIban] = useState('');
  const [accountName, setAccountName] = useState('');
  const [layout, setLayout] = useState('CLASSIC');

  useEffect(() => {
    if (brideName && groomName && !titleTouched) {
      setTitle(`${brideName} & ${groomName}`);
    }
  }, [brideName, groomName, titleTouched]);

  const canUsePremium = normalizePlanId(userProfile?.plan) !== 'essential';

  const saveDraft = async (extra: Record<string, any> = {}) => {
    if (!user) {
      toast.error('Entre na sua conta para continuar.');
      navigate('/auth');
      return null;
    }
    setSaving(true);
    try {
      const id = eventId || 'evt_' + Math.random().toString(36).substring(2, 11);
      const payload: Record<string, any> = {
        id,
        ownerId: user.uid,
        type: 'WEDDING',
        status: 'draft',
        title,
        brideName,
        groomName,
        date,
        time,
        locationName,
        address,
        mapLink,
        receptionName,
        receptionAddress,
        description,
        heroImage,
        musicTrack,
        dressCode: { title: 'Dress Code', description: dressCode },
        bankName,
        iban,
        accountName,
        layoutMode: layout,
        updatedAt: new Date().toISOString(),
        ...extra,
      };
      if (gifts.length > 0) {
        payload.gifts = gifts.map((g) => ({
          id: g.id,
          title: g.title,
          price: Number(g.price) || 0,
          emoji: g.emoji,
          type: 'IBAN',
          bankName,
          accountName,
          value: iban,
        }));
      }
      await setDoc(doc(db, 'events', id), payload, { merge: true });
      setEventId(id);
      return id;
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível guardar. Tente de novo.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    if (step === 0 && (!brideName.trim() || !groomName.trim())) {
      toast.error('Diga-nos o nome da noiva e do noivo.');
      return;
    }
    if (step === 1 && (!date || !locationName.trim())) {
      toast.error('A data e o local são obrigatórios.');
      return;
    }
    const id = await saveDraft();
    if (id) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const publish = async () => {
    if (!user) return;
    if (!brideName.trim() || !groomName.trim() || !date || !locationName.trim()) {
      toast.error('Complete o casal, a data e o local antes de publicar.');
      return;
    }
    setSaving(true);
    try {
      const plan = normalizePlanId(userProfile?.plan || 'essential');
      if (!eventId && !isBusinessPlan(plan)) {
        const snap = await getDocs(
          query(collection(db, 'events'), where('ownerId', '==', user.uid))
        );
        const paidCount = snap.docs.filter(
          (d) => d.data().type !== 'BABY_SHOWER' && d.data().type !== 'BRIDAL_SHOWER'
        ).length;
        if (paidCount >= getEventCreationLimit(plan)) {
          toast.error(`Você atingiu o limite de convites do seu plano. Faça upgrade para criar mais!`);
          setSaving(false);
          return;
        }
      }
      const days = getValidityDays(plan);
      const expiresAt =
        days === null ? null : new Date(Date.now() + days * 86400000).toISOString();
      const id = await saveDraft({
        status: 'active',
        billingStatus: 'pending',
        plan,
        planId: plan,
        expiresAt,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      if (!id) return;
      toast.success('Convite publicado!');
      navigate(`/dashboard/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const addGift = () => {
    if (!newGift.title.trim() || !newGift.price) {
      toast.error('Dê um nome e um valor ao presente.');
      return;
    }
    setGifts((g) => [
      ...g,
      { id: Math.random().toString(36).substring(2, 9), ...newGift },
    ]);
    setNewGift({ title: '', price: '', emoji: '🎁' });
  };

  const pickLayout = (layoutId: string, premium: boolean) => {
    if (premium && !canUsePremium) {
      toast.error('Este tema é Premium. Faça upgrade para o usar.');
      return;
    }
    setLayout(layoutId);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-display">
      <SEO
        title="Criar convite de casamento"
        description="Responda ao questionário e crie o convite digital do seu casamento em minutos."
      />
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-28 md:pt-32 pb-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 text-center">
          Passo {step + 1} de {STEPS.length} · {STEPS[step]}
        </p>
        <div className="h-px bg-slate-200 mt-4 mb-10 relative">
          <div
            className="absolute left-0 top-0 h-px bg-[#C5A028]"
            style={{
              width: `${((step + 1) / STEPS.length) * 100}%`,
              transition: 'width 300ms ease',
            }}
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {step === 0 && (
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1B365D] tracking-tight mb-2">
                  Quem casa?
                </h1>
                <p className="text-slate-500 font-light mb-8">
                  Os nomes aparecem no topo do convite, em todos os temas.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelCls} htmlFor="wq-bride">Nome da noiva *</label>
                    <input id="wq-bride" className={inputCls} value={brideName} onChange={(e) => setBrideName(e.target.value)} placeholder="Ex: Ana Clara" autoComplete="off" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="wq-groom">Nome do noivo *</label>
                    <input id="wq-groom" className={inputCls} value={groomName} onChange={(e) => setGroomName(e.target.value)} placeholder="Ex: João Pedro" autoComplete="off" />
                  </div>
                </div>
                <div>
                  <label className={labelCls} htmlFor="wq-title">Título do convite</label>
                  <input id="wq-title" className={inputCls} value={title} onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }} placeholder="Ana Clara & João Pedro" autoComplete="off" />
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1B365D] tracking-tight mb-2">
                  Quando e onde?
                </h1>
                <p className="text-slate-500 font-light mb-8">
                  Data e local alimentam o countdown, o mapa e todos os temas.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelCls} htmlFor="wq-date">Data *</label>
                    <input id="wq-date" type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="wq-time">Hora</label>
                    <input id="wq-time" type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className={labelCls} htmlFor="wq-loc">Local da cerimónia *</label>
                  <input id="wq-loc" className={inputCls} value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Ex: Igreja da Sagrada Família" autoComplete="off" />
                </div>
                <div className="mb-4">
                  <label className={labelCls} htmlFor="wq-addr">Endereço</label>
                  <input id="wq-addr" className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex: Maianga, Luanda" autoComplete="off" />
                </div>
                <div className="mb-4">
                  <label className={labelCls} htmlFor="wq-map">Link do mapa</label>
                  <input id="wq-map" className={inputCls} value={mapLink} onChange={(e) => setMapLink(e.target.value)} placeholder="Link do Google Maps (opcional)" inputMode="url" autoComplete="off" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} htmlFor="wq-rec">Receção (nome)</label>
                    <input id="wq-rec" className={inputCls} value={receptionName} onChange={(e) => setReceptionName(e.target.value)} placeholder="Ex: Salão Pérola" autoComplete="off" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="wq-recaddr">Receção (endereço)</label>
                    <input id="wq-recaddr" className={inputCls} value={receptionAddress} onChange={(e) => setReceptionAddress(e.target.value)} placeholder="Ex: Talatona" autoComplete="off" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1B365D] tracking-tight mb-2">
                  A vossa história
                </h1>
                <p className="text-slate-500 font-light mb-8">
                  Uma foto, um texto e a música — o coração do convite.
                </p>
                <div className="mb-4">
                  <label className={labelCls} htmlFor="wq-desc">Mensagem de boas-vindas</label>
                  <textarea id="wq-desc" className={`${inputCls} min-h-[120px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contem aos convidados o que este dia significa…" />
                </div>
                <div className="mb-4">
                  <span className={labelCls}>Foto principal</span>
                  <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4">
                    {heroImage ? (
                      <img src={heroImage} alt="Foto do casal" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px] text-center px-1">
                        Sem foto
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl font-bold bg-[#1B365D] text-white hover:bg-[#224373] text-xs cursor-pointer"
                      style={{ transition: 'background-color 200ms ease' }}
                    >
                      Escolher foto
                    </button>
                    <input
                      type="file"
                      ref={fileRef}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setHeroImage(await compressImage(file));
                          toast.success('Foto pronta!');
                        } catch {
                          toast.error('Não foi possível ler a foto.');
                        }
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} htmlFor="wq-music">Música de fundo</label>
                    <select id="wq-music" className={inputCls} value={musicTrack} onChange={(e) => setMusicTrack(e.target.value)}>
                      {MUSIC_OPTIONS.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="wq-dress">Dress code</label>
                    <input id="wq-dress" className={inputCls} value={dressCode} onChange={(e) => setDressCode(e.target.value)} placeholder="Ex: Traje formal, tons claros" autoComplete="off" />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1B365D] tracking-tight mb-2">
                  Presentes
                </h1>
                <p className="text-slate-500 font-light mb-8">
                  Cotas em Kwanza + o vosso IBAN. Os convidados transferem e o painel regista.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className={labelCls} htmlFor="wq-bank">Banco</label>
                    <select id="wq-bank" className={inputCls} value={bankName} onChange={(e) => setBankName(e.target.value)}>
                      {BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls} htmlFor="wq-holder">Titular da conta</label>
                    <input id="wq-holder" className={inputCls} value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Ex: Ana Clara dos Santos" autoComplete="off" />
                  </div>
                </div>
                <div className="mb-6">
                  <label className={labelCls} htmlFor="wq-iban">IBAN</label>
                  <input id="wq-iban" className={`${inputCls} font-mono`} value={iban} onChange={(e) => setIban(e.target.value)} placeholder="AO06…" inputMode="numeric" autoComplete="off" />
                </div>
                <span className={labelCls}>Cotas de presente</span>
                <div className="flex gap-2 mb-3">
                  <select
                    aria-label="Emoji do presente"
                    className="bg-white border border-slate-200 rounded-xl px-2 text-xl"
                    value={newGift.emoji}
                    onChange={(e) => setNewGift({ ...newGift, emoji: e.target.value })}
                  >
                    {GIFT_EMOJIS.map((em) => (
                      <option key={em} value={em}>{em}</option>
                    ))}
                  </select>
                  <input
                    className={`${inputCls} flex-1`}
                    value={newGift.title}
                    onChange={(e) => setNewGift({ ...newGift, title: e.target.value })}
                    placeholder="Ex: Lua de mel"
                    aria-label="Nome do presente"
                  />
                  <input
                    type="number"
                    className={`${inputCls} w-28`}
                    value={newGift.price}
                    onChange={(e) => setNewGift({ ...newGift, price: e.target.value })}
                    placeholder="Kz"
                    aria-label="Valor em Kwanzas"
                  />
                  <button
                    type="button"
                    onClick={addGift}
                    aria-label="Adicionar presente"
                    className="w-12 h-12 shrink-0 rounded-xl bg-[#1B365D] text-white flex items-center justify-center hover:bg-[#224373] cursor-pointer"
                    style={{ transition: 'background-color 200ms ease' }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {gifts.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {gifts.map((g) => (
                      <li key={g.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                        <span className="text-2xl">{g.emoji}</span>
                        <span className="flex-1 font-bold text-sm text-slate-800">{g.title}</span>
                        <span className="text-sm text-[#1B365D] font-bold">{Number(g.price).toLocaleString('pt-AO')} Kz</span>
                        <button
                          type="button"
                          onClick={() => setGifts((list) => list.filter((x) => x.id !== g.id))}
                          aria-label={`Remover ${g.title}`}
                          className="text-slate-300 hover:text-red-500 cursor-pointer p-1"
                          style={{ transition: 'color 200ms ease' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1B365D] tracking-tight mb-2">
                  Escolha o tema
                </h1>
                <p className="text-slate-500 font-light mb-8">
                  Os vossos dados vestem qualquer um — trocam de tema quando quiserem, sem preencher de novo.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {WEDDING_LAYOUTS.map((l) => {
                    const locked = l.premium && !canUsePremium;
                    const active = layout === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => pickLayout(l.id, l.premium)}
                        aria-pressed={active}
                        className={`flex items-center justify-between gap-3 p-4 rounded-2xl border text-left cursor-pointer bg-white ${
                          active ? 'border-[#C5A028]' : 'border-slate-200 hover:border-[#C5A028]/60'
                        }`}
                        style={{ transition: 'border-color 200ms ease' }}
                      >
                        <span>
                          <span className="block font-bold text-slate-900 text-sm">{l.label}</span>
                          <span className="block text-xs text-slate-500 font-light mt-0.5">
                            {l.premium ? 'Tema Premium' : 'Incluído no Essencial'}
                          </span>
                        </span>
                        {locked ? (
                          <Lock size={18} className="text-slate-300 shrink-0" />
                        ) : (
                          active && <Check size={18} className="text-[#8a6d1c] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {!canUsePremium && (
                  <p className="text-xs text-slate-500 font-light mt-4">
                    Temas Premium desbloqueiam com o plano Premium ou superior.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3 mt-10">
          <button
            type="button"
            onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))}
            className="min-h-[48px] inline-flex items-center gap-2 px-5 rounded-full font-bold text-slate-500 hover:text-slate-800 text-xs uppercase tracking-wider cursor-pointer"
            style={{ transition: 'color 200ms ease' }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={saving}
              className="min-h-[48px] inline-flex items-center gap-2 px-7 rounded-full font-bold bg-[#1B365D] text-white hover:bg-[#224373] disabled:opacity-60 text-xs uppercase tracking-wider cursor-pointer"
              style={{ transition: 'background-color 200ms ease' }}
            >
              {saving ? 'A guardar…' : 'Continuar'} <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={publish}
              disabled={saving}
              className="min-h-[48px] inline-flex items-center gap-2 px-7 rounded-full font-bold bg-[#C5A028] text-[#1B365D] hover:bg-[#d4af37] disabled:opacity-60 text-xs uppercase tracking-wider cursor-pointer"
              style={{ transition: 'background-color 200ms ease' }}
            >
              {saving ? 'A publicar…' : 'Publicar convite'} <Check size={16} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
