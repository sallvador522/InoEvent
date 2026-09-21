import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase, db } from '../../components/FirebaseProvider';
import { Navbar } from '../../components/Navbar';
import { SEO } from '../../components/SEO';
import { normalizePlanId, getEventCreationLimit, getValidityDays, isBusinessPlan } from '../../config/plans';
import { uploadEventAudio, deleteEventAudio, isOwnStorageAudio, formatAudioSize, MAX_AUDIO_BYTES } from '../../lib/audioUpload';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { LocationPinPicker } from '../../components/LocationPinPicker';
import { MapsProvider } from '../../components/MapsProvider';
import type { TimelineItem } from '../../types';
import { layoutSupports, hiddenSectionsFor, SECTION_LABELS } from './lib/layoutSchemas';
import { IMAGE_ACCEPT, validateImageFile } from '../../lib/imageValidation';
import { migrateCoverToStorage } from '../../lib/imageStorage';

// Todos os temas livres para escolher — o pagamento acontece na ativação (planos)
const WEDDING_LAYOUTS = [
  { id: 'CLASSIC', label: 'Essencial Moderno', premium: false },
  { id: 'MODERN', label: 'Cosmopolita', premium: false },
  { id: 'LUXURY', label: 'Luxo de Realeza', premium: false },
  { id: 'GARDEN', label: 'Jardim Encantado', premium: false },
  { id: 'RUSTIC', label: 'Rústico Natural', premium: false },
  { id: 'INDUSTRIAL', label: 'Industrial Loft', premium: false },
  { id: 'LIMINTSO_GOLD', label: 'Ouro Imperial', premium: false },
  { id: 'LIMINTSO_ME', label: 'Nobreza de Luanda', premium: false },
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

const STEP_DEFS = [
  { id: 'couple', label: 'O casal' },
  { id: 'when', label: 'Quando e onde' },
  { id: 'story', label: 'História e foto' },
  { id: 'timeline', label: 'Programação' },
  { id: 'gifts', label: 'Presentes' },
  { id: 'theme', label: 'Tema' },
] as const;

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
  const [saving, setSaving] = useState(false);  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [brideParents, setBrideParents] = useState('');
  const [groomParents, setGroomParents] = useState('');
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationName, setLocationName] = useState('');
  // Legado: mantidos no payload para eventos antigos; o editor usa só zona + pino.
  const [address] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [formattedAddress, setFormattedAddress] = useState<string | null>(null);
  const [plusCode, setPlusCode] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [userRatingsTotal, setUserRatingsTotal] = useState<number | null>(null);
  const [mapsUrl, setMapsUrl] = useState<string | null>(null);
  const [placePhotoUrl, setPlacePhotoUrl] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<'google' | 'osm' | 'gps' | 'link' | 'mapa' | null>(null);
  const [receptionName, setReceptionName] = useState('');
  const [receptionAddress, setReceptionAddress] = useState('');
  const [description, setDescription] = useState('');
  const [heroImage, setHeroImage] = useState('');
  // Última capa gravada (para limpar o ficheiro antigo do Storage ao substituir)
  const lastCoverRef = useRef<string>('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [musicTrack, setMusicTrack] = useState('romantic');
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const musicRef = useRef<HTMLInputElement>(null);
  const [dressCode, setDressCode] = useState('');
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [newGift, setNewGift] = useState({ title: '', price: '', emoji: '🎁' });
  const [bankName, setBankName] = useState('BAI');
  const [iban, setIban] = useState('');
  const [accountName, setAccountName] = useState('');
  // Template primeiro: ?template= vindo da galeria (validado); o passo Tema continua editável
  const [searchParams] = useSearchParams();
  const [layout, setLayout] = useState(() => {
    const t = searchParams.get('template');
    return WEDDING_LAYOUTS.some((l) => l.id === t) ? (t as string) : 'CLASSIC';
  });
  // Veio da galeria com tema válido → passo Tema mostra confirmação em vez da grelha
  const cameWithTemplate = useRef(
    WEDDING_LAYOUTS.some((l) => l.id === searchParams.get('template')),
  ).current;
  const [showThemeGrid, setShowThemeGrid] = useState(false);
  const chosenLayout = WEDDING_LAYOUTS.find((l) => l.id === layout);
  // Programação — mesmos defaults do template CLASSIC (mockData), editável; vazio esconde a secção no convite
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    { time: '18:00', title: 'Cerimônia', description: 'Jardim' },
    { time: '20:00', title: 'Recepção', description: 'Salão Principal' },
  ]);
  const [newTime, setNewTime] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  // Só conta como "preenchido" o que o utilizador tocou (defaults do template não disparam avisos)
  const [timelineTouched, setTimelineTouched] = useState(false);

  // Passos visíveis conforme o contrato do tema escolhido (nunca se pede o que não aparece)
  const visibleSteps = STEP_DEFS.filter((s) => s.id !== 'timeline' || layoutSupports(layout, 'timeline'));
  const currentStepId = visibleSteps[Math.min(step, visibleSteps.length - 1)]?.id;

  useEffect(() => {
    if (step >= visibleSteps.length) setStep(visibleSteps.length - 1);
  }, [visibleSteps.length, step]);

  useEffect(() => {
    if (brideName && groomName && !titleTouched) {
      setTitle(`${brideName} & ${groomName}`);
    }
  }, [brideName, groomName, titleTouched]);

  const saveDraft = async (extra: Record<string, any> = {}) => {
    if (!user) {
      toast.error('Entre na sua conta para continuar.');
      navigate('/auth');
      return null;
    }
    // Guarda honesta: fotos em base64 contam para o limite de 1MB do documento.
    // Barramos antes de tentar gravar para o passo não parecer "preso".
    const approxBytes =
      (heroImage.length + gallery.reduce((acc, g) => acc + g.length, 0)) * 0.75;
    if (approxBytes > 800000) {
      toast.error('As fotos estão pesadas demais. Remova algumas fotos da galeria e tente de novo.');
      return null;
    }
    setSaving(true);
    try {
      const id = eventId || 'evt_' + Math.random().toString(36).substring(2, 11);
      const plan = normalizePlanId(userProfile?.plan || 'essential');
      // isoDate canónico para countdown em todos os temas (date vem do input YYYY-MM-DD)
      let isoDate = '';
      if (date) {
        const d = new Date(`${date}T${time || '12:00'}:00`);
        if (!isNaN(d.getTime())) isoDate = d.toISOString();
      }
      const payload: Record<string, any> = {
        id,
        ownerId: user.uid,
        type: 'WEDDING',
        status: 'draft',
        plan,
        planId: plan,
        title,
        brideName,
        groomName,
        brideParents,
        groomParents,
        date,
        isoDate,
        time,
        locationName,
        address,
        mapLink,
        latitude,
        longitude,
        placeId,
        formattedAddress,
        plusCode,
        rating,
        userRatingsTotal,
        mapsUrl: mapsUrl || mapLink || null,
        placePhotoUrl,
        locationSource,
        locationUpdatedAt: latitude !== null && longitude !== null ? new Date().toISOString() : null,
        receptionName,
        receptionAddress,
        description,
        heroImage,
        gallery,
        musicTrack,
        dressCode: { title: 'Dress Code', description: dressCode },
        timeline: timeline.map((t) => ({ time: t.time, title: t.title, description: t.description || '' })),
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
      // Capa → Firebase Storage (URL pública p/ preview do link; base64 parte o OG e o doc 1MB)
      const cover = await migrateCoverToStorage(
        payload.heroImage,
        user.uid,
        id,
        lastCoverRef.current || undefined,
      );
      payload.heroImage = cover.url;
      if (cover.migrated) {
        setHeroImage(cover.url);
        lastCoverRef.current = cover.url;
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
    // Validação por passo (id, não índice — a lista muda com o tema escolhido)
    if (currentStepId === 'couple' && (!brideName.trim() || !groomName.trim())) {
      toast.error('Diga-nos o nome da noiva e do noivo.');
      return;
    }
    if (currentStepId === 'when' && (!date || !locationName.trim())) {
      toast.error('A data e o local são obrigatórios.');
      return;
    }
    if (currentStepId === 'story') {
      if (!description.trim()) {
        toast.error('Escreva a mensagem de boas-vindas (a vossa história).');
        return;
      }
      if (!heroImage) {
        toast.error('Escolha a foto principal do casal.');
        return;
      }
      if (!musicTrack) {
        toast.error('Escolha a música de fundo (ou “Sem música”).');
        return;
      }
    }
    if (currentStepId === 'gifts') {
      if (!bankName.trim() || !accountName.trim() || !iban.trim()) {
        toast.error('Preencha o banco, o titular e o IBAN para os presentes. Pode editar depois no painel.');
        return;
      }
    }
    const id = await saveDraft();
    if (id) setStep((s) => Math.min(s + 1, visibleSteps.length - 1));
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
        let paidCount = 0;
        try {
          const snap = await getDocs(
            query(collection(db, 'events'), where('ownerId', '==', user.uid))
          );
          paidCount = snap.docs.filter(
            (d) => d.data().type !== 'BABY_SHOWER' && d.data().type !== 'BRIDAL_SHOWER'
          ).length;
        } catch (e) {
          console.error(e);
          toast.error('Sem ligação para verificar o seu plano. Verifique a internet e tente de novo.');
          setSaving(false);
          return;
        }
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
        isPublished: false,
        billingStatus: 'pending',
        plan,
        planId: plan,
        expiresAt,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      if (!id) return;
      toast.success('Convite pronto! Escolhe o plano para partilhar.');
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

  const pickLayout = (layoutId: string) => {
    // Todos os temas livres — trocar preserva os dados; avisa o que fica escondido (schema, sem apagar nada)
    const hidden = hiddenSectionsFor(layout, layoutId).filter((s) =>
      s === 'timeline' ? timelineTouched && timeline.length > 0 : s === 'gallery' ? gallery.length > 0 : false,
    );
    setLayout(layoutId);
    if (hidden.length > 0) {
      toast(`Este tema não mostra ${hidden.map((s) => SECTION_LABELS[s]).join(' e ')} — fica guardado se voltares atrás.`, { icon: '👁' });
    }
  };

  return (
    <MapsProvider>
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-display">
      <SEO
        title="Criar convite de casamento"
        description="Responda ao questionário e crie o convite digital do seu casamento em minutos."
      />
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-28 md:pt-32 pb-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 text-center">
          Passo {step + 1} de {visibleSteps.length} · {visibleSteps[Math.min(step, visibleSteps.length - 1)]?.label}
        </p>
        <div className="h-px bg-slate-200 mt-4 mb-10 relative">
          <div
            className="absolute left-0 top-0 h-px bg-[#C5A028]"
            style={{
              width: `${((step + 1) / visibleSteps.length) * 100}%`,
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
            {currentStepId === 'couple' && (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={labelCls} htmlFor="wq-bridepar">Pais da noiva</label>
                    <input id="wq-bridepar" className={inputCls} value={brideParents} onChange={(e) => setBrideParents(e.target.value)} placeholder="Ex: Maria e José" autoComplete="off" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="wq-groompar">Pais do noivo</label>
                    <input id="wq-groompar" className={inputCls} value={groomParents} onChange={(e) => setGroomParents(e.target.value)} placeholder="Ex: Ana e Carlos" autoComplete="off" />
                  </div>
                </div>
              </div>
            )}

            {currentStepId === 'when' && (
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
                  <span className={labelCls}>Local do evento *</span>
                  <LocationPinPicker
                    latitude={latitude}
                    longitude={longitude}
                    mapLink={mapLink}
                    zone={locationName}
                    placeName={locationName}
                    formattedAddress={formattedAddress}
                    plusCode={plusCode}
                    rating={rating}
                    userRatingsTotal={userRatingsTotal}
                    placeId={placeId}
                    mapsUrl={mapsUrl}
                    locationSource={locationSource}
                    onZoneSuggest={(name) => setLocationName(name)}
                    onChange={(pin) => {
                      const derivedName = (pin.name || pin.formattedAddress || '').trim();
                      if (derivedName) setLocationName(derivedName);
                      setLatitude(pin.latitude);
                      setLongitude(pin.longitude);
                      setMapLink(pin.mapLink);
                      setPlaceId(pin.placeId || null);
                      setFormattedAddress(pin.formattedAddress || null);
                      setPlusCode(pin.plusCode || null);
                      setRating(typeof pin.rating === 'number' ? pin.rating : null);
                      setUserRatingsTotal(typeof pin.userRatingsTotal === 'number' ? pin.userRatingsTotal : null);
                      setMapsUrl(pin.mapsUrl || pin.mapLink || null);
                      setPlacePhotoUrl(pin.placePhotoUrl || null);
                      setLocationSource(pin.locationSource || null);
                      toast.success('Pino fixado no mapa!');
                    }}
                    onClear={() => {
                      setLatitude(null);
                      setLongitude(null);
                      setMapLink('');
                      setPlaceId(null);
                      setFormattedAddress(null);
                      setPlusCode(null);
                      setRating(null);
                      setUserRatingsTotal(null);
                      setMapsUrl(null);
                      setPlacePhotoUrl(null);
                      setLocationSource(null);
                    }}
                  />
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

            {currentStepId === 'story' && (
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1B365D] tracking-tight mb-2">
                  A vossa história
                </h1>
                <p className="text-slate-500 font-light mb-8">
                  Uma foto, um texto e a música — o coração do convite.
                </p>
                <div className="mb-4">
                  <label className={labelCls} htmlFor="wq-desc">Mensagem de boas-vindas *</label>
                  <textarea id="wq-desc" className={`${inputCls} min-h-[120px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contem aos convidados o que este dia significa…" />
                </div>
                <div className="mb-4">
                  <span className={labelCls}>Foto principal *</span>
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
                        const validation = validateImageFile(file);
                        if (!validation.ok) {
                          toast.error(validation.error);
                          e.target.value = '';
                          return;
                        }
                        try {
                          setHeroImage(await compressImage(file));
                          toast.success('Foto pronta!');
                        } catch {
                          toast.error('Não foi possível ler a foto.');
                        }
                      }}
                      accept={IMAGE_ACCEPT}
                      className="hidden"
                    />
                  </div>
                </div>
                {layoutSupports(layout, 'gallery') && (
                <div className="mb-4">
                  <span className={labelCls}>Galeria (até 6 fotos)</span>
                  <div className="grid grid-cols-3 gap-2">
                    {gallery.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                        <img src={src} alt={`Foto ${i + 1} do casal`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setGallery((g) => g.filter((_, gi) => gi !== i))}
                          aria-label={`Remover foto ${i + 1}`}
                          className="absolute top-1 right-1 w-8 h-8 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-red-500 cursor-pointer"
                          style={{ transition: 'background-color 200ms ease' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {gallery.length < 6 && (
                      <button
                        type="button"
                        onClick={() => galleryRef.current?.click()}
                        className="aspect-square rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-[#1B365D] hover:border-[#C5A028] cursor-pointer"
                        style={{ transition: 'color 200ms ease, border-color 200ms ease' }}
                      >
                        <Plus size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Foto</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={galleryRef}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []).slice(0, 6 - gallery.length);
                      if (files.length === 0) return;
                      for (const f of files) {
                        const validation = validateImageFile(f);
                        if (!validation.ok) {
                          toast.error(validation.error);
                          e.target.value = '';
                          return;
                        }
                      }
                      try {
                        const imgs = await Promise.all(files.map((f) => compressImage(f)));
                        setGallery((g) => [...g, ...imgs].slice(0, 6));
                        toast.success('Fotos prontas!');
                      } catch {
                        toast.error('Não foi possível ler as fotos.');
                      }
                      e.target.value = '';
                    }}
                    accept={IMAGE_ACCEPT}
                    multiple
                    className="hidden"
                  />
                </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} htmlFor="wq-music">Música de fundo *</label>
                    <select id="wq-music" className={inputCls} value={isOwnStorageAudio(musicTrack) ? 'custom' : musicTrack} onChange={(e) => { if (e.target.value !== 'custom') setMusicTrack(e.target.value); }}>
                      {MUSIC_OPTIONS.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                      {isOwnStorageAudio(musicTrack) && (
                        <option value="custom">O meu mp3 (enviado)</option>
                      )}
                    </select>
                  </div>
                  {layoutSupports(layout, 'dressCode') && (
                  <div>
                    <label className={labelCls} htmlFor="wq-dress">Dress code</label>
                    <input id="wq-dress" className={inputCls} value={dressCode} onChange={(e) => setDressCode(e.target.value)} placeholder="Ex: Traje formal, tons claros" autoComplete="off" />
                  </div>
                  )}
                </div>
                <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4">
                  <span className={labelCls}>Ou enviem a vossa música (mp3, até {formatAudioSize(MAX_AUDIO_BYTES)})</span>
                  {isOwnStorageAudio(musicTrack) ? (
                    <div className="flex items-center gap-3">
                      <audio src={musicTrack} controls preload="metadata" className="flex-1 h-10 min-w-0" />
                      <button
                        type="button"
                        onClick={async () => {
                          const old = musicTrack;
                          setMusicTrack('romantic');
                          await saveDraft({ musicTrack: 'romantic' });
                          await deleteEventAudio(old);
                        }}
                        className="shrink-0 text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider cursor-pointer px-2 min-h-[44px]"
                        style={{ transition: 'color 200ms ease' }}
                      >
                        Tirar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingMusic}
                      onClick={() => musicRef.current?.click()}
                      className="w-full min-h-[48px] rounded-xl border border-dashed border-slate-300 font-bold text-xs uppercase tracking-wider text-slate-500 hover:text-[#1B365D] hover:border-[#C5A028] disabled:opacity-60 cursor-pointer"
                      style={{ transition: 'color 200ms ease, border-color 200ms ease' }}
                    >
                      {uploadingMusic ? 'A enviar música…' : 'Escolher mp3 do dispositivo'}
                    </button>
                  )}
                  <input
                    type="file"
                    ref={musicRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file || !user) return;
                      setUploadingMusic(true);
                      try {
                        const old = musicTrack;
                        const url = await uploadEventAudio(file, user.uid);
                        setMusicTrack(url);
                        await saveDraft({ musicTrack: url });
                        await deleteEventAudio(isOwnStorageAudio(old) ? old : null);
                        toast.success('Música pronta — toca ao abrir o convite!');
                      } catch (err: any) {
                        toast.error(err?.message || 'Não foi possível enviar a música.');
                      } finally {
                        setUploadingMusic(false);
                      }
                    }}
                    accept="audio/mpeg,audio/mp3,audio/*"
                    className="hidden"
                  />
                  <p className="text-[11px] text-slate-400 font-light mt-2">Toca automaticamente ao abrir o convite.</p>
                </div>
              </div>
            )}

            {currentStepId === 'timeline' && (
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1B365D] tracking-tight mb-2">
                  Programação
                </h1>
                <p className="text-slate-500 font-light mb-8">
                  Momentos do grande dia, por ordem. Aparecem no convite como no modelo.
                </p>
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
                  <span className={labelCls}>Adicionar momento</span>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      className={inputCls}
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      placeholder="Ex: 18:00"
                      aria-label="Hora do momento"
                    />
                    <input
                      className={`${inputCls} col-span-2`}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ex: Cerimônia"
                      aria-label="Título do momento"
                    />
                  </div>
                  <input
                    className={inputCls}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Ex: Jardim (opcional)"
                    aria-label="Descrição do momento"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newTime.trim() || !newTitle.trim()) {
                        toast.error('Diga a hora e o título do momento.');
                        return;
                      }
                      setTimeline((list) => [...list, { time: newTime.trim(), title: newTitle.trim(), description: newDesc.trim() }]);
                      setTimelineTouched(true);
                      setNewTime('');
                      setNewTitle('');
                      setNewDesc('');
                      toast.success('Atividade incluída no cronograma!');
                    }}
                    className="w-full min-h-[48px] rounded-xl font-bold bg-[#1B365D] text-white hover:bg-[#224373] text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                    style={{ transition: 'background-color 200ms ease' }}
                  >
                    <Plus size={16} /> Adicionar momento
                  </button>
                </div>
                {timeline.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-6">Sem programação — a secção fica escondida no convite.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {timeline.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                        <span className="font-mono text-xs font-bold text-[#1B365D] bg-slate-100 px-2 py-0.5 rounded shrink-0">{item.time}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold text-sm text-slate-800">{item.title}</span>
                          {item.description ? (
                            <span className="block text-xs text-slate-500 font-light">{item.description}</span>
                          ) : null}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setTimeline((list) => list.filter((_, i) => i !== idx)); setTimelineTouched(true); }}
                          aria-label={`Remover ${item.title}`}
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

            {currentStepId === 'gifts' && (
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1B365D] tracking-tight mb-2">
                  Presentes
                </h1>
                <p className="text-slate-500 font-light mb-8">
                  Cotas em Kwanza + o vosso IBAN. Os convidados transferem e o painel regista.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className={labelCls} htmlFor="wq-bank">Banco *</label>
                    <select id="wq-bank" className={inputCls} value={bankName} onChange={(e) => setBankName(e.target.value)}>
                      {BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls} htmlFor="wq-holder">Titular da conta *</label>
                    <input id="wq-holder" className={inputCls} value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Ex: Ana Clara dos Santos" autoComplete="off" />
                  </div>
                </div>
                <div className="mb-6">
                  <label className={labelCls} htmlFor="wq-iban">IBAN *</label>
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

            {currentStepId === 'theme' && (
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1B365D] tracking-tight mb-2">
                  {cameWithTemplate && !showThemeGrid ? 'Confirme o tema' : 'Escolha o tema'}
                </h1>
                <p className="text-slate-500 font-light mb-8">
                  {cameWithTemplate && !showThemeGrid
                    ? 'Os vossos dados vestem este tema — publiquem assim ou troquem se quiserem.'
                    : 'Os vossos dados vestem qualquer um — trocam de tema quando quiserem, sem preencher de novo.'}
                </p>
                {cameWithTemplate && !showThemeGrid ? (
                  <div className="bg-white border-2 border-[#C5A028] rounded-2xl p-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Tema escolhido</p>
                        <p className="font-serif text-2xl font-bold text-[#1B365D]">{chosenLayout?.label || layout}</p>
                      </div>
                      <Check size={22} className="text-[#8a6d1c] shrink-0" />
                    </div>
                    <div className="border-t border-slate-100 pt-4 space-y-1.5 text-sm">
                      <p className="text-slate-700">
                        <span className="font-bold">Noivos:</span>{' '}
                        {[brideName.trim(), groomName.trim()].filter(Boolean).join(' & ') || '—'}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-bold">Data:</span>{' '}
                        {date ? `${date}${time ? ` · ${time}` : ''}` : '—'}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-bold">Local:</span> {locationName.trim() || '—'}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-bold">Foto principal:</span> {heroImage ? 'escolhida ✓' : 'em falta'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowThemeGrid(true)}
                      className="mt-5 w-full min-h-[48px] rounded-xl border-2 border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-600 hover:border-[#C5A028] hover:text-[#1B365D] cursor-pointer"
                      style={{ transition: 'border-color 200ms ease, color 200ms ease' }}
                    >
                      Trocar de tema
                    </button>
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {WEDDING_LAYOUTS.map((l) => {
                    const active = layout === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => pickLayout(l.id)}
                        aria-pressed={active}
                        className={`flex items-center justify-between gap-3 p-4 rounded-2xl border text-left cursor-pointer bg-white ${
                          active ? 'border-[#C5A028]' : 'border-slate-200 hover:border-[#C5A028]/60'
                        }`}
                        style={{ transition: 'border-color 200ms ease' }}
                      >
                        <span>
                          <span className="block font-bold text-slate-900 text-sm">{l.label}</span>
                          {hiddenSectionsFor('CLASSIC', l.id).length > 0 && (
                            <span className="block text-[11px] text-amber-600 font-medium mt-0.5">
                              Sem {hiddenSectionsFor('CLASSIC', l.id).map((s) => SECTION_LABELS[s]).join(', ')}
                            </span>
                          )}
                        </span>
                        {active && <Check size={18} className="text-[#8a6d1c] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
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
          {step < visibleSteps.length - 1 ? (
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
    </MapsProvider>
  );
};
