import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFirebase, db } from '../../components/FirebaseProvider';
import { getGuestLimit, normalizePlanId, getPlanConfig, canUseFeature, getEventCreationLimit, isBusinessPlan } from '../../lib/entitlements';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { 
  Sparkles, Plus, Trash, Music, Calendar, MapPin, Clock, 
  User,  Gift, Save, FileText, ChevronRight, 
  Heart, ArrowLeft, AlignLeft, Eye, Layout, Sliders, Globe,
  Gem, X, Check
} from 'lucide-react';
import { LayoutMode } from '../../types';
import { PlacePicker } from '../../components/PlacePicker';
import { GOOGLE_MAPS_API_KEY } from '../../lib/maps';
import { TravelMap } from './TravelMap';

interface TimelineItem {
  time: string;
  title: string;
  description: string;
}

interface GiftItem {
  type: 'IBAN' | 'LINK' | 'BANK';
  title: string;
  value: string;
  description?: string;
  bankName?: string;
  accountName?: string;
}

export const EventCreator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryObj = new URLSearchParams(location.search);
  const initialTemplate = queryObj.get('template');
  const eventIdParam = queryObj.get('eventId');
  
  const { user, userProfile } = useFirebase();
  const isEditingExisting = !!eventIdParam;

  // Determine if it is a bridal shower
  const isBridalShower = location.pathname.includes('bridal') || 
                         (initialTemplate && initialTemplate.startsWith('BRIDAL_'));

  // Determine if it is a baby shower
  const isBabyShower = location.pathname.includes('baby') || 
                       (initialTemplate && initialTemplate.startsWith('BABY_'));

  const [activeTab, setActiveTab] = useState<'content' | 'timeline' | 'gifts' | 'design'>('content');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [attemptedPremiumLayout, setAttemptedPremiumLayout] = useState<string>('');

  // Event State Variables
  const [selectedLayout, setSelectedLayout] = useState<LayoutMode>(
    (initialTemplate as LayoutMode) || (isBabyShower ? 'BABY_NEUTRAL' : isBridalShower ? 'BRIDAL_ROMANTIC' : 'CLASSIC' as any)
  );
  const [title, setTitle] = useState(isBabyShower ? 'Chá de Bebé do Noah' : isBridalShower ? 'Chá de Panela da Sarah' : 'João & Maria');
  const [date, setDate] = useState(() => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    return futureDate.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('17:00');
  const [brideName, setBrideName] = useState(isBabyShower ? 'Noah' : isBridalShower ? 'Sarah' : 'Maria');
  const [groomName, setGroomName] = useState('João');
  const [description, setDescription] = useState(
    isBabyShower
      ? 'Estamos à espera do nosso pacotinho de amor! Venha celebrar connosco o Chá de Bebé e partilhar esta alegria única.'
      : isBridalShower 
        ? 'Um dia muito especial para celebrar o amor e equipar o nosso novo lar com as amigas mais queridas!' 
        : 'Estamos muito entusiasmados e ansiosos para celebrar este momento perfeito com vocês!'
  );
  const [locationName, setLocationName] = useState('Salão Luanda Noblesse');
  const [address, setAddress] = useState('Av. Pedro de Castro Van-Dúnem Loy, Luanda');
  const [mapLink, setMapLink] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [musicTrack, setMusicTrack] = useState('romantic');
  const [dressCodeTitle, setDressCodeTitle] = useState('Dress Code');
  const [dressCodeDesc, setDressCodeDesc] = useState('Esporte Fino - Sugerimos tons pastéis suaves.');
  const [heroImage, setHeroImage] = useState<string>('');
  const [editableContent, setEditableContent] = useState<Record<string, string>>({});
  const [mapImage, setMapImage] = useState<string>('');
  
  // Dynamic arrays
  const [timeline, setTimeline] = useState<TimelineItem[]>(
    isBabyShower ? [
      { time: '15:00', title: 'Boas-vindas', description: 'Recepção dos convidados e início do buffet de doces.' },
      { time: '16:30', title: 'Adivinhas & Jogos', description: 'Brincadeiras divertidas sobre fraldas e bebés.' },
      { time: '18:00', title: 'Fotos & Bolo', description: 'Corte do bolo, registo de memórias e brinde especial.' }
    ] : isBridalShower ? [
      { time: '17:00', title: 'Boas-vindas', description: 'Recepção das amigas mais queridas e doces de boas-vindas.' },
      { time: '18:30', title: 'Jogos & Brincadeiras', description: 'Divertir e adivinhar os presentes com prendas engraçadas.' },
      { time: '20:00', title: 'Abertura de Mimos & Bolo', description: 'Momento de fotos, brinde de felicidade e corte do bolo.' }
    ] : [
      { time: '16:00', title: 'Cerimônia Religiosa', description: 'Troca de votos solenes, alianças e bênção dos noivos.' },
      { time: '18:00', title: 'Coquetel de Recepção', description: 'Sessão fotográfica, música ambiente e entradinhas gourmet.' },
      { time: '20:00', title: 'Jantar & Baile', description: 'Discursos de brinde, corte de bolo de casamento e pista livre.' }
    ]
  );

  const [gifts, setGifts] = useState<GiftItem[]>([
    { 
      type: 'IBAN', 
      title: 'Contribuição para a Lua de Mel', 
      value: 'AO06 0040 0000 1234 5678 1012 3', 
      description: 'Ajude-nos a realizar a viagem dos nossos sonhos para Benguela!',
      bankName: 'BAI',
      accountName: 'Sarah & João'
    },
    { 
      type: 'IBAN', 
      title: 'Jogo de Louça Fina', 
      value: 'AO06 0040 0000 9876 5432 1012 3', 
      description: 'Cota simbólica para compor a nossa cozinha de família.',
      bankName: 'BFA',
      accountName: 'Lareira de Sarah'
    }
  ]);

  // Timeline item fields temp
  const [newTime, setNewTime] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Gift item fields temp
  const [newGiftTitle, setNewGiftTitle] = useState('');
  const [newGiftValue, setNewGiftValue] = useState('');
  const [newGiftDesc, setNewGiftDesc] = useState('');
  const [newGiftType, setNewGiftType] = useState<'IBAN' | 'LINK' | 'BANK'>('IBAN');
  const [newGiftBank, setNewGiftBank] = useState('BAI');
  const [newGiftAccount, setNewGiftAccount] = useState('');

  // Hero default images mapping based on Layout style selected
  const getHeroImageUrl = (style: LayoutMode) => {
    switch (style) {
      case 'CLASSIC':
        return 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop';
      case 'MODERN':
        return 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop';
      case 'LUXURY':
        return 'https://images.unsplash.com/photo-1507504038482-7621c518d50d?q=80&w=1200&auto=format&fit=crop';
      case 'LIMINTSO_GOLD':
        return '/casalModel.webp';
      case 'LIMINTSO_ME':
        return 'https://in.limintso.com/wp-content/uploads/2025/08/cav33.jpg';
      case 'GARDEN':
        return 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200&auto=format&fit=crop';
      case 'RUSTIC':
        return 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=1200&auto=format&fit=crop';
      case 'INDUSTRIAL':
        return 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1200&auto=format&fit=crop';
      case 'BRIDAL_ROMANTIC':
        return 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1200&auto=format&fit=crop';
      case 'BRIDAL_MINIMAL':
        return 'https://images.unsplash.com/photo-1481653191744-97edb833d5b4?q=80&w=1200&auto=format&fit=crop';
      case 'BRIDAL_CHEF':
        return 'https://images.unsplash.com/photo-1524824267900-2fa9cbf7a506?q=80&w=1200&auto=format&fit=crop';
      case 'BABY_BOY':
        return 'https://images.unsplash.com/photo-1519689680058-324335c77eb2?q=80&w=1200&auto=format&fit=crop';
      case 'BABY_GIRL':
        return 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=1200&auto=format&fit=crop';
      case 'BABY_NEUTRAL':
        return 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop';
      default:
        return 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop';
    }
  };

  const handleLayoutSelect = (layoutId: LayoutMode) => {
    setSelectedLayout(layoutId);
    const defaults = [
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507504038482-7621c518d50d?q=80&w=1200&auto=format&fit=crop',
      '/casalModel.webp',
      'https://in.limintso.com/wp-content/uploads/2025/08/cav33.jpg',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1481653191744-97edb833d5b4?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524824267900-2fa9cbf7a506?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519689680058-324335c77eb2?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop'
    ];
    if (!heroImage || defaults.includes(heroImage)) {
      setHeroImage(getHeroImageUrl(layoutId));
    }
  };

  // Pre-load existing event data if editing
  useEffect(() => {
    if (eventIdParam) {
      const loadEvent = async () => {
        setIsLoading(true);
        try {
          const docSnap = await getDoc(doc(db, 'events', eventIdParam));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setTitle(data.title || '');
            setDate(data.date || '');
            setTime(data.time || '17:00');
            setSelectedLayout(data.layoutMode || 'CLASSIC' as any);
            setBrideName(data.brideName || '');
            setGroomName(data.groomName || '');
            setLocationName(data.locationName || '');
            setAddress(data.address || '');
            setMapLink(data.mapLink || '');
            setLatitude(typeof data.latitude === 'number' ? data.latitude : null);
            setLongitude(typeof data.longitude === 'number' ? data.longitude : null);
            setPlaceId(typeof data.placeId === 'string' ? data.placeId : null);
            setDescription(data.description || '');
            setMusicTrack(data.musicTrack || 'romantic');
            if (data.timeline) setTimeline(data.timeline);
            if (data.gifts) setGifts(data.gifts);
            if (data.heroImage) setHeroImage(data.heroImage);
            if (data.editableContent) setEditableContent(data.editableContent);
            if (data.mapImage) setMapImage(data.mapImage);
            if (data.dressCode) {
              setDressCodeTitle(data.dressCode.title || 'Dress Code');
              setDressCodeDesc(data.dressCode.description || '');
            }
          }
        } catch (error) {
          console.error("Error loading event", error);
          toast.error("Impossível carregar dados do convite.");
        } finally {
          setIsLoading(false);
        }
      };
      loadEvent();
    }
  }, [eventIdParam]);

  const handleAddTimeline = () => {
    if (!newTime || !newTitle) {
      toast.error('Informe ao menos hora e o título da atividade.');
      return;
    }
    setTimeline([...timeline, { time: newTime, title: newTitle, description: newDesc }]);
    setNewTime('');
    setNewTitle('');
    setNewDesc('');
    toast.success('Atividade incluída no cronograma!');
  };

  const handleRemoveTimeline = (index: number) => {
    setTimeline(timeline.filter((_, i) => i !== index));
    toast.success('Atividade removida.');
  };

  const handleAddGift = () => {
    if (!newGiftTitle || !newGiftValue) {
      toast.error('Preencha o nome do presente/cota e os dados para pagamento.');
      return;
    }
    setGifts([...gifts, {
      type: newGiftType,
      title: newGiftTitle,
      value: newGiftValue,
      description: newGiftDesc,
      bankName: newGiftBank,
      accountName: newGiftAccount
    }]);
    setNewGiftTitle('');
    setNewGiftValue('');
    setNewGiftDesc('');
    setNewGiftAccount('');
    toast.success('Mimo incluído com sucesso!');
  };

  const handleRemoveGift = (index: number) => {
    setGifts(gifts.filter((_, i) => i !== index));
    toast.success('Mimo excluído.');
  };

  // Primary save handler which checks limits ONLY upon clicking "Salvar" for a new event
  const handleSaveEvent = async () => {
    if (!title || !date) {
      toast.error('Preencha o título do evento e a data antes de prosseguir.');
      return;
    }
    if (!user) {
      toast.error('Autenticação é mandatória para salvar o convite.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading(isEditingExisting ? 'Atualizando convite...' : 'Lavrando convite real no Banco de Dados...');

    try {
      // PREMIUM LAYOUT RULE: Check if selecting a premium layout on an Essencial plan
      const isPremiumLayout = ['LUXURY', 'GARDEN', 'RUSTIC', 'INDUSTRIAL', 'LIMINTSO_GOLD', 'LIMINTSO_ME'].includes(selectedLayout);
      const isUserEssencial = !canUseFeature(userProfile?.plan, 'premium_themes');
      if (isPremiumLayout && isUserEssencial) {
        toast.dismiss(toastId);
        setAttemptedPremiumLayout(selectedLayout === 'LUXURY' ? 'Luxo de Realeza' : selectedLayout === 'LIMINTSO_GOLD' ? 'Ouro Imperial' : selectedLayout === 'LIMINTSO_ME' ? 'Nobreza de Luanda' : selectedLayout === 'GARDEN' ? 'Jardim Encantado' : selectedLayout === 'RUSTIC' ? 'Rústico / Natural' : 'Industrial Loft');
        setShowUpgradeModal(true);
        setIsLoading(false);
        return;
      }

      // BILLING RULE: Check plan limit when creating a NEW invitation (only if not baby shower and not bridal shower)
      if (!isEditingExisting && !isBabyShower && !isBridalShower && !isBusinessPlan(userProfile?.plan)) {
        const plan = normalizePlanId(userProfile?.plan); const limit = getEventCreationLimit(plan);

        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, where("ownerId", "==", user.uid));
        const snap = await getDocs(q);
        
        // Count only paid events (not baby/bridal showers)
        const paidCount = snap.docs.filter(d => d.data().type !== 'BABY_SHOWER' && d.data().type !== 'BRIDAL_SHOWER').length;

        if (paidCount >= limit) {
          toast.error(`Você atingiu o limite de ${limit} convites de casamento do seu plano. Faça upgrade para criar mais!`, { id: toastId });
          setIsLoading(false);
          return;
        }
      }

      const activeEventId = eventIdParam || "evt_" + Math.random().toString(36).substr(2, 9);
      const docRef = doc(db, 'events', activeEventId);

      const computedFormType = isBabyShower ? 'BABY_SHOWER' : isBridalShower ? 'BRIDAL_SHOWER' : 'WEDDING';

      const normalizedPlan = normalizePlanId(userProfile?.plan || 'essential');
      const expiresAtDate = (() => {
        try {
          const daysMap: Record<string, number> = { essential: 90, premium: 180, vip: 365, business: 365 };
          const d = daysMap[normalizedPlan] ?? 90;
          if (!isFinite(d)) return null;
          const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString();
        } catch { return null; }
      })();
      const eventIsoDate = (() => {
        try {
          if (!date) return '';
          const d = new Date(`${date}T${time || '12:00'}:00`);
          return isNaN(d.getTime()) ? '' : d.toISOString();
        } catch { return ''; }
      })();
      const savePayload: any = {
        id: activeEventId,
        title: title,
        date: date,
        isoDate: eventIsoDate,
        time: time,
        type: computedFormType,
        layoutMode: selectedLayout,
        ownerId: user.uid,
        plan: normalizedPlan, // canónico minúsculo — legado normalizado
        planId: normalizedPlan,
        status: 'active',
        billingStatus: 'pending',
        ...(isEditingExisting ? {} : { isPublished: false }),
        expiresAt: expiresAtDate,
        publishedAt: new Date().toISOString(),
        addons: {},
        description: description,
        locationName: locationName,
        address: address,
        mapLink: mapLink,
        latitude: latitude,
        longitude: longitude,
        placeId: placeId,
        musicTrack: musicTrack,
        gifts: gifts,
        heroImage: heroImage || getHeroImageUrl(selectedLayout),
        editableContent: editableContent || {},
        ...(mapImage ? { mapImage } : {}),
        clientToken: Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Handle conditional parameters
      if (!isBridalShower && !isBabyShower) {
        savePayload.brideName = brideName;
        savePayload.groomName = groomName;
        savePayload.timeline = timeline;
        savePayload.dressCode = {
          title: dressCodeTitle || 'Dress Code',
          description: dressCodeDesc || ''
        };
      } else if (isBabyShower) {
        savePayload.brideName = brideName; // For Baby shower, protagonist baby/mother name
        // We omit or hide the wedding specifics as requested in rule:
        // Nom do Noivo, Recepção, Dress Code, and Timeline are omitted to streamline.
      } else {
        savePayload.brideName = brideName; // For Bridal shower, protagonist name
        // We omit or hide the wedding specifics as requested in rule:
        // Nom do Noivo, Recepção, Dress Code, and Timeline are omitted to streamline.
      }

      await setDoc(docRef, savePayload, { merge: true });

      toast.success(isEditingExisting ? 'Convite atualizado com perfeição!' : 'Perfeito! Seu convite foi criado com sucesso!', { id: toastId });
      
      // Redirect straight back to dashboard
      navigate(`/dashboard/${activeEventId}`);
    } catch (err: any) {
      console.error(err);
      toast.error('Ocorreu um problema ao publicar o seu convite.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // RSVP Dynamic text mapping based on type
  const getDynamicRsvpText = () => {
    if (isBabyShower) {
      return "Confirmar Presença no Chá de Bebé";
    }
    if (isBridalShower) {
      return "Confirmar Presença no Chá";
    }
    return "Confirmar Presença";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Header Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#B39374] bg-amber-50 px-2 py-0.5 rounded">
              L’Atelier Editor
            </span>
            <h1 className="text-xl font-serif text-slate-900 tracking-tight font-bold">
              {isEditingExisting ? 'Refinar Convite' : 'Criar Novo de Alta Costura'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Plan indication */}
          {(userProfile?.plan === 'Business' || userProfile?.plan === 'Corporate') && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full py-1 px-3">
              <Globe size={12} /> Canal ilimitado [{userProfile.plan}]
            </span>
          )}

          <button
            type="button"
            onClick={handleSaveEvent}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 text-white font-semibold text-xs md:text-sm py-2 px-5 rounded-xl transition-all duration-300 disabled:opacity-50 cursor-pointer border-none shadow-md"
          >
            <Save size={16} />
            <span>Salvar Convite</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* LEFT: Config Panel */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            
            {/* Editor Tabs */}
            <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-1 w-full overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'content' 
                    ? 'bg-slate-950 text-white shadow' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText size={14} /> Narrativa
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('design')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'design' 
                    ? 'bg-slate-950 text-white shadow' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Layout size={14} /> Design
              </button>

              {!isBridalShower && !isBabyShower && (
                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'timeline' 
                      ? 'bg-slate-950 text-white shadow' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Calendar size={14} /> Agenda
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('gifts')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'gifts' 
                    ? 'bg-slate-950 text-white shadow' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Gift size={14} /> Presentes
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100/50 space-y-6">
              <AnimatePresence mode="wait">
                
                {/* 1. CONTENT & LOGISTICS TAB */}
                {activeTab === 'content' && (
                  <motion.div
                    key="content-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-base font-serif font-bold text-slate-900 mb-4">Informações Essenciais do Dia</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Título do Convite</label>
                          <input 
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all"
                            placeholder="Sarah & João"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                            {isBabyShower ? "Nome do Bebé / Mamã" : "Nome da Noiva"}
                          </label>
                          <input 
                            type="text"
                            value={brideName}
                            onChange={(e) => setBrideName(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all"
                            placeholder={isBabyShower ? "Nome do Bebé ou Mamã" : "Nome da Noiva"}
                          />
                        </div>

                        {!isBridalShower && !isBabyShower && (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nome do Noivo (Protagonista 2)</label>
                            <input 
                              type="text"
                              value={groomName}
                              onChange={(e) => setGroomName(e.target.value)}
                              className="w-full border border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all"
                              placeholder="Nome do Noivo"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 col-span-1 md:col-span-2">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Data do Evento</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input 
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl p-3 pl-10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Horário de Início</label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input 
                                type="text"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl p-3 pl-10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all"
                                placeholder="17:00"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Texto de Introdução / Boas-Vindas</label>
                      </div>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full border border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all text-slate-700"
                        placeholder="Escreva uma mensagem especial para dar boas-vindas aos seus convidados..."
                      />
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <h3 className="text-base font-serif font-bold text-slate-900 mb-4">Logística Urbana</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nome de Local de Sonhos (Recepção)</label>
                          {GOOGLE_MAPS_API_KEY ? (
                            <PlacePicker
                              value={locationName}
                              onChange={(v) => {
                                setLocationName(v);
                                setLatitude(null);
                                setLongitude(null);
                                setPlaceId(null);
                              }}
                              onClear={() => {
                                setLatitude(null);
                                setLongitude(null);
                                setPlaceId(null);
                              }}
                              inputClassName="w-full border border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all"
                              placeholder="Pesquise e escolha uma sugestão — ex: Jardim das Palmeiras"
                              onSelect={(sel) => {
                                setLocationName(sel.name || locationName);
                                setAddress(sel.address);
                                setLatitude(sel.latitude);
                                setLongitude(sel.longitude);
                                setPlaceId(sel.placeId || null);
                                setMapLink(sel.mapLink);
                                toast.success(sel.name ? `${sel.name} marcado no mapa!` : 'Local marcado no mapa!');
                              }}
                            />
                          ) : (
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input
                                type="text"
                                value={locationName}
                                onChange={(e) => setLocationName(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl p-3 pl-10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all"
                                placeholder="e.g. Jardim das Palmeiras, Clube Bilene"
                              />
                            </div>
                          )}
                          {(latitude === null || longitude === null) && (
                            <p className="text-[11px] text-slate-400 font-medium mt-2">
                              Digite e escolha uma sugestão da lista — nome, endereço e mapa preenchem sozinhos.
                            </p>
                          )}
                          {(latitude !== null && longitude !== null) && (
                            <p className="text-xs text-emerald-600 font-medium mt-2">
                              ✓ Marcador preciso no mapa — os convidados veem exatamente onde é.
                            </p>
                          )}
                        </div>
                        {(address || locationName) && (
                          <div className="col-span-1 md:col-span-2">
                            <TravelMap
                              chrome="map-only"
                              event={{ latitude, longitude, address, locationName, mapLink }}
                            />
                          </div>
                        )}

                        <div className="col-span-1 md:col-span-2">
                          <p className="text-[11px] text-slate-400 font-medium mb-2">
                            …ou preencha o endereço manualmente abaixo
                          </p>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Endereço Completo</label>
                          <input 
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all"
                            placeholder="e.g. Avenida Pedro de Castro Van-Dúnem Loy, Luanda"
                          />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">URL Google Maps Link (Opcional)</label>
                          <input 
                            type="text"
                            value={mapLink}
                            onChange={(e) => setMapLink(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all"
                            placeholder="e.g. https://goo.gl/maps/..."
                          />
                        </div>
                      </div>
                    </div>

                    {!isBridalShower && !isBabyShower && (
                      <div className="border-t border-slate-100 pt-6">
                        <h3 className="text-base font-serif font-bold text-slate-900 mb-4">Apresentação dos Noivos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Título da Seção de Roupas</label>
                            <input 
                              type="text"
                              value={dressCodeTitle}
                              onChange={(e) => setDressCodeTitle(e.target.value)}
                              className="w-full border border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all"
                              placeholder="Dress Code"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Regras / Sugestão de Vestimenta</label>
                            <input 
                              type="text"
                              value={dressCodeDesc}
                              onChange={(e) => setDressCodeDesc(e.target.value)}
                              className="w-full border border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all"
                              placeholder="Ex. Esporte Fino. Mulheres de longo e homens de terno."
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  </motion.div>
                )}

                {/* 2. DESIGN & MUSIC TAB */}
                {activeTab === 'design' && (
                  <motion.div
                    key="design-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-base font-serif font-bold text-slate-900 mb-1">Cenário de Estética & Modelo</h3>
                      <p className="text-xs text-slate-500 mb-4 font-normal">Selecione o modelo conceitual de design ideal para a sua celebração única.</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {isBabyShower ? (
                          <>
                            {[
                              { id: 'BABY_BOY', label: 'Chá do Príncipe (Azul)', desc: 'Para o rapazinho que está a caminho' },
                              { id: 'BABY_GIRL', label: 'Chá da Princesa (Rosa)', desc: 'Para a menina querida que está a caminho' },
                              { id: 'BABY_NEUTRAL', label: 'Chá Neutro Safari', desc: 'Estilo neutro aconchegante' }
                            ].map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleLayoutSelect(item.id as LayoutMode)}
                                className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 cursor-pointer transition-all duration-300 ${
                                  selectedLayout === item.id 
                                    ? 'bg-cyan-50/70 border-cyan-500 ring-1 ring-cyan-500 shadow'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <span className={`text-xs font-bold leading-tight ${selectedLayout === item.id ? 'text-cyan-900' : 'text-slate-800'}`}>{item.label}</span>
                                <span className="text-[10px] text-slate-500 leading-tight block">{item.desc}</span>
                              </button>
                            ))}
                          </>
                        ) : isBridalShower ? (
                          <>
                            {[
                              { id: 'BRIDAL_ROMANTIC', label: 'Chá Romântico Rosé', desc: 'Ar pastel romântico delicado' },
                              { id: 'BRIDAL_MINIMAL', label: 'Chá Minimalista Chic', desc: 'Estética contemporânea clean' },
                              { id: 'BRIDAL_CHEF', label: 'Chá de Linhas Rústicas', desc: 'Madeiras rústicas e folhagens' },
                              { id: 'BRIDAL_BEAUTY', label: 'Estilo Beleza & Spa', desc: 'Toques de luxo e relaxamento' },
                              { id: 'BRIDAL_TEA_PARTY', label: 'Tea Party Delicado', desc: 'Ar aristocrático vintage' },
                              { id: 'BRIDAL_TROPICAL', label: 'Tropical Elegante', desc: 'Ar festivo e florido angolano' }
                            ].map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleLayoutSelect(item.id as LayoutMode)}
                                className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 cursor-pointer transition-all duration-300 ${
                                  selectedLayout === item.id 
                                    ? 'bg-purple-50/70 border-purple-500 ring-1 ring-purple-500 shadow'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <span className={`text-xs font-bold leading-tight ${selectedLayout === item.id ? 'text-purple-900' : 'text-slate-800'}`}>{item.label}</span>
                                <span className="text-[10px] text-slate-500 leading-tight block">{item.desc}</span>
                              </button>
                            ))}
                          </>
                        ) : (
                          <>
                            {[
                              { id: 'LIMINTSO_GOLD', label: 'Ouro Imperial', desc: 'Chany & Pedro Luxo Dourado', premium: true },
                              { id: 'LIMINTSO_ME', label: 'Nobreza de Luanda', desc: 'Marnela & Evandro Nobreza Clássica', premium: true },
                              { id: 'CLASSIC', label: 'Clássico Romântico', desc: 'Elegância de contos de reis' },
                              { id: 'MODERN', label: 'Cosmopolita / Moderno', desc: 'Aparência ousada espacial' },
                              { id: 'LUXURY', label: 'Luxo de Realeza', desc: 'Elegância formal e aristocrata', premium: true },
                              { id: 'GARDEN', label: 'Jardim Encantado', desc: 'Pétalas florais e românticas', premium: true },
                              { id: 'RUSTIC', label: 'Rústico / Natural', desc: 'Folhas, madeiras e aconchego', premium: true },
                              { id: 'INDUSTRIAL', label: 'Industrial Loft', desc: 'Modernidade metropolitana', premium: true }
                            ].map((item) => {
                              const isPremium = item.premium;
                              const isLocked = isPremium && (userProfile?.plan === 'Essencial' || !userProfile?.plan);
                              
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    if (isLocked) {
                                      setAttemptedPremiumLayout(item.label);
                                      setShowUpgradeModal(true);
                                      return;
                                    }
                                    handleLayoutSelect(item.id as LayoutMode);
                                  }}
                                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 cursor-pointer transition-all duration-300 relative ${
                                    selectedLayout === item.id 
                                      ? 'bg-purple-50/70 border-purple-500 ring-1 ring-purple-500 shadow'
                                      : 'bg-white border-slate-200 hover:border-slate-300'
                                  } ${isLocked ? 'opacity-75 bg-slate-50/50' : ''}`}
                                >
                                  <div className="flex items-start justify-between w-full">
                                    <span className={`text-xs font-bold leading-tight ${selectedLayout === item.id ? 'text-purple-900' : 'text-slate-800'}`}>{item.label}</span>
                                    {isLocked && (
                                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wider">
                                        PRO
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-500 leading-tight block">{item.desc}</span>
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Music className="text-purple-600" size={18} />
                        <h3 className="text-base font-serif font-bold text-slate-900">Música de Fundo Automática</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { id: 'romantic', label: 'Piano Romântico' },
                          { id: 'orchestra', label: 'Melodia Real' },
                          { id: 'acoustic', label: 'Violão Acústico' },
                          { id: 'none', label: 'Sem Som' },
                        ].map((track) => (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => setMusicTrack(track.id)}
                            className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                              musicTrack === track.id
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold text-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 text-xs font-medium'
                            }`}
                          >
                            {track.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. TIMELINE TAB (WEDDING ONLY) */}
                {activeTab === 'timeline' && !isBridalShower && (
                  <motion.div
                    key="timeline-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-base font-serif font-bold text-slate-900 mb-1">Cronograma / Agenda de Eventos</h3>
                      <p className="text-xs text-slate-500 mb-4">Apresente aos seus convidados todos os momentos da celebração em ordem sequencial.</p>
                      
                      {/* Form to Add Timeline Item */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 mb-6 space-y-3">
                        <span className="text-xs font-bold text-slate-700 block mb-1">Adicionar Nova Atividade</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            placeholder="e.g. 17:30"
                            className="bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-xs"
                          />
                          <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Título da Atividade"
                            className="bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-xs md:col-span-2"
                          />
                        </div>
                        <input
                          type="text"
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          placeholder="Descrição opcional (máx. 1 frase)"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddTimeline}
                          className="flex items-center justify-center gap-1.5 w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl font-bold text-xs"
                        >
                          <Plus size={14} /> Adicionar ao Cronograma
                        </button>
                      </div>

                      {/* Render Timeline List */}
                      <div className="space-y-3">
                        {timeline.length === 0 ? (
                          <p className="text-slate-400 text-xs text-center py-6">Cronograma limpo. Adicione itens.</p>
                        ) : (
                          timeline.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-4 p-3 border border-slate-150 rounded-xl bg-white shadow-sm hover:border-indigo-150 transition-all">
                              <div className="flex-1">
                                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{item.time}</span>
                                <h4 className="text-sm font-bold text-slate-800 mt-1">{item.title}</h4>
                                {item.description && (
                                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveTimeline(idx)}
                                className="text-slate-400 hover:text-red-500 p-2 rounded-lg transition-colors"
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. GIFTS TAB */}
                {activeTab === 'gifts' && (
                  <motion.div
                    key="gifts-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-base font-serif font-bold text-slate-900 mb-1">Mimos & Lista de Presentes Virtuais</h3>
                      <p className="text-xs text-slate-500 mb-4 font-normal">Crie cotas em dinheiro ou itens para os convidados colaborarem via IBAN ou link.</p>
                      
                      {/* Form to Add Item */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 mb-6 space-y-3">
                        <span className="text-xs font-bold text-slate-700 block mb-1">Adicionar Mimo Reativo</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Título de Mimo</label>
                            <input
                              type="text"
                              value={newGiftTitle}
                              onChange={(e) => setNewGiftTitle(e.target.value)}
                              placeholder="e.g. Jogo de Pratos, Cota Lua de Mel"
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">IBAN Angolano / Link</label>
                            <input
                              type="text"
                              value={newGiftValue}
                              onChange={(e) => setNewGiftValue(e.target.value)}
                              placeholder="e.g. AO06 0000 0000..."
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Nome de Banco</label>
                            <input
                              type="text"
                              value={newGiftBank}
                              onChange={(e) => setNewGiftBank(e.target.value)}
                              placeholder="BAI, BFA, BIC, etc."
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Nome do Titular</label>
                            <input
                              type="text"
                              value={newGiftAccount}
                              onChange={(e) => setNewGiftAccount(e.target.value)}
                              placeholder="Sarah e João Silva"
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-xs"
                            />
                          </div>
                        </div>

                        <input
                          type="text"
                          value={newGiftDesc}
                          onChange={(e) => setNewGiftDesc(e.target.value)}
                          placeholder="Breve frase romântica de convite de apoio por este mimo."
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-xs"
                        />

                        <button
                          type="button"
                          onClick={handleAddGift}
                          className="flex items-center justify-center gap-1.5 w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl font-bold text-xs cursor-pointer"
                        >
                          <Plus size={14} /> Incluir MIMO na Lista
                        </button>
                      </div>

                      {/* Render Gifts list */}
                      <div className="space-y-3">
                        {gifts.length === 0 ? (
                          <p className="text-slate-400 text-xs text-center py-6">Nenhum mimo adicionado ainda.</p>
                        ) : (
                          gifts.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-4 p-3 border border-slate-150 rounded-xl bg-white shadow-sm">
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-50 px-2 rounded tracking-wider">{item.type}</span>
                                  {item.bankName && (
                                    <span className="text-[9px] uppercase font-mono text-slate-500">[{item.bankName}]</span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 mt-1">{item.title}</h4>
                                <p className="text-[11px] font-mono text-slate-600 mt-0.5 break-all leading-tight">IBAN: {item.value}</p>
                                {item.accountName && (
                                  <p className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">Titular: {item.accountName}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveGift(idx)}
                                className="text-slate-400 hover:text-red-500 p-2 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Warning Message Box indicating payment only on final Save */}
            <div className="p-4 rounded-2xl bg-[#F0F4FF] border border-blue-200/50 flex gap-3 text-blue-800 text-xs leading-relaxed font-medium">
              <span className="material-symbols-outlined text-[18px] text-brand-blue flex-shrink-0">info</span>
              <div>
                <p className="font-bold">Alta Costura sem riscos de cobrança</p>
                <p className="text-blue-700 font-normal mt-0.5">
                  {isEditingExisting 
                    ? 'Esta edição está atualizando um convite já cadastrado. Não haverá cobrança de créditos adicionais.' 
                    : 'Personalize tudo sem limites de tempo ou toques. Seus créditos só serão descontados (2 créditos por criação) ao clicar no botão "Salvar Convite" no canto superior de sua tela.'}
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT: Live Visual Mockup Preview */}
          <div className="col-span-12 lg:col-span-5 h-[calc(100vh-140px)] sticky top-[100px] hidden lg:flex flex-col items-center">
            
            {/* Header description */}
            <div className="text-center mb-4 flex items-center justify-center gap-1.5 text-slate-500 text-xs uppercase font-bold tracking-widest bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/50">
              <Eye size={12} className="text-purple-600 animate-pulse" />
              <span>Visualização do Celular (Pró-ativa)</span>
            </div>

            {/* Phone Mockup Wrapper */}
            <div className="relative w-[340px] h-[550px] bg-[#1a1b1d] rounded-[48px] p-2.5 shadow-2xl border-[11px] border-slate-900/90 overflow-hidden flex flex-col">
              
              {/* Dynamic Island bar */}
              <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
                <span className="w-2.5 h-2.5 bg-slate-900 rounded-full absolute right-4"></span>
              </div>

              {/* Dynamic Theme Styles / Mock inside */}
              <div className={`w-full h-full rounded-[38px] overflow-y-auto overflow-x-hidden relative flex flex-col text-center px-4 py-8 bg-slate-50 scrollbar-none transition-all duration-500 ${
                selectedLayout === 'CLASSIC' ? 'bg-[#FCFAF8] text-[#2C2621] font-serif' :
                selectedLayout === 'MODERN' ? 'bg-[#111112] text-white font-sans' :
                selectedLayout === 'LUXURY' ? 'bg-[#0E131F] text-[#D4AF37] font-serif' :
                selectedLayout === 'LIMINTSO_GOLD' ? 'bg-[#FFFDF9] text-[#b49232] font-serif border border-[#f5ebcf]' :
                selectedLayout === 'LIMINTSO_ME' ? 'bg-[#FCFAF6] text-[#121212] font-serif border border-stone-200' :
                selectedLayout === 'GARDEN' ? 'bg-emerald-50/75 text-[#1C3A27] font-serif' :
                selectedLayout === 'RUSTIC' ? 'bg-[#FAF6F0] text-[#5C4D3C] font-serif' :
                selectedLayout === 'INDUSTRIAL' ? 'bg-[#F2F2F2] text-slate-900 font-mono' :
                selectedLayout.startsWith('BRIDAL_') ? 'bg-[#FFF8F8] text-[#4F3636]' :
                'bg-white text-slate-900 font-sans'
              }`}>
                {/* Simulated Image header placeholder */}
                <div className="w-full h-24 rounded-2xl bg-neutral-200/80 overflow-hidden relative mb-4 shadow-inner flex items-center justify-center">
                  <div className="absolute inset-0 bg-cover bg-center opacity-85 transition-all duration-300" style={{ backgroundImage: `url('${getHeroImageUrl(selectedLayout)}')` }} />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Heart className="text-white animate-pulse" size={18} />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Save the Date tag */}
                  <span className="text-[9px] uppercase tracking-[0.25em] opacity-60 font-bold">
                    Save the Date
                  </span>

                  {/* Header Title */}
                  <h1 className="text-2xl font-bold font-serif tracking-tight leading-tight uppercase">
                    {title}
                  </h1>

                  {/* Description Paragraph */}
                  <div className="px-1 text-[11px] leading-relaxed opacity-85 italic font-light">
                    "{description}"
                  </div>

                  <div className="h-[1px] bg-slate-200/70 max-w-[80px] mx-auto opacity-70"></div>

                  {/* Logistics block */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider font-bold opacity-75">
                      <Calendar size={11} /> 
                      <span>{date || 'Selecione a Data'} {time && `às ${time}h`}</span>
                    </div>

                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold opacity-75 leading-tight px-3">
                      <MapPin size={11} className="flex-shrink-0" />
                      <span className="line-clamp-2 md:line-clamp-1">{locationName}</span>
                    </div>
                  </div>

                  {/* Conditionally reveal timeline preview */}
                  {!isBridalShower && timeline.length > 0 && (
                    <div className="text-left mt-6 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/50">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-1.5 text-center">Programação</span>
                      <div className="space-y-2">
                        {timeline.slice(0, 2).map((itm, i) => (
                          <div key={i} className="text-[10px] leading-tight border-b border-dashed border-slate-200 pb-1.5 last:border-none">
                            <span className="font-bold text-purple-700 bg-purple-50 px-1 py-0.2 rounded font-mono mr-1">{itm.time}</span>
                            <span className="font-semibold text-slate-800">{itm.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Virtual Gifts list preview */}
                  {gifts.length > 0 && (
                    <div className="text-left mt-4 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/50">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-1.5 text-center">Lista de Presentes (IBAN)</span>
                      <div className="space-y-1.5">
                        {gifts.slice(0, 2).map((gft, idx) => (
                          <div key={idx} className="text-[10px] leading-tight flex justify-between gap-2 border-b border-slate-100 pb-1 last:border-none">
                            <span className="font-semibold text-slate-800 line-clamp-1">{gft.title}</span>
                            <span className="font-mono text-[9px] text-slate-400">[{gft.bankName || 'IBAN'}]</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Simulated Floating RSVP button */}
                  <div className="pt-4 pb-2">
                    <button 
                      type="button" 
                      className={`w-full py-3 px-4 text-[10px] font-bold uppercase tracking-wider rounded-xl text-white shadow-md transition-all ${
                        selectedLayout.startsWith('BRIDAL_') 
                          ? 'bg-gradient-to-r from-pink-500 to-rose-600'
                          : 'bg-gradient-to-r from-purple-700 to-indigo-700'
                      }`}
                    >
                      {getDynamicRsvpText()}
                    </button>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />

            {/* Modal content box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white/90 border border-white/50 backdrop-blur-2xl shadow-2xl rounded-3xl p-6 md:p-8 max-w-md w-full relative overflow-hidden text-center z-10"
            >
              {/* Subtle gold decoration ring */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />
              
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer outline-none"
              >
                <X size={18} />
              </button>

              {/* Crown / Gem Icon Container */}
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-50 flex items-center justify-center border border-amber-200/50 shadow-inner mb-6 relative group">
                <Gem className="text-amber-600 animate-pulse" size={28} />
                <Sparkles className="text-yellow-500 absolute -top-1 -right-1" size={14} />
              </div>

              <h2 className="text-2xl font-serif font-black text-slate-900 mb-2 leading-tight">
                Desbloqueie o Tema Premium
              </h2>
              {attemptedPremiumLayout && (
                <p className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full inline-block mb-4">
                  {attemptedPremiumLayout}
                </p>
              )}

              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                O modelo selecionado é um design premium exclusivo. Com o acesso <strong className="text-slate-900">Premium (Pagamento Único)</strong> por apenas <strong className="text-amber-600">15.000 Kz</strong>, o seu convite ganha recursos incomparáveis:
              </p>

              {/* Premium features checklist */}
              <div className="text-left space-y-2.5 mb-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-2.5 text-xs text-slate-700">
                  <Check className="text-amber-600 mt-0.5 flex-shrink-0" size={14} />
                  <span>Acesso livre a <strong>TODOS os modelos</strong> luxuosos e artísticos.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-700">
                  <Check className="text-amber-600 mt-0.5 flex-shrink-0" size={14} />
                  <span><strong>Sem Marca de Água</strong>: remova totalmente o logotipo da InoEvents do rodapé.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-700">
                  <Check className="text-amber-600 mt-0.5 flex-shrink-0" size={14} />
                  <span><strong>RSVP até 300 convidados</strong>: confirmações com gestão individual e QR.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-700">
                  <Check className="text-amber-600 mt-0.5 flex-shrink-0" size={14} />
                  <span><strong>Música de Fundo (TocaPlayer)</strong> para encantar os convidados logo na abertura.</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                <a
                  href={`https://wa.me/244952815430?text=${encodeURIComponent(
                    `Olá! Estou na plataforma InoEvents a criar o meu convite e gostaria de comprar o acesso PREMIUM por 15.000 Kz para o modelo "${attemptedPremiumLayout || 'Luxo'}"!\n\nID: ${user?.uid || 'Não autenticado'}\nE-mail: ${user?.email || 'Sem e-mail'}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg hover:scale-[1.01] active:scale-95 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Gem size={16} className="text-amber-400" />
                  Adquirir Acesso Premium (15.000 Kz)
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    navigate('/plans');
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-2xl transition-all text-sm cursor-pointer border border-slate-200/50"
                >
                  Ver Tabela de Planos
                </button>
              </div>

              <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                *Pagamento único por evento. Sem surpresas ou taxas recorrentes mensais. Ativo até 30 dias após o evento.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
