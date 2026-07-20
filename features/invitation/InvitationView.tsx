// ============================================================================
// COMPONENT: INVITATION CONTROLLER
// Decides which layout to render based on event.layoutMode
// ============================================================================
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Joyride, STATUS } from "react-joyride";
import { getEventById, EVENTS } from "../../mockData";
import {
  EventDetails,
  LayoutMode,
  ThemeType,
  TimelineItem,
  GiftItem,
} from "../../types";
import { TocaPlayer } from "../../components/music/TocaPlayer";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { db, useFirebase } from "../../components/FirebaseProvider";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot, increment,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../../components/FirebaseProvider";
import toast from "react-hot-toast";
import { copyToClipboard } from "../../lib/clipboard";
import { QRCodeSVG } from "qrcode.react";
import { SEO } from "../../components/SEO";
import { getOptimizedImageUrl, OptimizeImageOptions } from "../../lib/imageOptimizer";
import { Guestbook } from "./Guestbook";
import { CheckStatusModal } from "./CheckStatusModal";

// Helper to safely get image source URL from string or custom object and optimize it
const getImageUrl = (img: any, options: OptimizeImageOptions = {}): string => {
  let url = "";
  if (typeof img === "string") {
    url = img;
  } else if (img && typeof img === "object" && img.url) {
    url = img.url;
  }
  
  if (!url) return "";
  
  // Set default smart parameters for high-performance mobile loading in Angola
  const optOptions: OptimizeImageOptions = {
    width: options.width || 800,
    quality: options.quality || 75,
    format: options.format || "webp",
  };
  
  return getOptimizedImageUrl(url, optOptions);
};

// Beautiful Wedding Background Presets from Unsplash
const IMAGE_PRESETS = [
  {
    name: "Arco Clássico",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2574&auto=format&fit=crop",
  },
  {
    name: "Casal Etereal",
    url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=2670&auto=format&fit=crop",
  },
  {
    name: "Jardim de Rosas",
    url: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=2574&auto=format&fit=crop",
  },
  {
    name: "Salão Real",
    url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=2670&auto=format&fit=crop",
  },
  {
    name: "Pôr do Sol Rústico",
    url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=2698&auto=format&fit=crop",
  },
  {
    name: "Galeria Industrial",
    url: "https://images.unsplash.com/photo-1510076857177-7470076d4098?q=80&w=2672&auto=format&fit=crop",
  },
  {
    name: "Maquilhagem Chá",
    url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=2000&auto=format&fit=crop",
  },
  {
    name: "Chá Vintage Estilo",
    url: "https://images.unsplash.com/photo-1582662057262-6718cf2ce64b?q=80&w=2000&auto=format&fit=crop",
  },
];

// Available romantic soundtrack files in player
const TRACK_PRESETS = [
  "Canon in D - Piano",
  "A Thousand Years - Christina Perri",
  "Turning Page - Sleeping At Last",
  "La Vie En Rose - Instrumental",
  "Waltz No. 2 - Shostakovich",
  "I Won't Give Up - Jason Mraz",
  "Samba Rock",
  "Bossa Nova Cover",
  "No Music",
];

// Available templates list for layout switcher
const LAYOUT_PRESETS: { mode: LayoutMode; name: string }[] = [
  { mode: "LIMINTSO_GOLD", name: "Ouro Imperial (Chany & Pedro)" },
  { mode: "LIMINTSO_ME", name: "Nobreza de Luanda (Marnela & Evandro)" },
  { mode: "CLASSIC", name: "Clássico Romântico" },
  { mode: "MODERN", name: "Minimalista Etéreo" },
  { mode: "LUXURY", name: "Luxuoso Black Tie" },
  { mode: "GARDEN", name: "Jardim Elegante" },
  { mode: "RUSTIC", name: "Rústico Chic" },
  { mode: "INDUSTRIAL", name: "Industrial Urbano" },
  { mode: "BRIDAL_BEAUTY", name: "Chá Recatado / Beleza" },
  { mode: "BRIDAL_ROMANTIC", name: "Chá Romântico Rosas" },
  { mode: "BRIDAL_MINIMAL", name: "Chá Minimal de Luxo" },
  { mode: "BRIDAL_TEA_PARTY", name: "Chá da Tarde Vintage" },
  { mode: "BRIDAL_CHEF", name: "Chá das Noivas Chef" },
  { mode: "BRIDAL_TROPICAL", name: "Chá Tropical Folhas" },
];

// ============================================================================
// COMPONENT: INLINE EDITABLE FIELD
// Seamlessly swaps text element with an input/textarea in-place on hover/click
// ============================================================================
const EditableField: React.FC<{
  value: string;
  onChange: (newVal: string) => void;
  className?: string;
  isHidden?: boolean;
  multiline?: boolean;
  isEditing?: boolean;
}> = ({
  value,
  onChange,
  className = "",
  isHidden = false,
  multiline = false,
  isEditing = false,
}) => {
  const [isFieldEditing, setIsFieldEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    setIsFieldEditing(false);
    if (tempValue !== value) {
      onChange(tempValue);
    }
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsFieldEditing(false);
  };

  if (!isEditing) {
    return <span className={className}>{value}</span>;
  }

  return (
    <>
      <span
        onClick={(e) => {
          e.stopPropagation();
          setIsFieldEditing(true);
        }}
        className={`group relative cursor-pointer border-2 border-dashed border-[#BF9B30]/30 hover:border-[#BF9B30]/80 bg-[#BF9B30]/[0.02] hover:bg-[#BF9B30]/10 px-3 py-1 rounded-2xl transition-all duration-300 inline-flex items-center gap-1.5 max-w-full text-center ${className}`}
        title="Toque para editar"
      >
        <span>{value || "(Toque para editar)"}</span>
        {/* Subtle edit pencil icon */}
        <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 ml-1 bg-[#1A2026] border border-[#BF9B30]/40 text-[#BF9B30] rounded-full w-5 h-5 shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex items-center justify-center shrink-0 scale-[0.85] hover:scale-105 active:scale-95">
          <span className="material-symbols-outlined text-[10px] font-bold">
            edit
          </span>
        </span>
      </span>

      {isFieldEditing &&
        createPortal(
          <div className="fixed inset-0 bg-[#0F1419]/90 backdrop-blur-md flex items-center justify-center p-4 z-[120] animate-in fade-in duration-200">
            <div
              className="bg-[#0F1419] border border-[#BF9B30]/30 rounded-3xl w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-[#BF9B30]/20 flex items-center justify-between bg-[#0F1419]/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#BF9B30] text-[18px]">
                    edit_note
                  </span>
                  <span className="font-bold text-white text-xs uppercase tracking-widest">
                    Editar Texto
                  </span>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#BF9B30]/20 text-gray-400 hover:text-[#BF9B30] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {multiline ? (
                  <textarea
                    autoFocus
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-full bg-[#1A2026] border border-[#BF9B30]/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors custom-scrollbar resize-none"
                    rows={4}
                    placeholder="Escreva aqui..."
                    style={{ font: "inherit", textAlign: "inherit" }}
                  />
                ) : (
                  <input
                    autoFocus
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                    }}
                    className="w-full bg-[#1A2026] border border-[#BF9B30]/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                    placeholder="Escreva aqui..."
                    style={{ font: "inherit", textAlign: "inherit" }}
                  />
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-[#BF9B30]/20 bg-[#0F1419]/90 backdrop-blur-md flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-[#BF9B30] hover:bg-white text-[#0F1419] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_5px_15px_rgba(191,155,48,0.2)] cursor-pointer active:scale-95"
                >
                  Concluído
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

// Image upload compression helper
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Sub-component: ImageUploadField inside the same file for ease of bundler compilation
const ImageUploadField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (base64: string) => void;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    try {
      const base64 = await compressImage(e.target.files[0]);
      onChange(base64);
      toast.success("Imagem processada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2 bg-slate-800 p-4 rounded-xl border border-slate-700/60 shadow-inner">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            className="w-14 h-14 object-cover rounded-lg border border-slate-700"
            alt=""
          />
        ) : (
          <div className="w-14 h-14 bg-slate-900 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-[10px] text-center px-1 font-mono">
            Sem Foto
          </div>
        )}
        <div className="flex-1 space-y-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {isUploading ? "Compactando..." : "Fazer Upload"}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="text-[9px] text-slate-500 font-medium">
            Ou cole a URL direta:
          </div>
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-violet-500"
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );
};

const PERSUASIVE_LOADER_MESSAGES = [
  "Preparando uma experiência digital sublime...",
  "InoEvents: Crie convites interativos que encantam desde o primeiro toque.",
  "Rastreador inteligente de presença, mapas integrados e contagem regressiva em tempo real.",
  "Diga adeus aos convites de papel. Adote a alta costura digital com designs exclusivos.",
  "Lista de presentes elegante, dress code interativo e galeria de fotos integradas.",
  "Sua história de amor merece um design impecável. Crie e publique o seu em poucos minutos!",
];

const PremiumLoader: React.FC = () => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % PERSUASIVE_LOADER_MESSAGES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden relative">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[12000ms]" />

      <div className="z-10 flex flex-col items-center max-w-lg text-center px-4">
        {/* Glowing breathing & rotating outer ring */}
        <div className="relative w-24 h-24 mb-10 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border border-violet-500/20"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-t-2 border-r-2 border-violet-400"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-4 rounded-full border border-rose-400/30"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          />
          {/* Inner sparkling center */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-rose-400 opacity-80 blur-[4px] animate-pulse" />
        </div>

        {/* Premium Badge */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20 mb-6 backdrop-blur-md">
          InoEvents Premium
        </span>

        {/* Persuasive message carousel */}
        <div className="h-24 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-lg md:text-xl font-light text-slate-100 leading-relaxed font-sans max-w-md antialiased"
            >
              {PERSUASIVE_LOADER_MESSAGES[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Subtitle helper */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-[11px] uppercase tracking-wider text-slate-400 mt-12 animate-pulse"
        >
          Carregando convite interativo...
        </motion.p>

        {/* Brand foot credit */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <span className="text-xs text-slate-400">Criado com</span>
          <span className="text-xs font-semibold bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent tracking-wider">
            InoEvents
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: INVITATION CONTROLLER
// Decides which layout to render and runs the master visual templates editor workspace
// ============================================================================
const InvitationView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useFirebase();

  // URL Params and Core Editing Flags (Declared first so states and hooks can refer to them)
  const editParam = new URLSearchParams(window.location.search).get("edit") === "true";
  const isNew = new URLSearchParams(window.location.search).get("new") === "true";
  const isTemplate = EVENTS.some((e) => e.id === id);

  // Load event either from Firestore custom URL or template static mockup
  const [event, setEvent] = useState<EventDetails | null>(() => {
    return (getEventById(id || "") as any) || null;
  });
  const [localEvent, setLocalEvent] = useState<EventDetails | null>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isRSVPOpen, setRSVPOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [isCheckStatusOpen, setCheckStatusOpen] = useState(false);
  const [isBannerCollapsed, setIsBannerCollapsed] = useState(true);
  const [isOpenCover, setIsOpenCover] = useState(() => {
    return editParam;
  });

  const isOwner = !!(user && event && event.ownerId === user.uid);
  const canEdit = !firebaseLoading && !!user && (isTemplate || !!isNew || isOwner);
  const isEditing = editParam && canEdit;

  // Tour State (Clean & Single Declaration)
  const [runTour, setRunTour] = useState(() => {
    return editParam && isNew && localStorage.getItem('hasSeenTour') !== 'true';
  });

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('hasSeenTour', 'true');
    }
  };

  const tourSteps = [
    {
      target: '.tour-editor-header',
      content: 'Bem-vindo ao Estúdio de Criação! Aqui no topo você encontra o painel principal para salvar e gerenciar seu convite.',
      disableBeacon: true,
    },
    {
      target: '.tour-wysiwyg',
      content: 'Para personalizar, basta clicar em qualquer texto ou imagem! Você edita diretamente na tela e vê o resultado na hora.',
    },
    {
      target: '.tour-save-draft',
      content: 'Ainda não terminou? Salve como rascunho para continuar depois sem que ninguém veja.',
    },
    {
      target: '.tour-publish',
      content: 'Tudo pronto? Clique em Publicar para que seus convidados possam acessar e confirmar presença!',
    }
  ];

  const [sidebarTab, setSidebarTab] = useState<
    "style" | "texts" | "locations" | "timeline" | "gifts" | "save" | "gallery"
  >("style");
  const [activeModal, setActiveModal] = useState<
    "style" | "locations" | "timeline" | "gifts" | "gallery" | "hero" | null
  >(null);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mobileView, setMobileView] = useState<"editor" | "preview">("preview");
  const [showGuideTip, setShowGuideTip] = useState(true);

  // Auth state modal vars
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [isEditorBarExpanded, setIsEditorBarExpanded] = useState(false);

  // Scroll to top on mount & enforce authorized domain redirect
  useEffect(() => {
    window.scrollTo(0, 0);

    // Detect if accessed from unauthorized domain/subdomain and force secure redirect to primary production domain
    const hostname = window.location.hostname;
    const isAllowedHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".run.app") ||
      hostname === "inoevent.online" ||
      hostname === "www.inoevent.online";

    if (!isAllowedHost && hostname) {
      const targetUrl = `https://www.inoevent.online${window.location.pathname}${window.location.search}${window.location.hash}`;
      console.warn(`Redirecting to authorized domain: ${targetUrl}`);
      window.location.replace(targetUrl);
    }
  }, []);

  // Enforce editing permissions for existing events, templates, and new drafts
  useEffect(() => {
    if (firebaseLoading) return;
    
    if (editParam) {
      if (!user) {
        toast.error("Por favor, faça login ou crie uma conta para personalizar e editar convites.");
        const url = new URL(window.location.href);
        url.searchParams.delete("edit");
        url.searchParams.delete("new");
        if (isNew) {
          navigate("/templates", { replace: true });
        } else {
          navigate(url.pathname + url.search, { replace: true });
        }
        setIsAuthOpen(true);
      } else if (!isTemplate && !isNew && event && event.ownerId !== user.uid) {
        toast.error("Você não tem permissão para editar este convite.");
        const url = new URL(window.location.href);
        url.searchParams.delete("edit");
        navigate(url.pathname + url.search, { replace: true });
      }
    }
  }, [event, user, firebaseLoading, id, navigate, isTemplate, isNew, editParam]);

  // Sync loaded event with our free active customizer drafts state
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const fetchEvent = async () => {
      if (!id) return;

      const staticEvent = getEventById(id);
      if (staticEvent) {
        if (isEditing) {
          // Clone mockup templates to a customizable workspace project
          setLocalEvent({
            ...((staticEvent as any).draftData || staticEvent),
            id: `evt_${Math.random().toString(36).substr(2, 9)}`,
            ownerId: user?.uid || "",
            createdAt: new Date().toISOString(),
          });
        }
        setEvent(staticEvent as unknown as EventDetails);
        setFirebaseLoading(false);
        return;
      }

      // Check if temporary or query params new template initializer
      const urlParams = new URLSearchParams(window.location.search);
      const isNew =
        urlParams.get("new") === "true" ;
      const templateParam =
        (urlParams.get("template") as LayoutMode) || "CLASSIC";
      const themeParam =
        (urlParams.get("theme") as ThemeType) || ThemeType.WEDDING;
      const baseIdParam = urlParams.get("baseId");

      if (isNew) {
        let baseTpl = EVENTS.find((e) => e.layoutMode === templateParam) || EVENTS[0];
        if (baseIdParam) {
           const specific = EVENTS.find((e) => e.id === baseIdParam);
           if (specific) baseTpl = specific;
        }
        const draft = {
          ...(baseTpl as any),
          id: id,
          type: themeParam,
          layoutMode: templateParam as any,
          ownerId: user?.uid || "",
          createdAt: new Date().toISOString(),
        };
        setLocalEvent(draft as unknown as EventDetails);
        setEvent(draft as unknown as EventDetails);
        setFirebaseLoading(false);
        return;
      }

      // Firestore dynamic load with cache-then-network dual strategy for absolute resilience
      setFirebaseLoading(true);
      setNetworkError(null);

      try {
        const eventRef = doc(db, "events", id);

        // 1. Initial attempt using getDoc (which resolves instantly from cache if available)
        try {
          const cachedSnap = await getDoc(eventRef);
          if (cachedSnap.exists()) {
            const customEvt = {
              id: cachedSnap.id,
              ...cachedSnap.data(),
            } as EventDetails;
            setEvent(customEvt);
            setNetworkError(null);
            if (isEditing) {
              setLocalEvent((prev) => {
                if (
                  prev &&
                  JSON.stringify(prev) !== JSON.stringify(customEvt)
                ) {
                  return prev;
                }
                return customEvt as any;
              });
            }
            console.log(
              `[InoEvents GetDoc] Evento ${id} carregado com sucesso.`,
            );
            setFirebaseLoading(false);
          } else {
            // Check if there is local static mock as a last resort
            const staticEv = getEventById(id);
            if (staticEv) {
              setEvent(staticEv as unknown as EventDetails);
              if (isEditing) setLocalEvent(staticEv as unknown as EventDetails);
              setFirebaseLoading(false);
            } else {
              setEvent(null);
              setFirebaseLoading(false);
            }
          }
        } catch (getErr: any) {
          console.warn(
            "[InoEvents Initial GetDoc Failed] Tentando recuperar de listeners ou dados estáticos:",
            getErr,
          );
          // Set network error state so that we know we had connection issues
          setNetworkError(getErr.message || String(getErr));

          // Static mockup fallback
          const staticEv = getEventById(id);
          if (staticEv) {
            setEvent(staticEv as unknown as EventDetails);
            if (isEditing) setLocalEvent(staticEv as unknown as EventDetails);
            setFirebaseLoading(false);
          }
        }

        // 2. Continuous real-time listener for seamless synchronization (without resetting state on network errors)
        unsubscribe = onSnapshot(
          eventRef,
          { includeMetadataChanges: true },
          (docSnap) => {
            if (docSnap.exists()) {
              const customEvt = {
                id: docSnap.id,
                ...docSnap.data(),
              } as EventDetails;
              setEvent(customEvt);
              setNetworkError(null); // Clear errors once we have a fresh snapshot
              if (isEditing) {
                setLocalEvent((prev) => {
                  if (
                    prev &&
                    JSON.stringify(prev) !== JSON.stringify((customEvt as any).draftData || customEvt)
                  ) {
                    return prev;
                  }
                  return (customEvt as any).draftData || customEvt;
                });
              }
            } else {
              const staticEv = getEventById(id);
              if (!staticEv) {
                setEvent(null);
              }
            }
            setFirebaseLoading(false);
          },
          (err) => {
            console.warn(
              "[InoEvents Realtime Listener Warning] Conexão real-time temporariamente indisponível:",
              err,
            );
            // Crucial: DO NOT nullify loaded event on subscription network error!
            // This ensures that any guest who successfully loaded the page doesn't suddenly see a "Not Found" screen
            setFirebaseLoading(false);
          },
        );
      } catch (err) {
        console.error("Erro ao registrar listeners de convite:", err);
        setFirebaseLoading(false);
      }
    };

    fetchEvent();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [id, isEditing, user]);

  // Track Page Views
  useEffect(() => {
    if (!isEditing && event && event.id && !(event as any).isTemplate) {
      const viewedKey = `viewed_${event.id}`;
      if (!sessionStorage.getItem(viewedKey)) {
        sessionStorage.setItem(viewedKey, 'true');
        const today = new Date().toISOString().split('T')[0];
        const eventRef = doc(db, 'events', event.id);
        updateDoc(eventRef, {
          accessCount: increment(1),
          [`dailyAccesses.${today}`]: increment(1)
        }).catch(err => console.warn('Failed to track view:', err));
      }
    }
  }, [isEditing, event?.id, (event as any)?.isTemplate]);

  if (firebaseLoading) {
    return <PremiumLoader />;
  }

  // Active working details is localEvent if editing, else loaded static/saving event
  const activeEvent = isEditing ? localEvent || event : event;

  // Premium Checks
  const isPremium = isTemplate || isEditing || (activeEvent && (activeEvent as any).plan && ((activeEvent as any).plan === 'Premium' || (activeEvent as any).plan === 'Business' || (activeEvent as any).plan === 'Corporate'));

  // Check if event is blocked
  const isPast30Days = activeEvent?.isoDate ? (new Date().getTime() - new Date(activeEvent.isoDate).getTime()) > 30 * 24 * 60 * 60 * 1000 : false;
  const isTemporarilyBlocked = !isEditing && !isTemplate && activeEvent && (
    activeEvent.isBlocked || activeEvent.isPublished === false || 
    (activeEvent.scheduledBlockDate && new Date(activeEvent.scheduledBlockDate) <= new Date()) ||
    (((activeEvent as any).plan === 'Essencial' || !(activeEvent as any).plan) && isPast30Days)
  );

  if (isTemporarilyBlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 font-sans text-center">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl max-w-md shadow-2xl">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">{activeEvent.blockedTitle || "Convite Indisponível"}</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            {activeEvent.blockedMessage || "Este convite encontra-se temporariamente bloqueado ou expirou. Por favor, contacte os anfitriões para mais informações."}
          </p>
        </div>
      </div>
    );
  }
  if (!activeEvent) {
    if (networkError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans text-center">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl max-w-md shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Instabilidade na Conexão</h2>
            <p className="text-slate-400 text-sm mb-6">
              Não conseguimos estabelecer uma conexão estável para carregar os
              detalhes do convite. Por favor, verifique se a sua internet está
              ativa ou tente novamente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 px-6 rounded-2xl transition duration-200 shadow-lg shadow-violet-600/30"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="p-10 text-center font-sans text-gray-500">
        Convite não encontrado.
      </div>
    );
  }

  const guestName = "Família Silva";

  const handleUseTemplate = () => {
    if (!user) {
      toast.error("Por favor, faça login ou crie uma conta para personalizar este modelo!");
      setIsAuthOpen(true);
      return;
    }
    // Elevate templates choice directly to the free interactive builder
    const newId = `evt_${Math.random().toString(36).substr(2, 9)}`;
    navigate(
      `/invite/${newId}?edit=true&new=true&baseId=${activeEvent.id}&template=${activeEvent.layoutMode}&theme=${activeEvent.type}`,
    );
  };

  // Helper values updates
  const updateField = (field: string, value: any) => {
    setLocalEvent((prev) => {
      if (!prev) return null;
      if (field.includes(".")) {
        const [obj, key] = field.split(".") as [string, string];
        const nested = (prev as any)[obj] || {};
        return {
          ...prev,
          [obj]: { ...nested, [key]: value },
        };
      }
      return { ...prev, [field]: value };
    });
  };

  // Timeline list manipulations
  const updateTimelineItem = (
    index: number,
    fld: keyof TimelineItem,
    val: string,
  ) => {
    if (!localEvent) return;
    const list = [...(localEvent.timeline || [])];
    list[index] = { ...list[index], [fld]: val };
    updateField("timeline", list);
  };

  const deleteTimelineItem = (index: number) => {
    if (!localEvent) return;
    const list = (localEvent.timeline || []).filter((_, i) => i !== index);
    updateField("timeline", list);
  };

  const addTimelineItem = () => {
    if (!localEvent) return;
    const items = localEvent.timeline || [];
    const newItem: TimelineItem = {
      time: "18:00",
      title: "Atividade Nova",
      description: "Por favor, descreva essa linda etapa.",
    };
    updateField("timeline", [...items, newItem]);
    toast.success("Atividade nova adicionada!");
  };

  const moveTimelineItem = (index: number, dir: "up" | "down") => {
    if (!localEvent) return;
    const list = [...(localEvent.timeline || [])];
    const targetIdx = dir === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    updateField("timeline", list);
  };

  // Gifts list items manipulations
  const updateGiftItem = (index: number, fld: keyof GiftItem, val: string) => {
    if (!localEvent) return;
    const list = [...(localEvent.gifts || [])];
    list[index] = { ...list[index], [fld]: val };
    updateField("gifts", list);
  };

  const deleteGiftItem = (index: number) => {
    if (!localEvent) return;
    const list = (localEvent.gifts || []).filter((_, i) => i !== index);
    updateField("gifts", list);
  };

  const addGiftItem = () => {
    if (!localEvent) return;
    const list = localEvent.gifts || [];
    const item: GiftItem = {
      type: "IBAN",
      title: "Mimo do Casal",
      value: "AO06 0000 0000...",
      description: "Qualquer carinho é bem vindo!",
    };
    updateField("gifts", [...list, item]);
    toast.success("Item de lista de presentes adicionado!");
  };


  // Save as Draft
  const handleSaveDraft = async () => {
    if (!localEvent) return;
    if (!user) {
      toast.error("Crie uma conta ou faça login para poder salvar!");
      setIsAuthOpen(true);
      return;
    }
    if (!localEvent.title || localEvent.title.trim().length === 0) {
      toast.error("Informe um título para o convite.");
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading("Salvando rascunho...");
    try {
      const eventRef = doc(db, "events", localEvent.id);
      const snap = await getDoc(eventRef);
      const isNewSave = !snap.exists();

      if (isNewSave) {
        // Just create the document directly, it's unpublished until they click 'Publicar'
        const savedPayload = {
          ...localEvent,
          ownerId: user.uid,
          updatedAt: new Date().toISOString(),
          draftData: localEvent,
          isPublished: false
        };
        await setDoc(eventRef, savedPayload);
      } else {
        await updateDoc(eventRef, {
          draftData: localEvent,
          updatedAt: new Date().toISOString(),
        });
      }
      toast.success("Rascunho salvo com sucesso!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar rascunho.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Master billing and save operation
  const handleSaveWorkspace = async () => {
    if (!localEvent) return;

    if (!user) {
      toast.error("Crie uma conta ou faça login para poder salvar!");
      setIsAuthOpen(true);
      return;
    }

    if (!localEvent.title || localEvent.title.trim().length === 0) {
      toast.error("Informe um título para o convite.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Salvando alterações no servidor...");

    try {
      // Check if event already exists to see if credit is charged
      const eventRef = doc(db, "events", localEvent.id);
      const snap = await getDoc(eventRef);
      const isNewSave = !snap.exists();

      if (isNewSave) {
        // Check plan limits (bypass if it's a baby shower or bridal shower template)
        const isBypassLimit = localEvent.type === "BABY_SHOWER" || localEvent.type === "BRIDAL_SHOWER";

        if (
          !isBypassLimit &&
          userProfile?.plan !== "Business" &&
          userProfile?.plan !== "Corporate"
        ) {
          const plan = userProfile?.plan || 'Essencial';
          let limit = 2;
          if (plan === 'Premium') limit = 5;

          const eventsRef = collection(db, 'events');
          const q = query(eventsRef, where("ownerId", "==", user.uid));
          const evSnap = await getDocs(q);
          
          // Exclude baby shower and bridal shower events from counting towards the limits
          const paidCount = evSnap.docs.filter(d => {
            const data = d.data();
            return data.type !== 'BABY_SHOWER' && data.type !== 'BRIDAL_SHOWER';
          }).length;

          if (paidCount >= limit) {
            toast.error(
              `Você atingiu o limite de ${limit} convites de casamento do seu plano. Faça upgrade para criar mais!`,
              { id: toastId },
            );
            setIsSaving(false);
            return;
          }
        }
      }

      // Save document values
      const savedPayload = {
        ...localEvent,
        ownerId: user.uid,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(eventRef, savedPayload);
      toast.success("Seu convite foi publicado com total sucesso!", {
        id: toastId,
      });

      // Clean routing params
      navigate(`/invite/${localEvent.id}?edit=true`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao salvar o convite.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Popup Modal Authentication handler to bypass losing user edits
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isSignUp) {
        // Register new user on firebase client side
        const credential = await createUserWithEmailAndPassword(
          auth,
          authEmail,
          authPassword,
        );
        // Save profile
        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          name: authName || "Noivo(a)",
          email: authEmail,
          plan: "Essencial",
          createdAt: new Date().toISOString(),
        });
        toast.success(`Conta criada!`);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        toast.success(`Bem-vindo de volta!`);
      }
      setIsAuthOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Credenciais inválidas.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Google sign in option
  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      // Create user doc if not found
      const userRef = doc(db, "users", res.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: res.user.uid,
          name: res.user.displayName || "Parceiro(a)",
          email: res.user.email,
          plan: "Essencial",
          createdAt: new Date().toISOString(),
        });
      }
      toast.success("Login com Google efetuado!");
      setIsAuthOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro Google.");
    } finally {
      setAuthLoading(false);
    }
  };

  const proxiedEvent = activeEvent;

  // Gallery modification helpers
  const updateGalleryImage = (index: number, val: string) => {
    setLocalEvent((prev) => {
      if (!prev) return null;
      const list = [...(prev.gallery || [])];
      list[index] = val;
      return { ...prev, gallery: list };
    });
  };

  const deleteGalleryImage = (index: number) => {
    setLocalEvent((prev) => {
      if (!prev) return null;
      const list = (prev.gallery || []).filter((_, i) => i !== index);
      return { ...prev, gallery: list };
    });
  };

  const addGalleryImage = () => {
    const plan = userProfile?.plan || 'Essencial';
    if (plan === 'Essencial' && (localEvent?.gallery?.length || 0) >= 10) {
      toast.error("A Galeria Básica permite até 10 fotos. Faça upgrade para adicionar mais!");
      return;
    }
    setLocalEvent((prev) => {
      if (!prev) return null;
      const list = prev.gallery || [];
      const newImg =
        "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2574&auto=format&fit=crop";
      return { ...prev, gallery: [...list, newImg] };
    });
  };

  // Helpers and sub-components moved out of body to preserve stable hook orders

  // Common Props passed to layouts
  const layoutProps = {
    event: proxiedEvent,
    onRSVP: () => setRSVPOpen(true),
    onCheckStatus: () => setCheckStatusOpen(true),
    guestName,
    isEditing,
    isOpenCover,
    setIsOpenCover,
    onEditSection: (sec: string) => {
      if (sec === "gallery" || sec === "photos") setActiveModal("gallery");
      else if (sec === "hero" || sec === "capa") setActiveModal("hero");
      else if (sec === "gifts" || sec === "contas") setActiveModal("gifts");
      else if (sec === "timeline" || sec === "etapas")
        setActiveModal("timeline");
      else if (sec === "style" || sec === "design") setActiveModal("style");
      else if (sec === "locations" || sec === "locais")
        setActiveModal("locations");
    },
    updateField,
    updateTimelineItem,
    deleteTimelineItem,
    addTimelineItem,
    updateGiftItem,
    deleteGiftItem,
    addGiftItem,
    updateGalleryImage,
    deleteGalleryImage,
    addGalleryImage,
  };

  if (isEditing) {
    return (
      
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative">
        <Joyride
          steps={tourSteps}
          run={runTour}
          continuous={true}
          
          
          
          styles={{
            options: {
              primaryColor: '#3B82F6',
              textColor: '#334155',
              zIndex: 10000,
            },
            tooltip: {
              borderRadius: '16px',
              fontFamily: 'Inter, sans-serif',
              padding: '24px',
            },
            buttonNext: {
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              padding: '8px 16px',
            },
            buttonBack: {
              marginRight: '8px',
              color: '#64748B',
            },
            buttonSkip: {
              color: '#94A3B8',
              fontSize: '14px',
            }
          } as any}
          locale={{
            back: 'Anterior',
            close: 'Fechar',
            last: 'Entendi!',
            next: 'Próximo',
            skip: 'Pular Tour'
          }}
        />

        <SEO 
          title={`Editando: ${activeEvent?.title || "Novo Convite"}`} 
          description="Personalize seu convite digital premium de alta costura com RSVP, cronograma, galeria e muito mais."
          image={activeEvent ? getImageUrl(activeEvent.heroImage) : undefined}
        />
        {/* TOP FLOATING HEADER / ACTIONS (RETRACTABLE LUXURY BAR) */}
        <div
          className={`tour-editor-header fixed top-4 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 ease-in-out ${isEditorBarExpanded ? "w-[95%] md:w-fit max-w-[95vw] md:max-w-4xl translate-y-0" : "w-auto -translate-y-2 hover:translate-y-0"}`}
        >
          <div className="bg-[#0F1419]/95 backdrop-blur-xl border border-[#BF9B30]/30 rounded-full p-2 pr-3 flex items-center justify-between gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            {/* Logo & Toggle */}
            <div
              className="flex items-center gap-2 pl-1 cursor-pointer"
              onClick={() => setIsEditorBarExpanded(!isEditorBarExpanded)}
            >
              <span className="w-8 h-8 rounded-full bg-[#BF9B30] flex items-center justify-center text-[#0F1419] font-black shadow-[0_0_15px_rgba(191,155,48,0.4)] shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  auto_awesome
                </span>
              </span>

              <div
                className={`transition-all duration-300 overflow-hidden flex flex-col ${isEditorBarExpanded ? "w-auto opacity-100 pr-2" : "w-0 opacity-0 hidden md:flex md:w-auto md:opacity-100 md:pr-2"}`}
              >
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#BF9B30] block whitespace-nowrap">
                  Estúdio
                </span>
                <span className="text-[8px] md:text-[9px] text-gray-400 font-medium block whitespace-nowrap tracking-wider">
                  Modo Edição
                </span>
              </div>

              <span className="material-symbols-outlined text-[#BF9B30] transition-all duration-300 shrink-0">
                {isEditorBarExpanded ? "expand_less" : "expand_more"}
              </span>
            </div>

            {/* Actions */}
            <div
              className={`flex items-center gap-1.5 md:gap-2 overflow-hidden transition-all duration-500 ${isEditorBarExpanded ? "max-w-[800px] opacity-100" : "max-w-0 opacity-0 pointer-events-none"}`}
            >
              {((localEvent?.layoutMode || activeEvent?.layoutMode) === "LIMINTSO_GOLD" || (localEvent?.layoutMode || activeEvent?.layoutMode) === "LIMINTSO_ME") && (
                <button
                  type="button"
                  onClick={() => setIsOpenCover(!isOpenCover)}
                  className="px-3 md:px-4 py-2 bg-transparent border border-[#BF9B30]/40 hover:border-[#BF9B30] rounded-full text-[9px] md:text-xs font-bold text-[#BF9B30] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap uppercase tracking-widest hover:bg-[#BF9B30]/5 active:scale-95 shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {isOpenCover ? "auto_stories" : "edit_document"}
                  </span>
                  <span>{isOpenCover ? "Visualizar Capa" : "Visualizar Convite"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setRSVPOpen(true)}
                className="px-3 md:px-4 py-2 bg-transparent border border-white/20 hover:border-[#BF9B30] rounded-full text-[9px] md:text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap uppercase tracking-widest hover:bg-white/5 active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">
                  how_to_reg
                </span>
                <span className="hidden sm:inline">Testar RSVP</span>
                <span className="sm:hidden">RSVP</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="tour-save-draft px-3 md:px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[9px] md:text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 shrink-0"
              >
                Salvar Rascunho
              </button>
              <button
                type="button"
                onClick={handleSaveWorkspace}
                disabled={isSaving}
                className="tour-publish px-3 md:px-5 py-2 bg-[#BF9B30] hover:bg-white text-[#0F1419] text-[9px] md:text-xs font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(191,155,48,0.3)] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isSaving ? (
                  <>
                    <span className="w-3 h-3 border-2 border-[#0F1419] border-t-transparent rounded-full animate-spin"></span>
                    <span>Salvando</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">
                      cloud_upload
                    </span>
                    <span>Publicar Alterações</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/invite/${id}`)}
                className="w-8 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full transition-colors cursor-pointer active:scale-95 ml-0.5 shrink-0"
                title="Sair sem salvar"
              >
                <span className="material-symbols-outlined text-[16px]">
                  close
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* FULL SCREEN WYSIWYG CANVAS */}
        <div className="tour-wysiwyg flex-1 overflow-y-auto bg-slate-100/90 relative pb-36 px-2 md:px-6 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]">
          {<TocaPlayer
            trackName={localEvent?.musicTrack || activeEvent.musicTrack}
            isDark={
              localEvent?.layoutMode === "LUXURY" ||
              localEvent?.layoutMode === "INDUSTRIAL"
            }
          />}

          {localEvent?.layoutMode === "CLASSIC" && (
            <ClassicLayout {...layoutProps} />
          )}
          {localEvent?.layoutMode === "MODERN" && (
            <ModernLayout {...layoutProps} />
          )}
          {localEvent?.layoutMode === "LUXURY" && (
            <LuxuryLayout {...layoutProps} />
          )}
          {localEvent?.layoutMode === "LIMINTSO_GOLD" && (
            <LimintsoGoldLayout {...layoutProps} />
          )}
          {localEvent?.layoutMode === "LIMINTSO_ME" && (
            <LimintsoMeLayout {...layoutProps} />
          )}
          {localEvent?.layoutMode === "GARDEN" && (
            <GardenLayout {...layoutProps} />
          )}
          {localEvent?.layoutMode === "RUSTIC" && (
            <RusticLayout {...layoutProps} />
          )}
          {localEvent?.layoutMode === "INDUSTRIAL" && (
            <IndustrialLayout {...layoutProps} />
          )}
          {localEvent?.layoutMode &&
            localEvent.layoutMode.startsWith("BRIDAL_") && (
              <BridalShowerLayout {...layoutProps} />
            )}
          {localEvent?.layoutMode &&
            localEvent.layoutMode.startsWith("BABY_") && (
              <BabyShowerLayout {...layoutProps} />
            )}
        </div>

        {/* FLOATING SPATIAL CONTROL COCKPIT */}
        <FloatingDesignDock
          localEvent={localEvent}
          updateField={updateField}
          addTimelineItem={addTimelineItem}
          addGiftItem={addGiftItem}
          addGalleryImage={addGalleryImage}
          openModal={setActiveModal}
        />

        {/* DYNAMIC LAYER MODAL OVERLAYS (LUXURIOUS CENTERED DIALOGS) */}
        {activeModal &&
          createPortal(
            <div className="fixed inset-0 bg-[#0F1419]/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
              <div className="bg-[#0F1419] border border-[#BF9B30]/30 rounded-3xl w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden select-none animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="p-5 border-b border-[#BF9B30]/20 flex items-center justify-between bg-[#0F1419]/80 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#BF9B30]">
                      {activeModal === "style"
                        ? "palette"
                        : activeModal === "hero"
                          ? "auto_stories"
                          : activeModal === "gallery"
                            ? "image"
                            : activeModal === "locations"
                              ? "pin_drop"
                              : activeModal === "timeline"
                                ? "schedule"
                                : "volunteer_activism"}
                    </span>
                    <span className="font-bold text-white text-sm uppercase tracking-widest">
                      {activeModal === "style" && "Editar Música de Fundo"}
                      {activeModal === "hero" && "Editar Capa & Textos"}
                      {activeModal === "gallery" && "Editar Galeria de Fotos"}
                      {activeModal === "locations" && "Editar Localizações"}
                      {activeModal === "timeline" && "Editar Cronograma"}
                      {activeModal === "gifts" && "Editar Dress Code & Contas"}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#BF9B30]/20 text-gray-400 hover:text-[#BF9B30] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      close
                    </span>
                  </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-6 overflow-y-auto space-y-6 text-slate-200 text-sm max-h-[70vh]">
                  {/* 1. LAYOUT & STYLE FIELDS */}
                  {activeModal === "style" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#BF9B30] mb-2 uppercase tracking-widest">
                          Música de Fundo
                        </label>
                        <select
                          value={localEvent?.musicTrack || "/audio/oracao_do_amor.m4a"}
                          onChange={(e) =>
                            updateField("musicTrack", e.target.value)
                          }
                          className="w-full bg-[#1A2026] border border-[#BF9B30]/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors appearance-none"
                        >
                          <option value="/audio/oracao_do_amor.m4a">
                            Oração do Amor (Padrão)
                          </option>
                          <option value="romantic_piano.mp3">
                            Piano Romântico
                          </option>
                          <option value="acoustic_guitar.mp3">
                            Violão Acústico Solo
                          </option>
                          <option value="nature_ambient.mp3">
                            Sinfonia da Natureza
                          </option>
                          <option value="chill_lounge.mp3">
                            Lounge Moderno & Calmo
                          </option>
                          <option value="none">Sem música de fundo</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 2. CAPA & TEXTS FIELDS */}
                  {activeModal === "hero" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#BF9B30] mb-2 uppercase tracking-widest">
                            Nomes na Capa (Título)
                          </label>
                          <input
                            type="text"
                            value={localEvent?.title || ""}
                            onChange={(e) =>
                              updateField("title", e.target.value)
                            }
                            className="w-full bg-[#1A2026] border border-[#BF9B30]/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                            placeholder="Ex: João & Maria"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#BF9B30] mb-2 uppercase tracking-widest">
                            Texto da Data
                          </label>
                          <input
                            type="text"
                            value={localEvent?.date || ""}
                            onChange={(e) =>
                              updateField("date", e.target.value)
                            }
                            className="w-full bg-[#1A2026] border border-[#BF9B30]/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                            placeholder="Ex: Sábado, 12 de Outubro de 2026"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#BF9B30] mb-2 uppercase tracking-widest">
                            Data do Countdown (ISO AAAA-MM-DD)
                          </label>
                          <input
                            type="text"
                            value={localEvent?.isoDate || ""}
                            onChange={(e) =>
                              updateField("isoDate", e.target.value)
                            }
                            className="w-full bg-[#1A2026] border border-[#BF9B30]/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                            placeholder="Ex: 2026-10-12"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#BF9B30] mb-2 uppercase tracking-widest">
                          Mensagem de Boas-vindas
                        </label>
                        <textarea
                          value={localEvent?.description || ""}
                          onChange={(e) =>
                            updateField("description", e.target.value)
                          }
                          rows={3}
                          className="w-full bg-[#1A2026] border border-[#BF9B30]/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors custom-scrollbar"
                          placeholder="Uma linda mensagem para seus convidados..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#BF9B30] mb-2 uppercase tracking-widest">
                          Imagem de Capa (Hero Image URL)
                        </label>
                        <input
                          type="text"
                          value={localEvent?.heroImage || ""}
                          onChange={(e) =>
                            updateField("heroImage", e.target.value)
                          }
                          className="w-full bg-[#1A2026] border border-[#BF9B30]/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors text-xs"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateField(
                                "heroImage",
                                "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2574",
                              )
                            }
                            className="px-3 py-1.5 bg-white/5 text-[10px] text-gray-300 rounded hover:bg-[#BF9B30]/20 hover:text-[#BF9B30] transition-colors"
                          >
                            Preset Romântico
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateField(
                                "heroImage",
                                "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2670",
                              )
                            }
                            className="px-3 py-1.5 bg-white/5 text-[10px] text-gray-300 rounded hover:bg-[#BF9B30]/20 hover:text-[#BF9B30] transition-colors"
                          >
                            Preset Alianças
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. GALERIA FIELDS */}
                  {activeModal === "gallery" && (
                    <div className="space-y-4">
                      {/* Section Toggle */}
                      <div className="flex items-center justify-between bg-[#1A2026] p-4 rounded-2xl border border-[#BF9B30]/20 mb-6">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                          {(localEvent?.hiddenSections || []).includes("gallery") ? "Seção Oculta no Convite" : "Seção Visível"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const hs = localEvent?.hiddenSections || [];
                            if (hs.includes("gallery")) {
                              updateField("hiddenSections", hs.filter(s => s !== "gallery"));
                            } else {
                              updateField("hiddenSections", [...hs, "gallery"]);
                              setActiveModal(null);
                            }
                          }}
                          className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all ${
                            (localEvent?.hiddenSections || []).includes("gallery")
                              ? "bg-[#BF9B30]/10 text-[#BF9B30] border border-[#BF9B30]/30 hover:bg-[#BF9B30]/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                          }`}
                        >
                          {(localEvent?.hiddenSections || []).includes("gallery") ? "Mostrar Seção" : "Excluir Seção"}
                        </button>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-xs font-semibold text-[#BF9B30] uppercase tracking-widest">
                            Galeria de Fotos do Casal
                          </label>
                          <button
                            type="button"
                            onClick={addGalleryImage}
                            className="px-3 py-1.5 bg-[#BF9B30]/10 hover:bg-[#BF9B30]/20 border border-[#BF9B30]/30 text-[#BF9B30] text-[10px] font-bold rounded-lg transition-all"
                          >
                            Adicionar Foto
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {(localEvent?.gallery || []).map((img, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-square rounded-xl overflow-hidden group bg-[#1A2026] border border-[#BF9B30]/20"
                            >
                              <img
                                src={typeof img === 'string' ? img : (img as any).url}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                                <button
                                  type="button"
                                  onClick={() => deleteGalleryImage(idx)}
                                  className="w-8 h-8 rounded-full bg-red-600/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                                  title="Eliminar"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    delete
                                  </span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. LOCATIONS FIELDS */}
                  {activeModal === "locations" && (
                    <div className="space-y-6">
                      {/* Section Toggle */}
                      <div className="flex items-center justify-between bg-[#1A2026] p-4 rounded-2xl border border-[#BF9B30]/20 mb-2">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                          {(localEvent?.hiddenSections || []).includes("locations") ? "Seção Oculta no Convite" : "Seção Visível"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const hs = localEvent?.hiddenSections || [];
                            if (hs.includes("locations")) {
                              updateField("hiddenSections", hs.filter(s => s !== "locations"));
                            } else {
                              updateField("hiddenSections", [...hs, "locations"]);
                              setActiveModal(null);
                            }
                          }}
                          className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all ${
                            (localEvent?.hiddenSections || []).includes("locations")
                              ? "bg-[#BF9B30]/10 text-[#BF9B30] border border-[#BF9B30]/30 hover:bg-[#BF9B30]/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                          }`}
                        >
                          {(localEvent?.hiddenSections || []).includes("locations") ? "Mostrar Seção" : "Excluir Seção"}
                        </button>
                      </div>

                      {/* Ceremony details */}
                      <div className="bg-[#1A2026] p-5 rounded-2xl border border-[#BF9B30]/20 space-y-4">
                        <span className="text-xs font-bold text-[#BF9B30] uppercase tracking-widest block">
                          1. Local da Cerimônia
                        </span>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">
                            Nome do Local
                          </label>
                          <input
                            type="text"
                            value={localEvent?.locationName || ""}
                            onChange={(e) =>
                              updateField("locationName", e.target.value)
                            }
                            className="w-full bg-[#0F1419] border border-[#BF9B30]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">
                            Horário
                          </label>
                          <input
                            type="text"
                            value={localEvent?.time || ""}
                            onChange={(e) =>
                              updateField("time", e.target.value)
                            }
                            className="w-full bg-[#0F1419] border border-[#BF9B30]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">
                            Endereço Completo
                          </label>
                          <input
                            type="text"
                            value={localEvent?.address || ""}
                            onChange={(e) =>
                              updateField("address", e.target.value)
                            }
                            className="w-full bg-[#0F1419] border border-[#BF9B30]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">
                            Link Google Maps (Ver Localização)
                          </label>
                          <input
                            type="text"
                            value={localEvent?.mapLink || ""}
                            onChange={(e) =>
                              updateField("mapLink", e.target.value)
                            }
                            className="w-full bg-[#0F1419] border border-[#BF9B30]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors text-xs"
                          />
                        </div>
                      </div>

                      {/* Reception details (Bridal Shower instruction: optionally hide) */}
                      {localEvent?.type !== "BRIDAL_SHOWER" ? (
                        <div className="bg-[#1A2026] p-5 rounded-2xl border border-[#BF9B30]/20 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#BF9B30] uppercase tracking-widest block">
                              2. Recepção / Copo d'Água
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                updateField("receptionName", "");
                                updateField("receptionAddress", "");
                              }}
                              className="text-[10px] text-gray-400 hover:text-red-400"
                            >
                              Remover Recepção
                            </button>
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">
                              Nome do Local da Festa
                            </label>
                            <input
                              type="text"
                              value={localEvent?.receptionName || ""}
                              onChange={(e) =>
                                updateField("receptionName", e.target.value)
                              }
                              className="w-full bg-[#0F1419] border border-[#BF9B30]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                              placeholder="Ex: Quinta Real Eventos"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">
                              Endereço da Festa
                            </label>
                            <input
                              type="text"
                              value={localEvent?.receptionAddress || ""}
                              onChange={(e) =>
                                updateField("receptionAddress", e.target.value)
                              }
                              className="w-full bg-[#0F1419] border border-[#BF9B30]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">
                              Imagem do Local / Mapa (URL)
                            </label>
                            <input
                              type="text"
                              value={localEvent?.mapImage || ""}
                              onChange={(e) =>
                                updateField("mapImage", e.target.value)
                              }
                              className="w-full bg-[#0F1419] border border-[#BF9B30]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors text-xs"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#1A2026]/50 p-4 rounded-2xl border border-dashed border-[#BF9B30]/30 text-center text-xs text-gray-400">
                          ✨ Recepção oculta automaticamente por ser um Chá de
                          Panela.
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. TIMELINE FIELDS */}
                  {activeModal === "timeline" && (
                    <div className="space-y-6">
                      {/* Section Toggle */}
                      <div className="flex items-center justify-between bg-[#1A2026] p-4 rounded-2xl border border-[#BF9B30]/20 mb-2">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                          {(localEvent?.hiddenSections || []).includes("timeline") ? "Seção Oculta no Convite" : "Seção Visível"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const hs = localEvent?.hiddenSections || [];
                            if (hs.includes("timeline")) {
                              updateField("hiddenSections", hs.filter(s => s !== "timeline"));
                            } else {
                              updateField("hiddenSections", [...hs, "timeline"]);
                              setActiveModal(null);
                            }
                          }}
                          className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all ${
                            (localEvent?.hiddenSections || []).includes("timeline")
                              ? "bg-[#BF9B30]/10 text-[#BF9B30] border border-[#BF9B30]/30 hover:bg-[#BF9B30]/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                          }`}
                        >
                          {(localEvent?.hiddenSections || []).includes("timeline") ? "Mostrar Seção" : "Excluir Seção"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#BF9B30] uppercase tracking-widest">
                          Milestones do Cronograma
                        </span>
                        <button
                          type="button"
                          onClick={addTimelineItem}
                          className="px-4 py-2 bg-[#BF9B30] hover:bg-white text-[#0F1419] text-[10px] font-bold rounded-xl flex items-center gap-1.5 shadow-[0_5px_15px_rgba(191,155,48,0.2)] transition-all uppercase tracking-widest"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            add
                          </span>
                          <span>Nova Etapa</span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(localEvent?.timeline || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-[#1A2026] p-5 rounded-2xl border border-[#BF9B30]/20 space-y-4 relative group"
                          >
                            <div className="flex items-center justify-between border-b border-[#BF9B30]/10 pb-3">
                              <span className="text-xs font-black text-[#BF9B30] uppercase tracking-widest">
                                Etapa #{idx + 1}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => moveTimelineItem(idx, "up")}
                                  disabled={idx === 0}
                                  className="w-7 h-7 rounded-lg bg-[#0F1419] text-gray-400 hover:text-[#BF9B30] flex items-center justify-center disabled:opacity-30 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    arrow_upward
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveTimelineItem(idx, "down")}
                                  disabled={
                                    idx ===
                                    (localEvent?.timeline || []).length - 1
                                  }
                                  className="w-7 h-7 rounded-lg bg-[#0F1419] text-gray-400 hover:text-[#BF9B30] flex items-center justify-center disabled:opacity-30 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    arrow_downward
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteTimelineItem(idx)}
                                  className="w-7 h-7 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    delete
                                  </span>
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[9px] text-gray-400 mb-1.5 uppercase tracking-wider">
                                  Horário
                                </label>
                                <input
                                  type="text"
                                  value={item.time}
                                  onChange={(e) =>
                                    updateTimelineItem(
                                      idx,
                                      "time",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-[#0F1419] border border-[#BF9B30]/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[9px] text-gray-400 mb-1.5 uppercase tracking-wider">
                                  Título da Etapa
                                </label>
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) =>
                                    updateTimelineItem(
                                      idx,
                                      "title",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-[#0F1419] border border-[#BF9B30]/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] text-gray-400 mb-1.5 uppercase tracking-wider">
                                Descrição / Subtítulo
                              </label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) =>
                                  updateTimelineItem(
                                    idx,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-[#0F1419] border border-[#BF9B30]/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. DRESS CODE & GIFTS FIELDS */}
                  {activeModal === "gifts" && (
                    <div className="space-y-6">
                      {/* Section Toggle */}
                      <div className="flex items-center justify-between bg-[#1A2026] p-4 rounded-2xl border border-[#BF9B30]/20 mb-2">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                          {(localEvent?.hiddenSections || []).includes("gifts") ? "Seção Oculta no Convite" : "Seção Visível"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const hs = localEvent?.hiddenSections || [];
                            if (hs.includes("gifts")) {
                              updateField("hiddenSections", hs.filter(s => s !== "gifts"));
                            } else {
                              updateField("hiddenSections", [...hs, "gifts"]);
                              setActiveModal(null);
                            }
                          }}
                          className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all ${
                            (localEvent?.hiddenSections || []).includes("gifts")
                              ? "bg-[#BF9B30]/10 text-[#BF9B30] border border-[#BF9B30]/30 hover:bg-[#BF9B30]/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                          }`}
                        >
                          {(localEvent?.hiddenSections || []).includes("gifts") ? "Mostrar Seção" : "Excluir Seção"}
                        </button>
                      </div>

                      {/* Dress code */}
                      {localEvent?.type !== "BRIDAL_SHOWER" && (
                        <div className="bg-[#1A2026] p-5 rounded-2xl border border-[#BF9B30]/20 space-y-4">
                          <span className="text-xs font-bold text-[#BF9B30] uppercase tracking-widest block">
                            1. Dress Code / Sugestão de Traje
                          </span>
                          <div>
                            <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">
                              Descrição do Código de Vestimenta
                            </label>
                            <textarea
                              value={localEvent?.dressCode?.description || ""}
                              onChange={(e) => {
                                const existing = localEvent?.dressCode || {
                                  description: "",
                                  image: "",
                                };
                                updateField("dressCode", {
                                  ...existing,
                                  description: e.target.value,
                                });
                              }}
                              rows={3}
                              className="w-full bg-[#0F1419] border border-[#BF9B30]/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#BF9B30] transition-colors custom-scrollbar"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">
                              Link de Imagem Referência (URL)
                            </label>
                            <input
                              type="text"
                              value={localEvent?.dressCode?.image || ""}
                              onChange={(e) => {
                                const existing = localEvent?.dressCode || {
                                  description: "",
                                  image: "",
                                };
                                updateField("dressCode", {
                                  ...existing,
                                  image: e.target.value,
                                });
                              }}
                              className="w-full bg-[#0F1419] border border-[#BF9B30]/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                            />
                          </div>
                        </div>
                      )}

                      {/* Gifts accounts details */}
                      <div className="bg-[#1A2026] p-5 rounded-2xl border border-[#BF9B30]/20 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-[#BF9B30] uppercase tracking-widest block">
                            2. Lista de Casamento / IBAN / Pix
                          </span>
                          <button
                            type="button"
                            onClick={addGiftItem}
                            className="text-[10px] text-[#BF9B30] hover:text-white font-bold uppercase tracking-wider transition-colors"
                          >
                            + Adicionar Conta
                          </button>
                        </div>

                        {(localEvent?.gifts || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-[#0F1419] p-4 rounded-xl border border-[#BF9B30]/10 space-y-3 relative group"
                          >
                            <button
                              type="button"
                              onClick={() => deleteGiftItem(idx)}
                              className="absolute top-2 right-2 text-gray-500 hover:text-red-400 text-xs transition-colors"
                              title="Excluir"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                delete
                              </span>
                            </button>

                            <div className="grid grid-cols-2 gap-3 pr-6">
                              <div>
                                <label className="block text-[9px] text-gray-400 mb-1 uppercase tracking-wider">
                                  Título (Ex: IBAN, Pix)
                                </label>
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) =>
                                    updateGiftItem(idx, "title", e.target.value)
                                  }
                                  className="w-full bg-[#1A2026] border border-[#BF9B30]/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-gray-400 mb-1 uppercase tracking-wider">
                                  Descrição Curta
                                </label>
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) =>
                                    updateGiftItem(
                                      idx,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-[#1A2026] border border-[#BF9B30]/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] text-gray-400 mb-1 uppercase tracking-wider">
                                Número da Conta / Chave Pix / Link
                              </label>
                              <input
                                type="text"
                                value={item.value}
                                onChange={(e) =>
                                  updateGiftItem(idx, "value", e.target.value)
                                }
                                className="w-full bg-[#1A2026] border border-[#BF9B30]/20 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#BF9B30] transition-colors"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pr-6 mt-3">
                              <div>
                                <label className="block text-[9px] text-gray-400 mb-1 uppercase tracking-wider">
                                  Banco (Opcional)
                                </label>
                                <input
                                  type="text"
                                  value={item.bankName || ""}
                                  onChange={(e) =>
                                    updateGiftItem(
                                      idx,
                                      "bankName",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Ex: BAI, BFA"
                                  className="w-full bg-[#1A2026] border border-[#BF9B30]/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-gray-400 mb-1 uppercase tracking-wider">
                                  Titular (Opcional)
                                </label>
                                <input
                                  type="text"
                                  value={item.accountName || ""}
                                  onChange={(e) =>
                                    updateGiftItem(
                                      idx,
                                      "accountName",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Ex: João e Maria"
                                  className="w-full bg-[#1A2026] border border-[#BF9B30]/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#BF9B30] transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t border-[#BF9B30]/20 bg-[#0F1419]/90 backdrop-blur-md sticky bottom-0 z-10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-6 py-2.5 bg-[#BF9B30] hover:bg-white text-[#0F1419] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_5px_15px_rgba(191,155,48,0.2)] cursor-pointer active:scale-95"
                  >
                    Concluir Edição
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Auth Modal / BottomSheet for secure logins */}
        <BottomSheet
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          title="Fazer Login ou Criar Conta"
        >
          <form
            onSubmit={handleAuthSubmit}
            className="space-y-4 font-sans text-slate-800 p-2"
          >
            <p className="text-sm text-slate-600">
              Para salvar seu convite com total segurança, crie uma conta ou
              faça login de forma rápida e segura.
            </p>
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seu Nome
                </label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                  placeholder="Ex: João e Maria"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                placeholder="Ex: noivos@gmail.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha (mínimo 6 caracteres)
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                placeholder="••••••"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm shadow transition-all disabled:opacity-50"
            >
              {authLoading
                ? "Processando..."
                : isSignUp
                  ? "Criar Conta e Continuar"
                  : "Fazer Login e Continuar"}
            </button>
            <div className="flex items-center justify-between text-xs pt-2 text-slate-500 border-t">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-violet-600 font-semibold hover:underline"
              >
                {isSignUp
                  ? "Já tem conta? Faça login"
                  : "Criar nova conta grátis"}
              </button>
            </div>
          </form>
        </BottomSheet>

        {/* RSVP Modal */}
        <BottomSheet
          isOpen={isRSVPOpen}
          onClose={() => setRSVPOpen(false)}
          title={
            localEvent?.type === "BRIDAL_SHOWER"
              ? "RSVP Chá de Panela"
              : "Sua Presença"
          }
        >
          <RSVPForm
            event={localEvent || event}
            onClose={() => setRSVPOpen(false)}
          />
        </BottomSheet>
      </div>
    );
  }

  return (
    <>
      {/* WELCOME ENVELOPE OVERLAY */}
      <AnimatePresence>
        {!hasOpened && !isEditing && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900 text-white"
            style={{
               backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(' + getImageUrl(activeEvent.heroImage) + ')',
               backgroundSize: 'cover',
               backgroundPosition: 'center',
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-center px-6 flex flex-col items-center max-w-md"
            >
              <span className="material-symbols-outlined text-5xl mb-6 text-brand-gold opacity-80">mail</span>
              <h1 className="font-serif text-3xl md:text-5xl mb-4 font-bold leading-tight">{activeEvent.title}</h1>
              <p className="text-slate-300 mb-10 font-sans text-sm md:text-base tracking-widest uppercase">
                Você tem um convite
              </p>
              <button 
                  onClick={() => {
                      setHasOpened(true);
                      // Trigger audio play if TocaPlayer didn't autoplay
                      const audioEls = document.getElementsByTagName('audio');
                      for (let i = 0; i < audioEls.length; i++) {
                          audioEls[i].play().catch(e => console.log('Audio play failed on open', e));
                      }
                  }}
                  className="bg-white text-slate-900 px-12 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-2xl"
              >
                  Abrir Convite
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <SEO 
        title={activeEvent.title || "Convite Especial"} 
        description={activeEvent.description || "Você foi convidado para o nosso evento especial! Veja os detalhes, localizações e confirme sua presença (RSVP)."}
        image={getImageUrl(activeEvent.heroImage)}
      />
      {<TocaPlayer
        trackName={activeEvent.musicTrack}
        isDark={
          activeEvent.layoutMode === "LUXURY" ||
          activeEvent.layoutMode === "INDUSTRIAL"
        }
      />}

      {/* Dynamic Layout Rendering */}
      {activeEvent.layoutMode === "CLASSIC" && (
        <ClassicLayout {...layoutProps} />
      )}
      {activeEvent.layoutMode === "MODERN" && <ModernLayout {...layoutProps} />}
      {activeEvent.layoutMode === "LUXURY" && <LuxuryLayout {...layoutProps} />}
      {activeEvent.layoutMode === "LIMINTSO_GOLD" && <LimintsoGoldLayout {...layoutProps} />}
      {activeEvent.layoutMode === "LIMINTSO_ME" && <LimintsoMeLayout {...layoutProps} />}
      {activeEvent.layoutMode === "GARDEN" && <GardenLayout {...layoutProps} />}
      {activeEvent.layoutMode === "RUSTIC" && <RusticLayout {...layoutProps} />}
      {activeEvent.layoutMode === "INDUSTRIAL" && (
        <IndustrialLayout {...layoutProps} />
      )}
      {activeEvent.layoutMode.startsWith("BRIDAL_") && (
        <BridalShowerLayout {...layoutProps} />
      )}
      {activeEvent.layoutMode.startsWith("BABY_") && (
        <BabyShowerLayout {...layoutProps} />
      )}

      {/* Floating Demo Template Banner (RETRACTABLE LUXURY BAR) */}
      {isTemplate && user && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-in-out ${isBannerCollapsed ? "w-auto -translate-y-2 hover:translate-y-0" : "w-[95%] md:w-fit max-w-[95vw] md:max-w-4xl translate-y-0"}`}
        >
          <div className="bg-[#0F1419]/95 backdrop-blur-xl border border-[#BF9B30]/30 rounded-full p-2 pr-3 flex items-center justify-between gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            {/* Logo & Toggle */}
            <div
              className="flex items-center gap-2 pl-1 cursor-pointer"
              onClick={() => setIsBannerCollapsed(!isBannerCollapsed)}
            >
              <span className="w-8 h-8 rounded-full bg-[#BF9B30] flex items-center justify-center text-[#0F1419] font-black shadow-[0_0_15px_rgba(191,155,48,0.4)] shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  celebration
                </span>
              </span>

              <div
                className={`transition-all duration-300 overflow-hidden flex flex-col ${!isBannerCollapsed ? "w-auto opacity-100 pr-2" : "w-0 opacity-0 hidden md:flex md:w-auto md:opacity-100 md:pr-2"}`}
              >
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#BF9B30] block whitespace-nowrap">
                  Visualização
                </span>
                <span className="text-[8px] md:text-[9px] text-gray-400 font-medium block whitespace-nowrap tracking-wider">
                  Layout{" "}
                  <span className="text-white">
                    {event?.layoutMode
                      ?.replace("BRIDAL_", "CHÁ ")
                      ?.replace("_", " ")}
                  </span>
                </span>
              </div>

              <span className="material-symbols-outlined text-[#BF9B30] transition-all duration-300 shrink-0">
                {!isBannerCollapsed ? "expand_less" : "expand_more"}
              </span>
            </div>

            {/* Actions */}
            <div
              className={`flex items-center gap-1.5 md:gap-2 overflow-hidden transition-all duration-500 ${!isBannerCollapsed ? "max-w-[800px] opacity-100" : "max-w-0 opacity-0 pointer-events-none"}`}
            >
              <Link
                to="/templates"
                className="px-3 md:px-4 py-2 bg-transparent border border-white/20 hover:border-[#BF9B30] rounded-full text-[9px] md:text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap uppercase tracking-widest hover:bg-white/5 active:scale-95 shrink-0"
              >
                Voltar
              </Link>

              <button
                onClick={handleUseTemplate}
                className="px-3 md:px-5 py-2 bg-[#BF9B30] hover:bg-white text-[#0F1419] text-[9px] md:text-xs font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(191,155,48,0.3)] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">
                  magic_button
                </span>
                <span className="hidden sm:inline">Usar este Modelo</span>
                <span className="sm:hidden">Usar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      
        {/* Check Status Modal */}
        <CheckStatusModal
          isOpen={isCheckStatusOpen}
          onClose={() => setCheckStatusOpen(false)}
          event={activeEvent}
        />

      {/* Shared RSVP Modal */}
      <BottomSheet
        isOpen={isRSVPOpen}
        onClose={() => setRSVPOpen(false)}
        title={
          event?.type === "BRIDAL_SHOWER"
            ? "RSVP Chá de Panela"
            : "Sua Presença"
        }
        themeClasses={
          event?.layoutMode === "LUXURY" || event?.layoutMode === "INDUSTRIAL"
            ? "bg-[#151515] text-white border-t border-gray-700"
            : "bg-white text-slate-900"
        }
      >
        <RSVPForm
          event={activeEvent}
          onClose={() => setRSVPOpen(false)}
        />
      </BottomSheet>
    </>
  );
};

// ============================================================================
// HELPER: ANIMATION WRAPPER (PREMIUM SMOOTH SCROLL)
// Updated for better mobile responsiveness and fluidity
// ============================================================================
const FadeInSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  isHidden?: boolean;
  delay?: number;
}> = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, filter: "blur(6px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, margin: "-100px" }} // Trigger slightly before element is full view
    transition={{
      duration: 2.2, // Much slower and more graceful transition
      ease: [0.16, 1, 0.3, 1], // Slow Out-Expo for premium luxury feel
      delay,
    }}
    className={`will-change-[transform,opacity] ${className}`}
  >
    {children}
  </motion.div>
);

// ============================================================================
// HELPER: COUNTDOWN TIMER
// ============================================================================
const CountdownTimer: React.FC<{ targetDate: string; colorClass?: string }> = ({
  targetDate,
  colorClass = "text-[#BF9B30]",
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };
    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeBox = ({ val, label }: { val: number; label: string }) => (
    <div className="flex flex-col items-center min-w-[60px]">
      <span
        className={`text-2xl md:text-3xl font-serif font-bold tabular-nums ${colorClass}`}
      >
        {val < 10 ? `0${val}` : val}
      </span>
      <span className="text-[10px] uppercase tracking-widest opacity-60 mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex gap-4 md:gap-8 justify-center py-6">
      <TimeBox val={timeLeft.days} label="Dias" />
      <div className="text-xl opacity-30 self-start mt-2">:</div>
      <TimeBox val={timeLeft.hours} label="Hrs" />
      <div className="text-xl opacity-30 self-start mt-2">:</div>
      <TimeBox val={timeLeft.minutes} label="Min" />
    </div>
  );
};

// Helper to get dynamic RSVP text based on event type
const getRSVPText = (
  eventType?: string,
  defaultText = "Confirmar Presença",
) => {
  if (eventType === "BRIDAL_SHOWER") {
    if (defaultText === "Confirmar Presença")
      return "Confirmar Presença no Chá";
    if (
      defaultText === "Vou no Chá!" ||
      defaultText === "RESPONDER" ||
      defaultText === "RSVP"
    )
      return "Vou no Chá!";
    return "RSVP Chá de Panela";
  }
  return defaultText;
};

// ============================================================================
// COMPONENT: INLINE EDITABLE IMAGE WRAPPER
// ============================================================================
const EditableImageWrapper: React.FC<{
  src: string;
  onChange: (newUrl: string) => void;
  isEditing?: boolean;
  className?: string;
  isHidden?: boolean;
  children: React.ReactNode;
}> = ({ src, onChange, isEditing, className = "", children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(src);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempUrl(src);
  }, [src]);

  if (!isEditing) {
    return <>{children}</>;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    try {
      const base64 = await compressImage(e.target.files[0]);
      onChange(base64);
      setTempUrl(base64);
      toast.success("Imagem alterada com sucesso!");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`relative group/image-wrap cursor-pointer ${className}`}>
      {children}

      {/* Floating button on the top-right corner, always visible in edit mode, with high z-index to bypass overlapping issues */}
      <div className="absolute top-4 right-4 z-[95] pointer-events-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(true);
          }}
          className="bg-slate-900/95 hover:bg-[#BF9B30] text-white hover:text-slate-950 px-3.5 py-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
        >
          <span className="material-symbols-outlined text-[16px] text-[#BF9B30]">
            photo_camera
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest font-sans pr-0.5">
            Alterar Foto
          </span>
        </button>
      </div>

      {/* Absolute overlay button to trigger image editing popover */}
      <div
        className="absolute inset-0 bg-black/40 opacity-0 group-hover/image-wrap:opacity-100 transition-opacity flex items-center justify-center z-25 pointer-events-auto cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        <button
          type="button"
          className="bg-[#1A2026] hover:bg-[#BF9B30] text-[#BF9B30] hover:text-[#0F1419] text-[10px] md:text-xs font-bold py-2.5 px-5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 border border-[#BF9B30]/30 uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[16px]">
            photo_camera
          </span>
          <span>Alterar Foto</span>
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 bg-[#0F1419]/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
            <div
              className="bg-[#0F1419] border border-[#BF9B30]/30 rounded-3xl w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-[#BF9B30]/20 flex items-center justify-between bg-[#0F1419]/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#BF9B30] text-[18px]">
                    image
                  </span>
                  <span className="font-bold text-white text-xs uppercase tracking-widest">
                    Alterar Imagem
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#BF9B30]/20 text-gray-400 hover:text-[#BF9B30] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex flex-col gap-6">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-3.5 bg-[#BF9B30] hover:bg-white disabled:opacity-50 text-[#0F1419] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_5px_15px_rgba(191,155,48,0.2)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isUploading ? "hourglass_empty" : "upload"}
                  </span>
                  <span>
                    {isUploading ? "Compactando..." : "Upload do Dispositivo"}
                  </span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="relative flex items-center justify-center mt-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#BF9B30]/20"></div>
                  </div>
                  <div className="relative bg-[#0F1419] px-4 text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                    Ou Cole o Link
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    className="flex-1 bg-[#1A2026] border border-[#BF9B30]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#BF9B30] font-mono transition-colors"
                    placeholder="https://..."
                  />
                  <button
                    onClick={() => {
                      onChange(tempUrl);
                      toast.success("Link da imagem atualizado!");
                      setIsOpen(false);
                    }}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#BF9B30]/20 text-[#BF9B30] flex items-center justify-center transition-all cursor-pointer border border-[#BF9B30]/30 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      check
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

// ============================================================================
// COMPONENT: FLOATING COCKPIT DOCK FOR GLOBAL SETTINGS
// ============================================================================
const FloatingDesignDock: React.FC<{
  localEvent: EventDetails | null;
  updateField: (field: string, value: any) => void;
  addTimelineItem: () => void;
  addGiftItem: () => void;
  addGalleryImage: () => void;
  openModal: (
    modal: "style" | "locations" | "timeline" | "gifts" | "gallery" | "hero",
  ) => void;
}> = ({
  localEvent,
  updateField,
  addTimelineItem,
  addGiftItem,
  addGalleryImage,
  openModal,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"style" | "lists">("style");

  if (!isExpanded) {
    return (
      <div className="fixed bottom-28 right-6 z-50 animate-in fade-in slide-in-from-right-8 duration-500">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white rounded-full py-3.5 px-6 shadow-xl shadow-violet-900/20 flex items-center gap-2 border border-violet-400/30 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span>Adicionar Seções</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 inset-x-4 max-w-lg mx-auto z-50 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-bottom-6 duration-300 select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("style")}
            className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "style"
                ? "text-violet-400 border-violet-500"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            Design & Música
          </button>
          <button
            onClick={() => setActiveTab("lists")}
            className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "lists"
                ? "text-violet-400 border-violet-500"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            Gerenciar Seções
          </button>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center p-1 hover:bg-slate-800 rounded-full"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {activeTab === "style" ? (
        <div className="grid grid-cols-1 gap-3.5 text-xs text-slate-300">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Música de Fundo
            </label>
            <div className="flex flex-col gap-2">
              <select
                value={
                  localEvent?.musicTrack?.startsWith("data:")
                    ? "custom"
                    : localEvent?.musicTrack || "/audio/oracao_do_amor.m4a"
                }
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    updateField("musicTrack", e.target.value);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="/audio/oracao_do_amor.m4a">Oração do Amor (Padrão)</option>
                <option value="romantic_piano.mp3">Piano Romântico</option>
                <option value="acoustic_guitar.mp3">
                  Violão Acústico Solo
                </option>
                <option value="nature_ambient.mp3">Sinfonia da Natureza</option>
                <option value="chill_lounge.mp3">Lounge Moderno & Calmo</option>
                <option value="none">Sem música de fundo</option>
                {localEvent?.musicTrack?.startsWith("data:") && (
                  <option value="custom">Música Personalizada (Upload)</option>
                )}
              </select>

              <label className="flex items-center justify-center gap-2 w-full bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer">
                <span className="material-symbols-outlined text-sm">
                  upload_file
                </span>
                Fazer Upload de Música (.mp3)
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          updateField(
                            "musicTrack",
                            event.target.result as string,
                          );
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => openModal("hero")}
              className="p-3 bg-slate-950 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-800 rounded-xl flex items-center gap-2 justify-center font-bold text-slate-200 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-violet-400">
                auto_stories
              </span>
              <span>Capa & Textos</span>
            </button>
            <button
              onClick={() => openModal("locations")}
              className="p-3 bg-slate-950 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-800 rounded-xl flex items-center gap-2 justify-center font-bold text-slate-200 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-violet-400">
                pin_drop
              </span>
              <span>
                {localEvent?.type === "BRIDAL_SHOWER"
                  ? "Localização"
                  : "Cerimônia"}
              </span>
            </button>
            {localEvent?.type !== "BRIDAL_SHOWER" && (
              <button
                onClick={() => openModal("timeline")}
                className="p-3 bg-slate-950 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-800 rounded-xl flex items-center gap-2 justify-center font-bold text-slate-200 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-violet-400">
                  schedule
                </span>
                <span>Cronograma</span>
              </button>
            )}
            <button
              onClick={() => openModal("gifts")}
              className={`p-3 bg-slate-950 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-800 rounded-xl flex items-center gap-2 justify-center font-bold text-slate-200 transition-all cursor-pointer`}
            >
              <span className="material-symbols-outlined text-sm text-violet-400">
                account_balance_wallet
              </span>
              <span>Presentes</span>
            </button>
            <button
              onClick={() => openModal("gallery")}
              className={`p-3 bg-slate-950 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-800 rounded-xl flex items-center gap-2 justify-center font-bold text-slate-200 transition-all cursor-pointer col-span-2`}
            >
              <span className="material-symbols-outlined text-sm text-violet-400">
                image
              </span>
              <span>Galeria de Fotos</span>
            </button>
          </div>
          <p className="text-[9px] text-slate-500 text-center">
            Você pode abrir os painéis acima para adicionar itens em massa ou
            recuperar secções.
          </p>
        </div>
      )}

      <div className="text-[9px] text-slate-500 text-center leading-normal pt-1.5 border-t border-slate-800/50">
        💡{" "}
        <span className="font-semibold text-slate-400">
          Visualização de Elite:
        </span>{" "}
        Clique em qualquer texto ou foto diretamente no convite para editar na
        hora!
      </div>
    </div>
  );
};

// ============================================================================
// EDITABLE SECTION WRAPPER (Direct Visual Layer Click-to-Edit)
// ============================================================================
const EditableSectionWrapper: React.FC<{
  isEditing?: boolean;
  section: "locations" | "timeline" | "gifts" | "gallery" | "style";
  label: string;
  onEditSection?: (section: any) => void;
  children: React.ReactNode;
  className?: string;
  isHidden?: boolean;
}> = ({
  isEditing,
  section,
  label,
  onEditSection,
  children,
  className = "",
  isHidden = false,
}) => {
  if (isHidden) return null;
  if (!isEditing) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      onClick={(e) => {
        // Only trigger edit modal if user didn't click inside another stopPropagation element
        onEditSection?.(section);
      }}
      className={`relative group/section-layer cursor-pointer border-2 border-dashed border-violet-500/20 hover:border-violet-500/70 bg-white/[0.01] hover:bg-violet-500/[0.03] transition-all duration-300 rounded-[2rem] p-4 md:p-6 my-6 shadow-[0_4px_24px_rgba(139,92,246,0.02)] hover:shadow-[0_12px_36px_rgba(139,92,246,0.1)] active:scale-[0.995] ${className}`}
    >
      {/* Floating Spatial Section Badge */}
      <div className="absolute top-4 right-4 bg-violet-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg opacity-40 group-hover/section-layer:opacity-100 transition-all duration-300 flex items-center gap-1.5 border border-white/15 z-30 select-none pointer-events-none">
        <span className="material-symbols-outlined text-[12px] font-bold">
          edit_note
        </span>
        <span>Editar {label}</span>
      </div>

      {/* Glassmorphic visual outline/glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/[0.01] to-indigo-500/[0.01] group-hover/section-layer:from-violet-500/[0.02] group-hover/section-layer:to-indigo-500/[0.02] transition-all rounded-[2rem] pointer-events-none z-10" />

      {/* Content wrapper */}
      <div className="relative z-20">{children}</div>
    </div>
  );
};

// ============================================================================
// LAYOUT 1: CLASSIC ROMANTIC (Refined)
// ============================================================================
const ClassicLayout: React.FC<{
  event: EventDetails;
  onRSVP: () => void;
  onCheckStatus?: () => void;
guestName: string;
  isEditing?: boolean;
  onEditSection?: (section: any) => void;
  updateField?: (field: string, value: any) => void;
  deleteTimelineItem?: (index: number) => void;
  updateTimelineItem?: (
    index: number,
    field: "time" | "title" | "description",
    value: string,
  ) => void;
}> = ({
  event,
  onRSVP,
  onCheckStatus, isEditing,
  onEditSection,
  updateField,
  deleteTimelineItem,
  updateTimelineItem,
}) => {
  const isPremium = isEditing || (event && EVENTS.some((e) => e.id === event.id)) || (event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate"));
  return (
    <div className="min-h-screen bg-slate-50 font-serif pb-28">
      {/* Formal Header */}
      <div className="bg-white p-6 text-center shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Save the Date
        </p>
      </div>

      {/* Hero Card */}
      <div className="p-4">
        <div className="relative h-[65vh] rounded-t-full rounded-b-[200px] overflow-hidden border-8 border-white shadow-2xl mx-auto max-w-lg">
          <EditableImageWrapper
            src={event.heroImage}
            onChange={(newVal) => updateField?.("heroImage", newVal)}
            isEditing={isEditing}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] hover:scale-110"
              style={{ backgroundImage: `url('${getImageUrl(event.heroImage, { width: 1200, quality: 80 })}')` }}
            />
          </EditableImageWrapper>
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col justify-end items-center pb-24 text-white text-center p-6 pointer-events-none"
          >
            <div className="pointer-events-auto flex flex-col items-center">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 2.0, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl font-script mb-2"
              >
                <EditableField
                  value={event.title}
                  onChange={(newVal) => updateField?.("title", newVal)}
                  isEditing={isEditing}
                  className="text-white text-5xl font-script text-center"
                />
              </motion.h1>
              <div className="w-12 h-px bg-white/60 my-4"></div>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.0, duration: 2.0, ease: [0.16, 1, 0.3, 1] }}
                className="text-xl tracking-widest uppercase"
              >
                <EditableField
                  value={event.date}
                  onChange={(newVal) => updateField?.("date", newVal)}
                  isEditing={isEditing}
                  className="text-white text-xl tracking-widest uppercase text-center"
                />
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-6 mt-8 text-center space-y-12">
        <FadeInSection>
          <p className="text-slate-600 italic text-lg leading-relaxed px-4">
            <EditableField
              value={event.description}
              onChange={(newVal) => updateField?.("description", newVal)}
              isEditing={isEditing}
              className="text-slate-600 italic text-lg leading-relaxed px-4 text-center"
              multiline
            />
          </p>
        </FadeInSection>

        <EditableSectionWrapper
          isEditing={isEditing}
          section="timeline"
          isHidden={(event.hiddenSections || []).includes("timeline")}
          label="Cronograma"
          onEditSection={onEditSection}
        >
          <FadeInSection>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">
              Programação
            </h3>
            <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-slate-200">
              {(event.timeline || []).map((item, idx) => (
                <div
                  key={idx}
                  className="relative group/timeline-item flex flex-col items-center bg-white p-4 rounded-lg shadow-sm z-10 w-[80%] mx-auto border border-slate-100"
                >
                  {isEditing && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTimelineItem?.(idx);
                      }}
                      className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer z-30 opacity-0 group-hover/timeline-item:opacity-100 animate-in fade-in animate-out fade-out"
                      title="Excluir Etapa"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        delete
                      </span>
                    </button>
                  )}
                  <span className="text-brand-blue font-bold text-lg mb-1">
                    <EditableField
                      value={item.time}
                      onChange={(newVal) =>
                        updateTimelineItem?.(idx, "time", newVal)
                      }
                      isEditing={isEditing}
                      className="text-brand-blue font-bold text-lg mb-1 text-center"
                    />
                  </span>
                  <span className="font-bold text-slate-800">
                    <EditableField
                      value={item.title}
                      onChange={(newVal) =>
                        updateTimelineItem?.(idx, "title", newVal)
                      }
                      isEditing={isEditing}
                      className="font-bold text-slate-800 text-center"
                    />
                  </span>
                  <span className="text-xs text-slate-500">
                    <EditableField
                      value={item.description}
                      onChange={(newVal) =>
                        updateTimelineItem?.(idx, "description", newVal)
                      }
                      isEditing={isEditing}
                      className="text-xs text-slate-500 text-center"
                      multiline
                    />
                  </span>
                </div>
              ))}
            </div>
          </FadeInSection>
        </EditableSectionWrapper>

        <EditableSectionWrapper
          isEditing={isEditing}
          section="locations"
          isHidden={(event.hiddenSections || []).includes("locations")}
          label="Localização"
          onEditSection={onEditSection}
        >
          <FadeInSection>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
              <h3 className="font-bold text-xl mb-1 text-slate-800">
                <EditableField
                  value={event.locationName}
                  onChange={(newVal) => updateField?.("locationName", newVal)}
                  isEditing={isEditing}
                  className="font-bold text-xl mb-1 text-slate-800 text-center"
                />
              </h3>
              <p className="text-slate-500 text-sm mb-4">
                <EditableField
                  value={event.address}
                  onChange={(newVal) => updateField?.("address", newVal)}
                  isEditing={isEditing}
                  className="text-slate-500 text-sm mb-4 text-center"
                  multiline
                />
              </p>
              <Button
                onClick={() => window.open(event.mapLink || "#", "_blank")}
                variant="navy"
                fullWidth
                className="text-xs uppercase tracking-widest h-10"
              >
                Ver Mapa
              </Button>
            </div>
          </FadeInSection>
        </EditableSectionWrapper>

        {/* GIFTS */}
        {event.gifts && event.gifts.length > 0 && (
          <EditableSectionWrapper
            isEditing={isEditing}
            section="gifts"
          isHidden={(event.hiddenSections || []).includes("gifts")}
            label="Lista de Presentes"
            onEditSection={onEditSection}
          >
            <FadeInSection>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 flex flex-col items-center text-center">
                <h3 className="font-bold text-xl mb-1 text-slate-800">
                  Presentes
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  <EditableField
                    value={
                      event.gifts?.[0]?.description ||
                      "Sua presença é nosso maior presente."
                    }
                    onChange={(newVal) => {
                      const list = [...(event.gifts || [])];
                      if (list[0]) {
                        list[0] = { ...list[0], description: newVal };
                      } else {
                        list[0] = {
                          type: "IBAN",
                          title: "Presente",
                          description: newVal,
                          value: "",
                        };
                      }
                      updateField?.("gifts", list);
                    }}
                    isEditing={isEditing}
                    className="text-slate-500 text-sm mb-4 text-center"
                    multiline
                  />
                </p>
                {event.gifts?.[0]?.value && (
                  <div className="w-full">
                    <div className="text-xs font-mono text-gray-700 bg-gray-50 border border-dashed border-gray-200 p-2.5 rounded-xl select-all break-all mb-4">
                      <EditableField
                        value={event.gifts[0].value}
                        onChange={(newVal) => {
                          if (updateField) {
                            const newGifts = [...event.gifts!];
                            newGifts[0].value = newVal;
                            updateField("gifts", newGifts);
                          }
                        }}
                        isEditing={isEditing}
                        className="text-xs font-mono text-gray-700 text-center w-full bg-transparent outline-none"
                      />
                      {event.gifts[0].bankName && (
                        <div className="font-sans text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                          {event.gifts[0].bankName}
                        </div>
                      )}
                      {event.gifts[0].accountName && (
                        <div className="font-sans text-[10px] text-gray-500">
                          {event.gifts[0].accountName}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        copyToClipboard(event.gifts?.[0]?.value || "");
                        alert("IBAN Copiado!");
                      }}
                      variant="navy"
                      fullWidth
                      className="text-xs uppercase tracking-widest h-10"
                    >
                      Copiar IBAN
                    </Button>
                  </div>
                )}
              </div>
            </FadeInSection>
          </EditableSectionWrapper>
        )}

        {/* GALLERY */}
        {event.gallery && event.gallery.length > 0 && (
          <EditableSectionWrapper
            isEditing={isEditing}
            section="gallery"
          isHidden={(event.hiddenSections || []).includes("gallery")}
            label="Galeria"
            onEditSection={onEditSection}
          >
            <FadeInSection>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 mt-4">
                Nossa Galeria
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(event.gallery || []).map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square relative rounded-xl overflow-hidden shadow-sm group"
                  >
                    <EditableImageWrapper
                      src={typeof img === 'string' ? img : (img as any).url}
                      onChange={(newVal) =>
                        updateField?.(
                          "gallery",
                          event.gallery?.map((g, gi) =>
                            gi === i ? newVal : g,
                          ),
                        )
                      }
                      isEditing={isEditing}
                      className="w-full h-full"
                    >
                      <img
                        src={getImageUrl(img)}
                        className="w-full h-full object-cover"
                      />
                    </EditableImageWrapper>
                  </div>
                ))}
              </div>
            </FadeInSection>
          </EditableSectionWrapper>
        )}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={onRSVP}
          className="bg-brand-blue text-white px-10 py-4 rounded-full font-sans font-bold shadow-2xl shadow-brand-blue/40 uppercase tracking-widest text-xs hover:scale-105 transition-transform"
        >
          {getRSVPText(event.type)}
        </button>
          {onCheckStatus && <button onClick={onCheckStatus} className="mt-4 sm:mt-0 sm:ml-4 bg-white text-slate-900 border border-slate-200 shadow-lg hover:bg-slate-50 py-4 px-12 rounded-full font-bold uppercase tracking-widest text-sm transition-all w-full sm:w-auto">Meu Convite</button>}
      </div>
    </div>
  );
};

// ============================================================================
// LAYOUT 2: MINIMALIST ETHEREAL (Redesigned Modern)
// High-End, Clean, Airy, with Bible Verse, Gallery, Gifts, etc.
// ============================================================================
const ModernLayout: React.FC<{
  event: EventDetails;
  onRSVP: () => void;
  onCheckStatus?: () => void;
  guestName: string;
  isEditing?: boolean;
  onEditSection?: (section: any) => void;
  updateField?: (field: string, value: any) => void;
  deleteTimelineItem?: (index: number) => void;
  deleteGiftItem?: (index: number) => void;
  updateGalleryImage?: (index: number, val: string) => void;
  deleteGalleryImage?: (index: number) => void;
  updateTimelineItem?: (
    index: number,
    field: "time" | "title" | "description",
    value: string,
  ) => void;
}> = ({
  event,
  onRSVP,
  onCheckStatus,
  guestName,
  isEditing,
  onEditSection,
  updateField,
  deleteTimelineItem,
  deleteGiftItem,
  updateGalleryImage,
  deleteGalleryImage,
  updateTimelineItem,
}) => {
  const isPremium = isEditing || (event && EVENTS.some((e) => e.id === event.id)) || (event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate"));
  // Ethereal Color Palette
  const accentText = "text-[#8A817C]"; // Taupe gray
  const darkText = "text-[#2C2C2C]";
  const bgSoft = "bg-[#F9F9F9]";

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-serif text-[#333] pb-32">
      {/* 1. HERO - Minimalist Split or Overlay */}
      <div className="h-screen w-full p-0">
        <div className="h-full relative w-full overflow-hidden">
          <EditableImageWrapper
            src={event.heroImage}
            onChange={(newVal) => updateField?.("heroImage", newVal)}
            isEditing={isEditing}
            className="absolute inset-0"
          >
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 2.6, ease: "easeInOut" }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${getImageUrl(event.heroImage, { width: 1200, quality: 80 })}')` }}
            />
          </EditableImageWrapper>
          <div className="absolute inset-0 bg-white/30 mix-blend-screen pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FDFDFD] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.8, duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none"
          >
            <div className="border border-[#8A817C]/30 bg-white/80 backdrop-blur-sm p-10 md:p-16 max-w-lg w-full shadow-2xl shadow-gray-200/50 pointer-events-auto">
              <span className="font-display text-[10px] uppercase tracking-[0.4em] text-gray-500 mb-6 block">
                Convite de Casamento
              </span>
              <h1 className="text-5xl md:text-7xl font-serif text-[#1a1a1a] mb-4 leading-tight">
                <EditableField
                  value={event.title}
                  onChange={(newVal) => updateField?.("title", newVal)}
                  isEditing={isEditing}
                  className="text-5xl md:text-7xl font-serif text-[#1a1a1a] leading-tight text-center"
                />
              </h1>
              <div className="w-10 h-px bg-[#C2B280] mx-auto my-6"></div>
              <p className="text-sm font-display uppercase tracking-widest text-gray-600">
                <EditableField
                  value={event.date}
                  onChange={(newVal) => updateField?.("date", newVal)}
                  isEditing={isEditing}
                  className="text-sm font-display uppercase tracking-widest text-gray-600 text-center"
                />
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 2. BIBLE QUOTE & WELCOME */}
      <div className="max-w-2xl mx-auto px-8 -mt-20 relative z-10">
        <FadeInSection className="bg-white p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] text-center">
          <span className="font-script text-4xl text-[#C2B280] mb-4 block">
            Bem-vindos
          </span>
          <p className="text-xl italic font-light leading-relaxed text-gray-600 mb-6">
            <EditableField
              value={event.description}
              onChange={(newVal) => updateField?.("description", newVal)}
              isEditing={isEditing}
              className="text-xl italic font-light leading-relaxed text-gray-600 text-center"
              multiline
            />
          </p>
          <div className="py-4 border-t border-gray-100">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">
              Especialmente para
            </p>
            <p className="text-lg font-bold text-[#2C2C2C] font-display">
              {guestName}
            </p>
          </div>
        </FadeInSection>
      </div>

      {/* 3. COUNTDOWN (Minimal Line) */}
      <FadeInSection className="py-20 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-6">
          Contagem Regressiva
        </p>
        <CountdownTimer
          targetDate={event.isoDate}
          colorClass="text-[#2C2C2C]"
        />
      </FadeInSection>

      {/* 4. DETAILS SECTION (Ceremony & Party) */}
      <EditableSectionWrapper
        isEditing={isEditing}
        section="locations"
          isHidden={(event.hiddenSections || []).includes("locations")}
        label="Localização"
        onEditSection={onEditSection}
        className="max-w-5xl mx-auto px-6 mb-24"
      >
        <div className="space-y-24">
          {/* Ceremony */}
          <FadeInSection className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 aspect-[4/5] bg-gray-100 relative overflow-hidden group">
              <img
                src={getImageUrl("https://images.unsplash.com/photo-1544070274-1b48b1111003?q=80&w=2670&auto=format&fit=crop", { width: 800 })}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 bg-white px-4 py-2 text-xs font-bold tracking-widest uppercase">
                Cerimônia
              </div>
            </div>
            <div className="w-full md:w-1/2 text-center md:text-left space-y-4">
              <h2 className="text-4xl font-serif text-[#1a1a1a]">
                <EditableField
                  value={event.locationName}
                  onChange={(newVal) => updateField?.("locationName", newVal)}
                  isEditing={isEditing}
                  className="text-4xl font-serif text-[#1a1a1a] text-center md:text-left"
                />
              </h2>
              <p className="text-[#C2B280] font-display uppercase tracking-widest text-sm">
                <EditableField
                  value={event.time}
                  onChange={(newVal) => updateField?.("time", newVal)}
                  isEditing={isEditing}
                  className="text-[#C2B280] font-display uppercase tracking-widest text-sm text-center md:text-left"
                />
              </p>
              <p className="text-gray-500 leading-relaxed font-light text-lg">
                <EditableField
                  value={event.address}
                  onChange={(newVal) => updateField?.("address", newVal)}
                  isEditing={isEditing}
                  className="text-gray-500 leading-relaxed font-light text-lg text-center md:text-left"
                  multiline
                />
              </p>
              <button
                onClick={() => window.open(event.mapLink || "#", "_blank")}
                className="mt-4 inline-block border-b border-black pb-1 text-xs font-bold uppercase tracking-widest hover:text-[#C2B280] hover:border-[#C2B280] transition-colors"
              >
                Ver Localização
              </button>
            </div>
          </FadeInSection>

          {/* Reception */}
          {event.receptionName && (
            <FadeInSection className="flex flex-col md:flex-row-reverse items-center gap-12">
              <div className="w-full md:w-1/2 aspect-[4/5] bg-gray-100 relative overflow-hidden group">
                <img
                  src={getImageUrl(event.mapImage, { width: 800 })}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white px-4 py-2 text-xs font-bold tracking-widest uppercase">
                  Recepção
                </div>
              </div>
              <div className="w-full md:w-1/2 text-center md:text-right space-y-4">
                <h2 className="text-4xl font-serif text-[#1a1a1a]">
                  <EditableField
                    value={event.receptionName}
                    onChange={(newVal) =>
                      updateField?.("receptionName", newVal)
                    }
                    isEditing={isEditing}
                    className="text-4xl font-serif text-[#1a1a1a] text-center md:text-right"
                  />
                </h2>
                <p className="text-[#C2B280] font-display uppercase tracking-widest text-sm">
                  Após a cerimônia
                </p>
                <p className="text-gray-500 leading-relaxed font-light text-lg">
                  <EditableField
                    value={event.receptionAddress}
                    onChange={(newVal) =>
                      updateField?.("receptionAddress", newVal)
                    }
                    isEditing={isEditing}
                    className="text-gray-500 leading-relaxed font-light text-lg text-center md:text-right"
                    multiline
                  />
                </p>
                <button
                  onClick={() =>
                    window.open(
                      `https://maps.google.com/?q=${event.receptionAddress}`,
                      "_blank",
                    )
                  }
                  className="mt-4 inline-block border-b border-black pb-1 text-xs font-bold uppercase tracking-widest hover:text-[#C2B280] hover:border-[#C2B280] transition-colors"
                >
                  Ver Localização
                </button>
              </div>
            </FadeInSection>
          )}
        </div>
      </EditableSectionWrapper>

      {/* 5. TIMELINE (Clean Vertical) */}
      <EditableSectionWrapper
        isEditing={isEditing}
        section="timeline"
          isHidden={(event.hiddenSections || []).includes("timeline")}
        label="Cronograma"
        onEditSection={onEditSection}
        className="bg-[#F4F4F4] py-24 px-6 my-10"
      >
        <div>
          <div className="max-w-xl mx-auto text-center mb-12">
            <h3 className="text-3xl font-serif italic text-[#1a1a1a]">
              Nosso Dia
            </h3>
          </div>
          <div className="max-w-md mx-auto space-y-12 relative before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-gray-300">
            {(event.timeline || []).map((item, i) => (
              <div
                key={i}
                className="relative flex items-center justify-between"
              >
                <div
                  className={`w-[45%] ${i % 2 === 0 ? "text-right" : "order-last text-left"}`}
                >
                  <h4 className="font-serif text-xl">
                    <EditableField
                      value={item.title}
                      onChange={(newVal) =>
                        updateTimelineItem?.(i, "title", newVal)
                      }
                      isEditing={isEditing}
                      className={`font-serif text-xl text-center ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}
                    />
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 font-display uppercase tracking-wider">
                    <EditableField
                      value={item.description}
                      onChange={(newVal) =>
                        updateTimelineItem?.(i, "description", newVal)
                      }
                      isEditing={isEditing}
                      className={`text-xs text-gray-500 mt-1 font-display uppercase tracking-wider text-center ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}
                      multiline
                    />
                  </p>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-[#C2B280] rounded-full border-4 border-[#F4F4F4]"></div>
                <div
                  className={`w-[45%] ${i % 2 === 0 ? "text-left" : "text-right"}`}
                >
                  <span className="font-display font-bold text-[#C2B280]">
                    <EditableField
                      value={item.time}
                      onChange={(newVal) =>
                        updateTimelineItem?.(i, "time", newVal)
                      }
                      isEditing={isEditing}
                      className={`font-display font-bold text-[#C2B280] text-center ${i % 2 === 0 ? "md:text-left" : "md:text-right"}`}
                    />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </EditableSectionWrapper>

      {/* 6. DRESS CODE & TIPS */}
      <EditableSectionWrapper
        isEditing={isEditing}
        section="gifts"
          isHidden={(event.hiddenSections || []).includes("gifts")}
        label="Dress Code & Contas"
        onEditSection={onEditSection}
        className="grid md:grid-cols-2 max-w-6xl mx-auto w-full py-12"
      >
        <div className="contents">
          <FadeInSection className="bg-white p-16 md:p-24 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-100 w-full">
            <span className="material-symbols-outlined text-4xl text-[#C2B280] mb-6">
              checkroom
            </span>
            <h3 className="text-2xl font-serif mb-4">Dress Code</h3>
            <p className="text-gray-500 leading-relaxed max-w-sm mb-6">
              <EditableField
                value={event.dressCode?.description || "Traje Passeio Completo"}
                onChange={(newVal) =>
                  updateField?.("dressCode", {
                    ...event.dressCode,
                    description: newVal,
                  })
                }
                isEditing={isEditing}
                className="text-gray-500 leading-relaxed max-w-sm mb-6 text-center"
                multiline
              />
            </p>
            {event.dressCode?.image && (
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 grayscale opacity-80">
                <img
                  src={event.dressCode.image}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </FadeInSection>

          <FadeInSection className="bg-white p-16 md:p-24 flex flex-col items-center justify-center text-center w-full">
            <span className="material-symbols-outlined text-4xl text-[#C2B280] mb-6">
              featured_seasonal_and_gifts
            </span>
            <h3 className="text-2xl font-serif mb-4">Lista de Presentes</h3>
            <p className="text-gray-500 leading-relaxed max-w-sm mb-8">
              <EditableField
                value={
                  event.gifts?.[0]?.description ||
                  "Sua presença é nosso maior presente."
                }
                onChange={(newVal) => {
                  const list = [...(event.gifts || [])];
                  if (list[0]) {
                    list[0] = { ...list[0], description: newVal };
                  } else {
                    list[0] = { type: "IBAN", title: "Presente", description: newVal, value: "" };
                  }
                  updateField?.("gifts", list);
                }}
                isEditing={isEditing}
                className="text-gray-500 leading-relaxed max-w-sm text-center"
                multiline
              />
            </p>
            {event.gifts && event.gifts.length > 0 && (
              <div className="flex flex-col items-center gap-4">
                {event.gifts?.[0]?.value && (
                  <p className="text-xs font-mono text-gray-700 bg-gray-50 border border-dashed border-gray-200 p-2.5 rounded-xl select-all max-w-[280px] break-all flex flex-col items-center">
                    <EditableField
                      value={event.gifts[0].value}
                      onChange={(newVal) => {
                        if (updateField) {
                          const newGifts = [...event.gifts!];
                          newGifts[0].value = newVal;
                          updateField("gifts", newGifts);
                        }
                      }}
                      isEditing={isEditing}
                      className="text-xs font-mono text-gray-700 text-center w-full bg-transparent outline-none"
                    />
                    {event.gifts[0].bankName && (
                      <span className="font-sans text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                        {event.gifts[0].bankName}
                      </span>
                    )}
                    {event.gifts[0].accountName && (
                      <span className="font-sans text-[10px] text-gray-500">
                        {event.gifts[0].accountName}
                      </span>
                    )}
                  </p>
                )}
                <button
                  onClick={() => {
                    copyToClipboard(event.gifts?.[0]?.value || "");
                    alert("IBAN Copiado!");
                  }}
                  className="px-8 py-3 bg-[#2C2C2C] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#C2B280] transition-colors"
                >
                  Copiar IBAN
                </button>
              </div>
            )}
          </FadeInSection>
        </div>
      </EditableSectionWrapper>

      {/* 7. GALLERY (Masonry-ish) */}
      {event.gallery && (
        <FadeInSection className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {(event.gallery || []).map((img, i) => (
              <div
                key={i}
                className="aspect-square relative group/gallery-item overflow-hidden"
              >
                <EditableImageWrapper
                  src={typeof img === 'string' ? img : (img as any).url}
                  onChange={(newVal) => updateGalleryImage?.(i, newVal)}
                  isEditing={isEditing}
                  className="w-full h-full"
                >
                  <img
                    src={getImageUrl(img)}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                </EditableImageWrapper>
                {isEditing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGalleryImage?.(i);
                    }}
                    className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer z-30 opacity-0 group-hover/gallery-item:opacity-100 animate-in fade-in"
                    title="Excluir Foto"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      delete
                    </span>
                  </button>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </FadeInSection>
      )}

      {/* FOOTER ACTION */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={onRSVP}
          className="bg-white text-[#1a1a1a] px-10 py-4 rounded-full font-display font-bold text-xs uppercase tracking-widest shadow-2xl hover:bg-[#1a1a1a] hover:text-white transition-colors duration-300 flex items-center gap-2 border border-gray-100"
        >
          <span>{getRSVPText(event.type)}</span>
        </button>
          {onCheckStatus && <button onClick={onCheckStatus} className="mt-4 sm:mt-0 sm:ml-4 bg-white text-slate-900 border border-slate-200 shadow-lg hover:bg-slate-50 py-4 px-12 rounded-full font-bold uppercase tracking-widest text-sm transition-all w-full sm:w-auto">Meu Convite</button>}
      </div>
    </div>
  );
};

// ============================================================================
// LAYOUT 3: GARDEN ELEGANCE (New Model)
// Soft, Floral, Serif, Comprehensive features (Bible, Gallery, etc.)
// ============================================================================
const GardenLayout: React.FC<{
  event: EventDetails;
  onRSVP: () => void;
  onCheckStatus?: () => void;
  guestName: string;
  isEditing?: boolean;
  onEditSection?: (section: any) => void;
  updateField?: (field: string, value: any) => void;
  deleteTimelineItem?: (index: number) => void;
  deleteGiftItem?: (index: number) => void;
  updateGalleryImage?: (index: number, val: string) => void;
  deleteGalleryImage?: (index: number) => void;
  updateTimelineItem?: (
    index: number,
    field: "time" | "title" | "description",
    value: string,
  ) => void;
}> = ({
  event,
  onRSVP,
  onCheckStatus,
  guestName,
  isEditing,
  onEditSection,
  updateField,
  deleteTimelineItem,
  deleteGiftItem,
  updateGalleryImage,
  deleteGalleryImage,
  updateTimelineItem,
}) => {
  const isPremium = isEditing || (event && EVENTS.some((e) => e.id === event.id)) || (event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate"));
  const accentColor = "text-[#5D6D55]"; // Sage green
  const accentBg = "bg-[#5D6D55]";

  return (
    <div className="min-h-screen bg-[#F9F6F2] font-serif text-[#4A4A4A] pb-28 overflow-x-hidden selection:bg-[#D6CFC7]">
      {/* 1. HERO WITH OVERLAY */}
      <div className="">
        <div className="relative h-[85vh] w-full overflow-hidden">
          <EditableImageWrapper
            src={event.heroImage}
            onChange={(newVal) => updateField?.("heroImage", newVal)}
            isEditing={isEditing}
            className="absolute inset-0"
          >
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, ease: "linear" }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${getImageUrl(event.heroImage, { width: 1200, quality: 80 })}')` }}
            />
          </EditableImageWrapper>
          <div className="absolute inset-0 bg-white/20 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F9F6F2] via-transparent to-transparent h-40 bottom-0 top-auto pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.8, duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 drop-shadow-sm pointer-events-none"
          >
            <div className="bg-white/70 backdrop-blur-sm p-8 px-10 rounded-t-[100px] rounded-b-[100px] shadow-xl border border-white pointer-events-auto">
              <p
                className={`text-xs uppercase tracking-[0.3em] mb-4 ${accentColor} font-sans`}
              >
                O Casamento de
              </p>
              <h1 className="text-5xl md:text-6xl font-script text-[#2C2C2C] mb-2 leading-tight">
                <EditableField
                  value={event.title}
                  onChange={(newVal) => updateField?.("title", newVal)}
                  isEditing={isEditing}
                  className="text-5xl md:text-6xl font-script text-[#2C2C2C] leading-tight text-center"
                />
              </h1>
              <p className="mt-4 font-sans text-sm uppercase tracking-widest text-gray-500">
                <EditableField
                  value={event.date}
                  onChange={(newVal) => updateField?.("date", newVal)}
                  isEditing={isEditing}
                  className="mt-4 font-sans text-sm uppercase tracking-widest text-gray-500 text-center"
                />
              </p>
            </div>
          </motion.div>
        </div>

        {/* 2. BIBLE QUOTE & WELCOME */}
        <div className="max-w-2xl mx-auto px-6 -mt-10 relative z-10 text-center">
          <FadeInSection>
            <div className="mb-8">
              <span className="material-symbols-outlined text-4xl text-[#D6CFC7]">
                format_quote
              </span>
              <p className="text-xl md:text-2xl italic font-medium leading-relaxed mt-2 text-[#5D5C61]">
                <EditableField
                  value={event.description}
                  onChange={(newVal) => updateField?.("description", newVal)}
                  isEditing={isEditing}
                  className="text-xl md:text-2xl italic font-medium leading-relaxed mt-2 text-[#5D5C61] text-center"
                  multiline
                />
              </p>
              {!isEditing && event.description.includes("(") && (
                <p className="text-sm font-sans uppercase tracking-widest mt-4 text-[#8C8C8C]">
                  {event.description.split("(")[1].replace(")", "")}
                </p>
              )}
            </div>

            <div className="w-px h-16 bg-[#D6CFC7] mx-auto mb-8"></div>

            <div className="font-sans">
              <p className="uppercase tracking-[0.2em] text-xs text-[#8C8C8C] mb-2">
                Convidado Especial
              </p>
              <p className="text-2xl font-serif text-[#2C2C2C]">{guestName}</p>
            </div>
          </FadeInSection>
        </div>
      </div>

      {/* 3. COUNTDOWN */}
      <FadeInSection className="mt-16 bg-white py-12 px-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border-y border-[#EAE5DF]">
        <p className="text-center font-sans text-xs uppercase tracking-[0.2em] mb-2 text-[#8C8C8C]">
          Falta Pouco
        </p>
        <CountdownTimer
          targetDate={event.isoDate}
          colorClass="text-[#5D5C61]"
        />
      </FadeInSection>

      {/* 4. LOCATIONS (Ceremony & Reception) */}
      <EditableSectionWrapper
        isEditing={isEditing}
        section="locations"
          isHidden={(event.hiddenSections || []).includes("locations")}
        label="Locais"
        onEditSection={onEditSection}
        className="max-w-4xl mx-auto px-6 py-16 block"
      >
        <div className="space-y-16">
          <FadeInSection className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-right order-2 md:order-1">
              <span
                className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white mb-4 ${accentBg} uppercase tracking-widest`}
              >
                Cerimônia
              </span>
              <h3 className="text-3xl font-serif mb-2">
                <EditableField
                  value={event.locationName}
                  onChange={(newVal) => updateField?.("locationName", newVal)}
                  isEditing={isEditing}
                  className="text-3xl font-serif mb-2 text-center md:text-right"
                />
              </h3>
              <p className="text-[#8C8C8C] font-sans text-sm mb-1">
                <EditableField
                  value={event.time}
                  onChange={(newVal) => updateField?.("time", newVal)}
                  isEditing={isEditing}
                  className="text-[#8C8C8C] font-sans text-sm mb-1 text-center md:text-right"
                />
              </p>
              <p className="text-[#5D5C61] mb-6 leading-relaxed">
                <EditableField
                  value={event.address}
                  onChange={(newVal) => updateField?.("address", newVal)}
                  isEditing={isEditing}
                  className="text-[#5D5C61] mb-6 leading-relaxed text-center md:text-right"
                  multiline
                />
              </p>
              <button
                onClick={() => window.open(event.mapLink || "#", "_blank")}
                className={`text-xs font-bold border-b border-[#2C2C2C] pb-0.5 hover:opacity-50 transition-opacity uppercase tracking-widest`}
              >
                Ver no Mapa
              </button>
            </div>
            <div className="flex-1 order-1 md:order-2">
              <div className="aspect-[3/4] rounded-t-[100px] overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1544070274-1b48b1111003?q=80&w=2670&auto=format&fit=crop"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </FadeInSection>

          {event.receptionName && (
            <FadeInSection className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="aspect-[3/4] rounded-t-[100px] overflow-hidden shadow-lg">
                  <img
                    src={event.mapImage}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white mb-4 ${accentBg} uppercase tracking-widest`}
                >
                  Recepção
                </span>
                <h3 className="text-3xl font-serif mb-2">
                  <EditableField
                    value={event.receptionName}
                    onChange={(newVal) =>
                      updateField?.("receptionName", newVal)
                    }
                    isEditing={isEditing}
                    className="text-3xl font-serif mb-2 text-center md:text-left"
                  />
                </h3>
                <p className="text-[#8C8C8C] font-sans text-sm mb-1">
                  Após a cerimônia
                </p>
                <p className="text-[#5D5C61] mb-6 leading-relaxed">
                  <EditableField
                    value={event.receptionAddress}
                    onChange={(newVal) =>
                      updateField?.("receptionAddress", newVal)
                    }
                    isEditing={isEditing}
                    className="text-[#5D5C61] mb-6 leading-relaxed text-center md:text-left"
                    multiline
                  />
                </p>
                <button
                  onClick={() =>
                    window.open(
                      `https://maps.google.com/?q=${event.receptionAddress}`,
                      "_blank",
                    )
                  }
                  className={`text-xs font-bold border-b border-[#2C2C2C] pb-0.5 hover:opacity-50 transition-opacity uppercase tracking-widest`}
                >
                  Ver no Mapa
                </button>
              </div>
            </FadeInSection>
          )}
        </div>
      </EditableSectionWrapper>

      {/* 5. TIMELINE (Elegant Vertical) */}
      <EditableSectionWrapper
        isEditing={isEditing}
        section="timeline"
          isHidden={(event.hiddenSections || []).includes("timeline")}
        label="Cronograma"
        onEditSection={onEditSection}
      >
        <FadeInSection className="bg-white py-20 px-6 border-y border-[#EAE5DF]">
          <div className="max-w-lg mx-auto">
            <h3 className="text-center font-serif text-3xl mb-12 italic">
              Cronograma
            </h3>
            <div className="space-y-10 relative pl-8 border-l border-[#EAE5DF]">
              {(event.timeline || []).map((item, i) => (
                <div key={i} className="relative">
                  <div
                    className={`absolute -left-[37px] top-1 w-4 h-4 rounded-full border-4 border-white ${accentBg} shadow-sm`}
                  ></div>
                  <span className="text-xs font-bold font-sans text-[#8C8C8C] block mb-1">
                    <EditableField
                      value={item.time}
                      onChange={(newVal) =>
                        updateTimelineItem?.(i, "time", newVal)
                      }
                      isEditing={isEditing}
                      className="text-xs font-bold font-sans text-[#8C8C8C] text-left"
                    />
                  </span>
                  <h4 className="text-xl font-serif text-[#2C2C2C] mb-1">
                    <EditableField
                      value={item.title}
                      onChange={(newVal) =>
                        updateTimelineItem?.(i, "title", newVal)
                      }
                      isEditing={isEditing}
                      className="text-xl font-serif text-[#2C2C2C] text-left"
                    />
                  </h4>
                  <p className="text-sm text-[#5D5C61] font-light">
                    <EditableField
                      value={item.description}
                      onChange={(newVal) =>
                        updateTimelineItem?.(i, "description", newVal)
                      }
                      isEditing={isEditing}
                      className="text-sm text-[#5D5C61] font-light text-left"
                      multiline
                    />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>
      </EditableSectionWrapper>

      {/* 6. GALLERY (Grid Layout) */}
      {event.gallery && (
        <EditableSectionWrapper
          isEditing={isEditing}
          section="gallery"
          isHidden={(event.hiddenSections || []).includes("gallery")}
          label="Galeria"
          onEditSection={onEditSection}
        >
          <FadeInSection className="py-20 px-4 max-w-5xl mx-auto">
            <h3 className="text-center font-sans text-xs uppercase tracking-[0.2em] mb-8 text-[#8C8C8C]">
              Momentos Especiais
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
              {(event.gallery || []).map((img, i) => (
                <div
                  key={i}
                  className={`rounded-lg overflow-hidden shadow-sm ${i === 0 ? "col-span-2 row-span-2" : ""}`}
                >
                  <img
                    src={getImageUrl(img)}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              ))}
            </div>
          </FadeInSection>
        </EditableSectionWrapper>
      )}

      {/* 7. GIFTS & DRESS CODE */}
      <EditableSectionWrapper
        isEditing={isEditing}
        section="gifts"
          isHidden={(event.hiddenSections || []).includes("gifts")}
        label="Lista de Presentes & Trajes"
        onEditSection={onEditSection}
        className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto px-6 mb-24 block"
      >
        {event.dressCode && (
          <FadeInSection className="bg-white p-8 rounded-2xl shadow-sm border border-[#EAE5DF] text-center flex flex-col justify-center">
            <span className="material-symbols-outlined text-3xl mb-4 text-[#8C8C8C]">
              styler
            </span>
            <h4 className="text-lg font-serif font-bold mb-2">Dress Code</h4>
            <p className="text-sm text-[#5D5C61]">
              <EditableField
                value={event.dressCode?.description || ""}
                onChange={(newVal) => {
                  updateField?.("dressCode", {
                    ...event.dressCode,
                    description: newVal,
                  });
                }}
                isEditing={isEditing}
                className="text-sm text-[#5D5C61] text-center"
                multiline
              />
            </p>
          </FadeInSection>
        )}

        {event.gifts && (
          <FadeInSection className="bg-white p-8 rounded-2xl shadow-sm border border-[#EAE5DF] text-center flex flex-col justify-center">
            <span className="material-symbols-outlined text-3xl mb-4 text-[#8C8C8C]">
              card_giftcard
            </span>
            <h4 className="text-lg font-serif font-bold mb-2">
              Lista de Presentes
            </h4>
            <p className="text-sm text-[#5D5C61] mb-4">
              <EditableField
                value={event.gifts?.[0]?.description || ""}
                onChange={(newVal) => {
                  const newGifts = [...(event.gifts || [])];
                  if (newGifts[0]) {
                    newGifts[0] = { ...newGifts[0], description: newVal };
                  } else {
                    newGifts[0] = { type: "IBAN", title: "Presentes", value: "", description: newVal, };
                  }
                  updateField?.("gifts", newGifts);
                }}
                isEditing={isEditing}
                className="text-sm text-[#5D5C61] text-center"
                multiline
              />
            </p>
            <button
              onClick={() => {
                copyToClipboard(event.gifts?.[0]?.value || "");
                alert("IBAN Copiado!");
              }}
              className={`px-6 py-2 rounded-full border border-[#D6CFC7] text-xs font-bold uppercase tracking-widest hover:bg-[#F9F6F2] transition-colors mt-auto w-fit mx-auto`}
            >
              Copiar IBAN
            </button>
            {event.gifts?.[0]?.value && (
              <p className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded-xl mt-4 select-all max-w-[280px] mx-auto break-all flex flex-col items-center w-full">
                <EditableField
                  value={event.gifts[0].value}
                  onChange={(newVal) => {
                    if (updateField) {
                      const newGifts = [...event.gifts!];
                      newGifts[0].value = newVal;
                      updateField("gifts", newGifts);
                    }
                  }}
                  isEditing={isEditing}
                  className="text-xs font-mono text-gray-600 text-center w-full bg-transparent outline-none"
                />
                {event.gifts[0].bankName && (
                  <span className="font-sans text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                    {event.gifts[0].bankName}
                  </span>
                )}
                {event.gifts[0].accountName && (
                  <span className="font-sans text-[10px] text-gray-400">
                    {event.gifts[0].accountName}
                  </span>
                )}
              </p>
            )}
          </FadeInSection>
        )}
      </EditableSectionWrapper>

      {/* FIXED BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-[#EAE5DF] p-4 z-50 flex items-center justify-center">
        <Button
          onClick={onRSVP}
          className={`w-full max-w-md ${accentBg} text-white font-sans font-bold uppercase tracking-widest text-xs py-4 shadow-lg flex items-center justify-center gap-2 hover:opacity-90`}
        >
          <span>{getRSVPText(event.type)}</span>
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// LAYOUT 4: RUSTIC CHIC (Warm, Texture, Nature)
// ============================================================================
const RusticLayout: React.FC<{
  event: EventDetails;
  onRSVP: () => void;
  onCheckStatus?: () => void;
  guestName: string;
  isEditing?: boolean;
  onEditSection?: (section: any) => void;
  updateField?: (field: string, value: any) => void;
  deleteTimelineItem?: (index: number) => void;
  deleteGiftItem?: (index: number) => void;
  updateGalleryImage?: (index: number, val: string) => void;
  deleteGalleryImage?: (index: number) => void;
  updateTimelineItem?: (
    index: number,
    field: "time" | "title" | "description",
    value: string,
  ) => void;
}> = ({
  event,
  onRSVP,
  onCheckStatus,
  guestName,
  isEditing,
  onEditSection,
  updateField,
  deleteTimelineItem,
  deleteGiftItem,
  updateGalleryImage,
  deleteGalleryImage,
  updateTimelineItem,
}) => {
  const isPremium = isEditing || (event && EVENTS.some((e) => e.id === event.id)) || (event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate"));
  const warmText = "text-[#5D4037]"; // Dark warm brown
  const lightText = "text-[#8D6E63]"; // Lighter brown
  const bgPaper = "bg-[#FDF5E6]"; // Old Lace / Paper

  return (
    <div
      className={`min-h-screen ${bgPaper} font-serif text-[#4E342E] pb-28 overflow-x-hidden`}
    >
      {/* HERO & INTRO */}
      <div className="">
        {/* HERO: Framed Image */}
        <div className="p-4 md:p-8">
          <div className="relative h-[75vh] w-full rounded-[40px] overflow-hidden border-8 border-white shadow-xl">
            <EditableImageWrapper
              src={event.heroImage}
              onChange={(newVal) => updateField?.("heroImage", newVal)}
              isEditing={isEditing}
              className="absolute inset-0"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${getImageUrl(event.heroImage, { width: 1200, quality: 80 })}')` }}
              />
            </EditableImageWrapper>
            <div className="absolute inset-0 bg-gradient-to-t from-[#4E342E]/80 via-transparent to-transparent pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="absolute bottom-0 w-full p-8 md:p-16 text-center text-[#FDF5E6] pointer-events-none"
            >
              <div className="pointer-events-auto">
                <p className="uppercase tracking-[0.3em] text-xs mb-2">
                  Save the Date
                </p>
                <h1 className="text-5xl md:text-7xl font-script mb-2">
                  <EditableField
                    value={event.title}
                    onChange={(newVal) => updateField?.("title", newVal)}
                    isEditing={isEditing}
                    className="text-5xl md:text-7xl font-script text-white text-center"
                  />
                </h1>
                <p className="text-lg">
                  <EditableField
                    value={event.date}
                    onChange={(newVal) => updateField?.("date", newVal)}
                    isEditing={isEditing}
                    className="text-lg text-white text-center"
                  />
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* INTRO & BIBLE */}
        <FadeInSection className="max-w-2xl mx-auto text-center px-6 py-12">
          <span className="material-symbols-outlined text-4xl text-[#A1887F] mb-4">
            forest
          </span>
          <p className="text-xl md:text-2xl font-script leading-relaxed text-[#5D4037] mb-6">
            {isEditing ? (
              <EditableField
                value={event.description}
                onChange={(newVal) => updateField?.("description", newVal)}
                isEditing={isEditing}
                className="text-xl md:text-2xl font-script leading-relaxed text-[#5D4037] text-center"
                multiline
              />
            ) : (
              `"${event.description}"`
            )}
          </p>
          <div className="w-24 h-px bg-[#D7CCC8] mx-auto my-6"></div>
          <p className="uppercase tracking-widest text-xs text-[#8D6E63]">
            Convidado Especial
          </p>
          <p className="text-xl font-bold mt-2">{guestName}</p>
        </FadeInSection>
      </div>

      {/* LOCATIONS - Side by Side Cards */}
      <EditableSectionWrapper
        isEditing={isEditing}
        section="locations"
          isHidden={(event.hiddenSections || []).includes("locations")}
        label="Locais"
        onEditSection={onEditSection}
        className="px-4 md:px-8 space-y-4 mb-16 block"
      >
        <FadeInSection className="bg-white p-8 rounded-3xl shadow-sm border border-[#EFEBE9] flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block px-3 py-1 bg-[#EFEBE9] text-[#5D4037] text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
              Cerimônia
            </span>
            <h3 className="text-3xl font-serif mb-2 text-[#4E342E]">
              <EditableField
                value={event.locationName}
                onChange={(newVal) => updateField?.("locationName", newVal)}
                isEditing={isEditing}
                className="text-3xl font-serif text-[#4E342E] text-center md:text-left"
              />
            </h3>
            <p className="text-[#8D6E63] mb-4">
              <EditableField
                value={event.address}
                onChange={(newVal) => updateField?.("address", newVal)}
                isEditing={isEditing}
                className="text-[#8D6E63] text-center md:text-left"
                multiline
              />
            </p>
            <button
              onClick={() => window.open(event.mapLink || "#", "_blank")}
              className="text-xs font-bold border-b border-[#5D4037] pb-1 uppercase tracking-widest"
            >
              Ver Mapa
            </button>
          {onCheckStatus && <button onClick={onCheckStatus} className="mt-4 sm:mt-0 sm:ml-4 bg-white text-slate-900 border border-slate-200 shadow-lg hover:bg-slate-50 py-4 px-12 rounded-full font-bold uppercase tracking-widest text-sm transition-all w-full sm:w-auto">Meu Convite</button>}
          </div>
          <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2670&auto=format&fit=crop"
              className="w-full h-full object-cover"
            />
          </div>
        </FadeInSection>
      </EditableSectionWrapper>

      {/* TIMELINE - Rustic Path */}
      <EditableSectionWrapper
        isEditing={isEditing}
        section="timeline"
          isHidden={(event.hiddenSections || []).includes("timeline")}
        label="Cronograma"
        onEditSection={onEditSection}
      >
        <FadeInSection className="bg-[#FFF8E1] py-16 px-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full border-l-2 border-dashed border-[#D7CCC8] opacity-50"></div>
          <div className="relative z-10 max-w-xl mx-auto space-y-12">
            <h3 className="text-center font-script text-4xl text-[#5D4037] mb-12">
              Nosso Grande Dia
            </h3>
            {(event.timeline || []).map((item, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl shadow-sm border border-[#EFEBE9] text-center relative group/timeline-item"
              >
                {isEditing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTimelineItem?.(i);
                    }}
                    className="absolute right-2 top-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer z-30 opacity-0 group-hover/timeline-item:opacity-100 animate-in fade-in"
                    title="Excluir Etapa"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      delete
                    </span>
                  </button>
                )}
                <div className="absolute top-1/2 -left-[45px] md:-left-[calc(50vw-50%+20px)] w-4 h-4 bg-[#8D6E63] rounded-full border-4 border-[#FFF8E1]"></div>
                <span className="text-[#8D6E63] font-bold block mb-1">
                  <EditableField
                    value={item.time}
                    onChange={(newVal) =>
                      updateTimelineItem?.(i, "time", newVal)
                    }
                    isEditing={isEditing}
                    className="text-[#8D6E63] font-bold text-center"
                  />
                </span>
                <h4 className="text-xl font-serif text-[#4E342E]">
                  <EditableField
                    value={item.title}
                    onChange={(newVal) =>
                      updateTimelineItem?.(i, "title", newVal)
                    }
                    isEditing={isEditing}
                    className="text-xl font-serif text-[#4E342E] text-center"
                  />
                </h4>
              </div>
            ))}
          </div>
        </FadeInSection>
      </EditableSectionWrapper>

      {/* GIFTS & DRESS CODE */}
      <EditableSectionWrapper
        isEditing={isEditing}
        section="gifts"
          isHidden={(event.hiddenSections || []).includes("gifts")}
        label="Lista de Presentes & Trajes"
        onEditSection={onEditSection}
        className="grid md:grid-cols-2 gap-4 px-4 mt-16 mb-24 block"
      >
        <FadeInSection className="bg-[#5D4037] text-[#FDF5E6] p-10 rounded-3xl text-center flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-4xl mb-4">
            checkroom
          </span>
          <h3 className="text-2xl font-serif mb-2">Dress Code</h3>
          <p className="opacity-80 text-sm max-w-xs">
            <EditableField
              value={event.dressCode?.description || ""}
              onChange={(newVal) => {
                updateField?.("dressCode", {
                  ...event.dressCode,
                  description: newVal,
                });
              }}
              isEditing={isEditing}
              className="opacity-80 text-sm max-w-xs text-center text-white"
              multiline
            />
          </p>
        </FadeInSection>
        <FadeInSection className="bg-white border border-[#EFEBE9] p-10 rounded-3xl text-center flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-[#5D4037] mb-4">
            card_giftcard
          </span>
          <h3 className="text-2xl font-serif text-[#4E342E] mb-2">Presentes</h3>
          <button
            onClick={() => {
              copyToClipboard(event.gifts?.[0]?.value || "");
              alert("IBAN Copiado!");
            }}
            className="mt-4 px-6 py-2 border border-[#5D4037] text-[#5D4037] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#5D4037] hover:text-white transition-colors"
          >
            Copiar IBAN
          </button>
          {event.gifts?.[0]?.value && (
            <p className="text-xs font-mono text-[#5D4037] bg-[#FDFBF7] p-2 rounded-xl border border-dashed border-[#EFEBE9] mt-4 select-all max-w-[280px] mx-auto break-all flex flex-col items-center">
              <EditableField
                value={event.gifts[0].value}
                onChange={(newVal) => {
                  if (updateField) {
                    const newGifts = [...event.gifts!];
                    newGifts[0].value = newVal;
                    updateField("gifts", newGifts);
                  }
                }}
                isEditing={isEditing}
                className="text-xs font-mono text-[#5D4037] text-center w-full bg-transparent outline-none"
              />
              {event.gifts[0].bankName && (
                <span className="font-sans text-[10px] text-[#8D6E63] mt-1 uppercase tracking-wider">
                  {event.gifts[0].bankName}
                </span>
              )}
              {event.gifts[0].accountName && (
                <span className="font-sans text-[10px] text-[#8D6E63]">
                  {event.gifts[0].accountName}
                </span>
              )}
            </p>
          )}
        </FadeInSection>
      </EditableSectionWrapper>

      {/* FIXED ACTION */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
        <button
          onClick={onRSVP}
          className="w-full bg-[#5D4037] text-[#FDF5E6] py-4 rounded-full font-bold shadow-2xl shadow-[#5D4037]/40 text-sm uppercase tracking-widest hover:scale-105 transition-transform"
        >
          {getRSVPText(event.type)}
        </button>
          {onCheckStatus && <button onClick={onCheckStatus} className="mt-4 sm:mt-0 sm:ml-4 bg-white text-slate-900 border border-slate-200 shadow-lg hover:bg-slate-50 py-4 px-12 rounded-full font-bold uppercase tracking-widest text-sm transition-all w-full sm:w-auto">Meu Convite</button>}
      </div>
    </div>
  );
};

// ============================================================================
// LAYOUT 5: INDUSTRIAL (Modern, Edgy, High Contrast)
// ============================================================================
const IndustrialLayout: React.FC<{
  event: EventDetails;
  onRSVP: () => void;
  onCheckStatus?: () => void;
  guestName: string;
  isEditing?: boolean;
  onEditSection?: (section: any) => void;
  updateField?: (field: string, value: any) => void;
  deleteTimelineItem?: (index: number) => void;
  deleteGiftItem?: (index: number) => void;
  updateGalleryImage?: (index: number, val: string) => void;
  deleteGalleryImage?: (index: number) => void;
  updateTimelineItem?: (
    index: number,
    field: "time" | "title" | "description",
    value: string,
  ) => void;
}> = ({
  event,
  onRSVP,
  onCheckStatus,
  guestName,
  isEditing,
  onEditSection,
  updateField,
  deleteTimelineItem,
  deleteGiftItem,
  updateGalleryImage,
  deleteGalleryImage,
  updateTimelineItem,
}) => {
  const isPremium = isEditing || (event && EVENTS.some((e) => e.id === event.id)) || (event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate"));
  return (
    <div className="min-h-screen bg-[#111] text-white font-display pb-32 selection:bg-white selection:text-black">
      {/* HERO: Full Typographic */}
      <div className="">
        <div className="h-screen relative flex flex-col justify-between p-6 md:p-12 border-b border-white/20">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-widest border border-white px-2 py-1">
              Save The Date
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">
              <EditableField
                value={event.date}
                onChange={(newVal) => updateField?.("date", newVal)}
                isEditing={isEditing}
                className="text-xs font-bold uppercase tracking-widest text-white"
              />
            </span>
          </div>

          <div className="relative z-10">
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-6xl md:text-9xl font-black uppercase leading-[0.85] tracking-tighter mix-blend-difference"
            >
              {isEditing ? (
                <EditableField
                  value={event.title}
                  onChange={(newVal) => updateField?.("title", newVal)}
                  isEditing={isEditing}
                  className="text-6xl md:text-9xl font-black uppercase leading-[0.85] tracking-tighter mix-blend-difference text-left w-full"
                  multiline
                />
              ) : (
                <span className="whitespace-pre-line">
                  {event.title.replace(" & ", "\n&\n")}
                </span>
              )}
            </motion.h1>
          </div>

          <div className="absolute inset-0 z-0 opacity-40">
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent pointer-events-none" />
            <EditableImageWrapper
              src={event.heroImage}
              onChange={(newVal) => updateField?.("heroImage", newVal)}
              isEditing={isEditing}
              className="w-full h-full"
            >
              <img
                src={getImageUrl(event.heroImage, { width: 1200, quality: 80 })}
                className="w-full h-full object-cover grayscale"
                referrerPolicy="no-referrer"
              />
            </EditableImageWrapper>
          </div>
        </div>

        {/* GRID LAYOUT FOR DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-white/20">
          <div className="p-8 md:p-16 border-b md:border-b-0 md:border-r border-white/20 flex flex-col justify-center">
            <FadeInSection>
              <span className="text-xs text-gray-400 uppercase tracking-widest mb-4 block">
                O Conceito
              </span>
              <p className="text-xl md:text-2xl font-light leading-relaxed">
                <EditableField
                  value={event.description}
                  onChange={(newVal) => updateField?.("description", newVal)}
                  isEditing={isEditing}
                  className="text-xl md:text-2xl font-light leading-relaxed text-white text-left"
                  multiline
                />
              </p>
            </FadeInSection>
          </div>
          <div className="p-8 md:p-16 flex flex-col justify-center bg-white text-black">
            <FadeInSection>
              <span className="text-xs font-bold uppercase tracking-widest mb-4 block border-b border-black pb-2">
                Guest Access
              </span>
              <p className="text-4xl font-bold uppercase mb-2">{guestName}</p>
              <div className="flex gap-2 mt-4">
                <div className="h-2 w-2 bg-black rounded-full animate-pulse"></div>
                <p className="text-xs font-mono uppercase">
                  VIP ACCESS GRANTED
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </div>

      {/* TIMELINE - Raw List */}
      <EditableSectionWrapper
        isEditing={isEditing}
        section="timeline"
          isHidden={(event.hiddenSections || []).includes("timeline")}
        label="Cronograma"
        onEditSection={onEditSection}
      >
        <div className="p-8 md:p-16">
          <h3
            className="text-4xl md:text-6xl font-black uppercase mb-12 text-transparent stroke-white"
            style={{ WebkitTextStroke: "1px white" }}
          >
            Timeline
          </h3>
          <div className="space-y-6">
            {(event.timeline || []).map((item, i) => (
              <FadeInSection
                key={i}
                className="group/timeline-item flex items-baseline border-b border-white/10 pb-6 hover:border-white transition-colors cursor-default relative"
              >
                {isEditing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTimelineItem?.(i);
                    }}
                    className="absolute right-2 top-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer z-30 opacity-0 group-hover/timeline-item:opacity-100 animate-in fade-in"
                    title="Excluir Etapa"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      delete
                    </span>
                  </button>
                )}
                <span className="w-24 font-mono text-sm text-gray-500 group-hover:text-white transition-colors">
                  <EditableField
                    value={item.time}
                    onChange={(newVal) =>
                      updateTimelineItem?.(i, "time", newVal)
                    }
                    isEditing={isEditing}
                    className="font-mono text-sm text-gray-400 group-hover:text-white text-left"
                  />
                </span>
                <div>
                  <h4 className="text-2xl font-bold uppercase group-hover:translate-x-2 transition-transform">
                    <EditableField
                      value={item.title}
                      onChange={(newVal) =>
                        updateTimelineItem?.(i, "title", newVal)
                      }
                      isEditing={isEditing}
                      className="text-2xl font-bold uppercase text-white text-left"
                    />
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    <EditableField
                      value={item.description}
                      onChange={(newVal) =>
                        updateTimelineItem?.(i, "description", newVal)
                      }
                      isEditing={isEditing}
                      className="text-sm text-gray-500 text-left"
                      multiline
                    />
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </EditableSectionWrapper>

      {/* LOCATIONS */}
      <EditableSectionWrapper
        isEditing={isEditing}
        section="locations"
          isHidden={(event.hiddenSections || []).includes("locations")}
        label="Locais"
        onEditSection={onEditSection}
        className="grid grid-cols-1 md:grid-cols-2 h-[60vh] block"
      >
        <div className="relative border-r border-white/20 group overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1544070274-1b48b1111003?q=80&w=2670&auto=format&fit=crop"
            className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute bottom-0 left-0 p-8 bg-black/80 w-full backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest mb-1 text-gray-400">
              Cerimônia
            </p>
            <h3 className="text-2xl font-bold uppercase">
              <EditableField
                value={event.locationName}
                onChange={(newVal) => updateField?.("locationName", newVal)}
                isEditing={isEditing}
                className="text-2xl font-bold uppercase text-white"
              />
            </h3>
            <button
              onClick={() => window.open(event.mapLink || "#", "_blank")}
              className="mt-4 text-xs font-bold border border-white px-4 py-2 hover:bg-white hover:text-black transition-colors uppercase"
            >
              Map
            </button>
          </div>
        </div>
        <div className="relative group overflow-hidden">
          <img
            src={event.mapImage}
            className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute bottom-0 left-0 p-8 bg-white/90 text-black w-full backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest mb-1 text-gray-600">
              Recepção
            </p>
            <h3 className="text-2xl font-bold uppercase">
              <EditableField
                value={event.receptionName}
                onChange={(newVal) => updateField?.("receptionName", newVal)}
                isEditing={isEditing}
                className="text-2xl font-bold uppercase text-black"
              />
            </h3>
            <button
              onClick={() =>
                window.open(
                  `https://maps.google.com/?q=${event.receptionAddress}`,
                  "_blank",
                )
              }
              className="mt-4 text-xs font-bold border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors uppercase"
            >
              Map
            </button>
          </div>
        </div>
      </EditableSectionWrapper>

      {/* GIFTS */}
      {event.gifts && event.gifts.length > 0 && (
        <EditableSectionWrapper
          isEditing={isEditing}
          section="gifts"
          isHidden={(event.hiddenSections || []).includes("gifts")}
          label="Lista de Presentes"
          onEditSection={onEditSection}
          className="block border-b border-white/20"
        >
          <FadeInSection className="p-8 md:p-16 flex flex-col justify-center items-center text-center">
            <span className="text-xs font-bold uppercase tracking-widest mb-4 block border-b border-white/30 pb-2">
              Gifts
            </span>
            <p className="text-xl md:text-2xl font-light leading-relaxed max-w-2xl">
              <EditableField
                value={event.gifts?.[0]?.description || ""}
                onChange={(newVal) => {
                  const newGifts = [...(event.gifts || [])];
                  if (newGifts[0]) {
                    newGifts[0] = { ...newGifts[0], description: newVal };
                  } else {
                    newGifts[0] = { type: "IBAN", title: "Presentes", value: "", description: newVal, };
                  }
                  updateField?.("gifts", newGifts);
                }}
                isEditing={isEditing}
                className="text-xl md:text-2xl font-light leading-relaxed text-white text-center"
                multiline
              />
            </p>
            {event.gifts?.[0]?.value && (
              <div className="mt-8 w-full max-w-md">
                <div className="bg-white/10 p-4 rounded-lg font-mono text-sm mb-4 border border-white/20 select-all break-all text-left flex flex-col">
                  <EditableField
                    value={event.gifts[0].value}
                    onChange={(newVal) => {
                      if (updateField) {
                        const newGifts = [...event.gifts!];
                        newGifts[0].value = newVal;
                        updateField("gifts", newGifts);
                      }
                    }}
                    isEditing={isEditing}
                    className="font-mono text-sm text-white w-full bg-transparent outline-none"
                  />
                  {event.gifts[0].bankName && (
                    <span className="font-sans text-[10px] text-gray-400 mt-2 uppercase tracking-wider">
                      {event.gifts[0].bankName}
                    </span>
                  )}
                  {event.gifts[0].accountName && (
                    <span className="font-sans text-[10px] text-gray-400">
                      {event.gifts[0].accountName}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    copyToClipboard(event.gifts?.[0]?.value || "");
                    alert("IBAN Copiado!");
                  }}
                  className="w-full text-xs font-bold border border-white px-4 py-3 hover:bg-white hover:text-black transition-colors uppercase"
                >
                  Copiar IBAN
                </button>
              </div>
            )}
          </FadeInSection>
        </EditableSectionWrapper>
      )}

      {/* GALLERY */}
      {event.gallery && event.gallery.length > 0 && (
        <EditableSectionWrapper
          isEditing={isEditing}
          section="gallery"
          isHidden={(event.hiddenSections || []).includes("gallery")}
          label="Galeria"
          onEditSection={onEditSection}
          className="block"
        >
          <FadeInSection className="p-8 md:p-16">
            <h3
              className="text-4xl md:text-6xl font-black uppercase mb-12 text-transparent stroke-white text-center"
              style={{ WebkitTextStroke: "1px white" }}
            >
              Gallery
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(event.gallery || []).map((img, i) => (
                <div
                  key={i}
                  className="aspect-square relative group/gallery-item overflow-hidden bg-white/5 border border-white/10"
                >
                  <EditableImageWrapper
                    src={typeof img === 'string' ? img : (img as any).url}
                    onChange={(newVal) =>
                      updateField?.(
                        "gallery",
                        event.gallery?.map((g, gi) => (gi === i ? newVal : g)),
                      )
                    }
                    isEditing={isEditing}
                    className="w-full h-full"
                  >
                    <img
                      src={getImageUrl(img)}
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                    />
                  </EditableImageWrapper>
                </div>
              ))}
            </div>
          </FadeInSection>
        </EditableSectionWrapper>
      )}

      {/* RSVP BUTTON */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={onRSVP}
          className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-white text-black font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform"
        >
          {getRSVPText(event.type, "RSVP")}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// HELPERS FOR LUXURY LAYOUT
// ============================================================================
const GoldDivider = () => (
  <div className="flex items-center justify-center gap-4 py-8 opacity-60">
    <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#BF9B30]"></div>
    <div className="w-1.5 h-1.5 rotate-45 border border-[#BF9B30]"></div>
    <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#BF9B30]"></div>
  </div>
);

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <div className="text-center mb-6">
    <h3 className="text-[#BF9B30] font-bold uppercase tracking-widest text-xs inline-block border-b border-[#BF9B30]/30 pb-1">
      {title}
    </h3>
  </div>
);

// ============================================================================
// LUXURY LAYOUT (Existing - kept for reference, no changes needed here)
// ============================================================================
const LuxuryLayout: React.FC<{
  event: EventDetails;
  onRSVP: () => void;
  onCheckStatus?: () => void;
  guestName: string;
  isEditing?: boolean;
  onEditSection?: (section: any) => void;
  updateField?: (field: string, value: any) => void;
  deleteTimelineItem?: (index: number) => void;
  deleteGiftItem?: (index: number) => void;
  updateGalleryImage?: (index: number, val: string) => void;
  deleteGalleryImage?: (index: number) => void;
  updateTimelineItem?: (
    index: number,
    field: "time" | "title" | "description",
    value: string,
  ) => void;
}> = ({
  event,
  onRSVP,
  onCheckStatus,
  guestName,
  isEditing,
  onEditSection,
  updateField,
  deleteTimelineItem,
  deleteGiftItem,
  updateGalleryImage,
  deleteGalleryImage,
  updateTimelineItem,
}) => {
  const isPremium = isEditing || (event && EVENTS.some((e) => e.id === event.id)) || (event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate"));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (val: string) => {
    copyToClipboard(val);
    setCopiedKey(val);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-serif pb-28 border-[12px] border-[#111] overflow-x-hidden relative">
      {/* BACKGROUND: Deep Elegant Radial Gradient (Spotlight Effect) */}
      <div className="fixed inset-0 bg-[radial-gradient(100%_100%_at_50%_0%,_#2C3038_0%,_#0F1419_50%,_#000000_100%)] z-0" />

      {/* BACKGROUND: Subtle Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-0 mix-blend-screen"></div>

      {/* Gold Frame Container */}
      <div className="border border-[#BF9B30]/30 min-h-[calc(100vh-24px)] relative flex flex-col items-center z-10 backdrop-blur-[1px]">
        {/* 1. HERO & DESIGN STYLE */}
        <div className="w-full">
          <div className="pt-12 pb-2 px-8 text-center w-full relative z-10">
            <div className="w-16 h-16 mx-auto mb-6 border border-[#BF9B30] rounded-full flex items-center justify-center">
              <span className="font-script text-3xl text-[#BF9B30] pt-2">
                {event.title.charAt(0)}
              </span>
            </div>
            <p className="text-[#BF9B30] text-[10px] uppercase tracking-[0.3em] mb-4">
              Convite Formal
            </p>
            <motion.h1
              initial={{ opacity: 0, scale: 0.9, filter: "blur(5px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{
                duration: 2.4,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.6,
              }}
              className="text-4xl text-white mb-2 flex justify-center"
            >
              <EditableField
                value={event.title}
                onChange={(newVal) => updateField?.("title", newVal)}
                isEditing={isEditing}
                className="text-4xl text-white text-center font-serif"
              />
            </motion.h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest">
              {event.hosts}
            </p>
          </div>

          {/* 2. GUEST PERSONALIZATION */}
          <FadeInSection delay={0.2} className="my-6 text-center w-full px-6">
            <div className="bg-[#BF9B30]/10 border-y border-[#BF9B30]/20 py-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                Convidado de Honra
              </p>
              <p className="text-xl text-[#BF9B30] font-script">{guestName}</p>
            </div>
          </FadeInSection>

          {/* 3. HERO IMAGE & DATE */}
          <FadeInSection delay={0.3} className="w-full px-6 mb-4">
            <div className="w-full aspect-[4/5] rounded-t-[10rem] rounded-b-xl overflow-hidden relative border border-[#BF9B30]/20 mx-auto max-w-sm">
              <EditableImageWrapper
                src={event.heroImage}
                onChange={(newVal) => updateField?.("heroImage", newVal)}
                isEditing={isEditing}
                className="absolute inset-0"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center grayscale contrast-125"
                  style={{ backgroundImage: `url('${getImageUrl(event.heroImage, { width: 1200, quality: 80 })}')` }}
                />
              </EditableImageWrapper>
              <div className="absolute inset-0 bg-[#0F1419]/30 mix-blend-color pointer-events-none"></div>

              <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#0F1419] to-transparent pt-20 pb-6 text-center pointer-events-none">
                <div className="pointer-events-auto">
                  <p className="text-2xl text-white font-italic">
                    <EditableField
                      value={event.date}
                      onChange={(newVal) => updateField?.("date", newVal)}
                      isEditing={isEditing}
                      className="text-2xl text-white text-center"
                    />
                  </p>
                  <p className="text-[#BF9B30] text-sm">
                    {isEditing ? (
                      <EditableField
                        value={event.time}
                        onChange={(newVal) => updateField?.("time", newVal)}
                        isEditing={isEditing}
                        className="text-[#BF9B30] text-sm text-center"
                      />
                    ) : (
                      `${event.time} Horas`
                    )}
                  </p>
                </div>
              </div>
            </div>
          </FadeInSection>

          {/* 4. COUNTDOWN */}
          <FadeInSection className="w-full mb-8">
            <p className="text-center text-[10px] uppercase tracking-widest text-gray-500 mb-0">
              Contagem Regressiva
            </p>
            <CountdownTimer targetDate={event.isoDate} />
          </FadeInSection>

          {/* 5. COUPLE MESSAGE */}
          <FadeInSection className="px-8 text-center max-w-md mx-auto pb-4">
            <p className="text-lg leading-relaxed font-light text-gray-400 border-t border-b border-[#BF9B30]/20 py-8">
              <EditableField
                value={event.description}
                onChange={(newVal) => updateField?.("description", newVal)}
                isEditing={isEditing}
                className="text-lg leading-relaxed font-light text-gray-400 text-center"
                multiline
              />
            </p>
          </FadeInSection>
        </div>

        <GoldDivider />

        {/* 6. CEREMONY & RECEPTION (Split Locations) */}
        <EditableSectionWrapper
          isEditing={isEditing}
          section="locations"
          isHidden={(event.hiddenSections || []).includes("locations")}
          label="Locais"
          onEditSection={onEditSection}
          className="w-full block"
        >
          <div className="w-full px-6 mb-8 space-y-8">
            <FadeInSection>
              <SectionTitle title="Cerimônia Religiosa" />
              <div className="border border-[#BF9B30]/30 rounded-xl overflow-hidden bg-[#0F1419] max-w-md mx-auto">
                <div className="h-32 relative">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-60"
                    style={{
                      backgroundImage: `url('https://images.unsplash.com/photo-1544070274-1b48b1111003?q=80&w=2670&auto=format&fit=crop')`,
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F1419] to-transparent"></div>
                  <div className="absolute bottom-3 left-4">
                    <p className="text-white text-lg font-serif">
                      <EditableField
                        value={event.locationName}
                        onChange={(newVal) =>
                          updateField?.("locationName", newVal)
                        }
                        isEditing={isEditing}
                        className="text-white text-lg font-serif text-left"
                      />
                    </p>
                    <p className="text-gray-400 text-xs">{event.time}</p>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    <EditableField
                      value={event.address}
                      onChange={(newVal) => updateField?.("address", newVal)}
                      isEditing={isEditing}
                      className="text-xs text-gray-500 text-center leading-relaxed"
                      multiline
                    />
                  </p>
                  <Button
                    className="w-full bg-[#BF9B30] text-[#0F1419] hover:bg-white hover:text-black text-xs font-bold uppercase tracking-widest h-10 border-none shadow-lg"
                    onClick={() =>
                      window.open(
                        event.mapLink ||
                          `https://maps.google.com/?q=${event.address}`,
                        "_blank",
                      )
                    }
                  >
                    Ver no Mapa
                  </Button>
                </div>
              </div>
            </FadeInSection>

            {event.receptionName && (
              <FadeInSection>
                <SectionTitle title="Recepção & Festa" />
                <div className="border border-[#BF9B30]/30 rounded-xl overflow-hidden bg-[#0F1419] max-w-md mx-auto">
                  <div className="h-32 relative">
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-60"
                      style={{ backgroundImage: `url('${event.mapImage}')` }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1419] to-transparent"></div>
                    <div className="absolute bottom-3 left-4">
                      <p className="text-white text-lg font-serif">
                        <EditableField
                          value={event.receptionName}
                          onChange={(newVal) =>
                            updateField?.("receptionName", newVal)
                          }
                          isEditing={isEditing}
                          className="text-white text-lg font-serif text-left"
                        />
                      </p>
                      <p className="text-gray-400 text-xs">
                        Logo após a cerimônia
                      </p>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-xs text-gray-500 text-center leading-relaxed">
                      <EditableField
                        value={event.receptionAddress}
                        onChange={(newVal) =>
                          updateField?.("receptionAddress", newVal)
                        }
                        isEditing={isEditing}
                        className="text-xs text-gray-500 text-center leading-relaxed"
                        multiline
                      />
                    </p>
                    <Button
                      className="w-full bg-[#BF9B30] text-[#0F1419] hover:bg-white hover:text-black text-xs font-bold uppercase tracking-widest h-10 border-none shadow-lg"
                      onClick={() =>
                        window.open(
                          `https://maps.google.com/?q=${event.receptionAddress}`,
                          "_blank",
                        )
                      }
                    >
                      Ver no Mapa
                    </Button>
                  </div>
                </div>
              </FadeInSection>
            )}
          </div>
        </EditableSectionWrapper>

        <GoldDivider />

        {/* 8. GIFTS (Lista de Presentes) */}
        {event.gifts && event.gifts.length > 0 && (
          <EditableSectionWrapper
            isEditing={isEditing}
            section="gifts"
          isHidden={(event.hiddenSections || []).includes("gifts")}
            label="Lista de Presentes"
            onEditSection={onEditSection}
            className="w-full block"
          >
            <FadeInSection className="w-full px-6 mb-24 max-w-md mx-auto">
              <SectionTitle title="Lista de Presentes" />
              {(event.gifts || []).map((gift, i) => (
                <div
                  key={i}
                  className="bg-[#1A1F26] p-6 rounded-xl border border-[#BF9B30]/20 text-center space-y-4"
                >
                  <span className="material-symbols-outlined text-3xl text-[#BF9B30]">
                    featured_seasonal_and_gifts
                  </span>
                  <div>
                    <h4 className="text-white font-bold">{gift.title}</h4>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                      {gift.description}
                    </p>
                  </div>

                  {/* IBAN DISPLAY */}
                  {gift.type === "IBAN" && (
                    <div className="bg-black/60 p-4 rounded-lg border border-[#BF9B30]/30 shadow-inner">
                      <p className="text-[10px] text-[#BF9B30] mb-2 uppercase tracking-widest font-bold">
                        Enviar Presentes
                      </p>
                      <EditableField
                        value={gift.value}
                        onChange={(newVal) => {
                          if (updateField && event.gifts) {
                            const newGifts = [...event.gifts];
                            newGifts[i].value = newVal;
                            updateField("gifts", newGifts);
                          }
                        }}
                        isEditing={isEditing}
                        className="text-white font-mono text-base break-all tracking-wider text-center w-full bg-transparent outline-none"
                      />
                      <div className="mb-4">
                        {gift.bankName && (
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                            {gift.bankName}
                          </p>
                        )}
                        {gift.accountName && (
                          <p className="text-[10px] text-gray-400">
                            {gift.accountName}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopy(gift.value)}
                        className={`
                              w-full py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2
                              ${
                                copiedKey === gift.value
                                  ? "bg-[#BF9B30] text-[#0F1419] shadow-[0_0_15px_rgba(191,155,48,0.4)] scale-105"
                                  : "bg-transparent border border-[#BF9B30] text-[#BF9B30] hover:bg-[#BF9B30]/10"
                              }
                            `}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {copiedKey === gift.value
                            ? "check_circle"
                            : "content_copy"}
                        </span>
                        <span>
                          {copiedKey === gift.value
                            ? "IBAN Copiado"
                            : "Copiar IBAN"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </FadeInSection>
          </EditableSectionWrapper>
        )}

        {/* 10. GALLERY (Horizontal Scroll) */}
        {event.gallery && (
          <EditableSectionWrapper
            isEditing={isEditing}
            section="gallery"
          isHidden={(event.hiddenSections || []).includes("gallery")}
            label="Galeria"
            onEditSection={onEditSection}
            className="w-full block"
          >
            <FadeInSection className="w-full mb-24 pl-6">
              <h3 className="text-[#BF9B30] font-bold uppercase tracking-widest text-xs mb-4 text-left">
                Nossa Galeria
              </h3>
              <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
                {(event.gallery || []).map((img, i) => (
                  <img
                    key={i}
                    src={getImageUrl(img)}
                    className="h-48 w-36 object-cover rounded-lg border border-[#BF9B30]/20 grayscale hover:grayscale-0 transition-all duration-500"
                  />
                ))}
              </div>
            </FadeInSection>
          </EditableSectionWrapper>
        )}

        {/* Gold Action Button (Fixed Bottom Bar) */}
        <div className="fixed bottom-0 left-0 w-full bg-[#0F1419]/95 backdrop-blur-md border-t border-[#BF9B30]/20 p-4 z-50 flex items-center justify-center">
          <Button
            onClick={onRSVP}
            className="w-full max-w-md bg-[#BF9B30] text-[#0F1419] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors py-4 shadow-[0_0_20px_rgba(191,155,48,0.3)] flex items-center justify-center gap-2"
          >
            <span>{getRSVPText(event.type, "RESPONDER")}</span>
            <span className="material-symbols-outlined text-sm">mail</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SHARED: RSVP FORM

// ============================================================================
// BRIDAL SHOWER LAYOUT (Apple-Level Spatial UI, Glassmorphism)
// ============================================================================
const BridalShowerLayout: React.FC<{
  event: EventDetails;
  onRSVP: () => void;
  onCheckStatus?: () => void;
  guestName: string;
  isEditing?: boolean;
  onEditSection?: (section: any) => void;
  updateField?: (field: string, value: any) => void;
  deleteTimelineItem?: (index: number) => void;
  deleteGiftItem?: (index: number) => void;
  updateGalleryImage?: (index: number, val: string) => void;
  deleteGalleryImage?: (index: number) => void;
  updateTimelineItem?: (
    index: number,
    field: "time" | "title" | "description",
    value: string,
  ) => void;
}> = ({
  event,
  onRSVP,
  onCheckStatus,
  guestName,
  isEditing,
  onEditSection,
  updateField,
  deleteTimelineItem,
  deleteGiftItem,
  updateGalleryImage,
  deleteGalleryImage,
  updateTimelineItem,
}) => {
  const isPremium = isEditing || (event && EVENTS.some((e) => e.id === event.id)) || (event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate"));
  const isMinimal = event.layoutMode === "BRIDAL_MINIMAL";
  const isTropical = event.layoutMode === "BRIDAL_TROPICAL";
  const isBeauty = event.layoutMode === "BRIDAL_BEAUTY";

  const bgClass = isMinimal
    ? "bg-white"
    : isTropical
      ? "bg-[#F0F4F1]"
      : isBeauty
        ? "bg-[#FFF0F5]"
        : "bg-[#FDFBF7]";
  const accentCard = isMinimal
    ? "bg-white/80"
    : isTropical
      ? "bg-white/60"
      : "bg-white/70";
  const primaryText = isTropical
    ? "text-[#1A3A2A]"
    : isMinimal
      ? "text-[#111111]"
      : "text-[#4A3B42]";
  const secondaryText = isMinimal ? "text-[#666666]" : "text-[#8C7A82]";

  return (
    <div
      className={`min-h-screen ${bgClass} ${primaryText} font-sans pb-32 selection:bg-pink-100`}
    >
      {/* SPATIAL HERO */}
      <div className="">
        <div className="relative h-[85vh] w-full overflow-hidden rounded-b-[40px] md:rounded-b-[80px] shadow-sm">
          <EditableImageWrapper
            src={event.heroImage}
            onChange={(newVal) => updateField?.("heroImage", newVal)}
            isEditing={isEditing}
            className="absolute inset-0"
          >
            <motion.div
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${getImageUrl(event.heroImage, { width: 1200, quality: 80 })}')` }}
            />
          </EditableImageWrapper>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-end text-center p-8 pb-16 pointer-events-none"
          >
            <div
              className={`${accentCard} backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-2xl border border-white/40 max-w-lg w-full transform perspective-1000 pointer-events-auto`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-4">
                CHÁ DE PANELA
              </p>
              <h1 className="text-4xl md:text-5xl font-serif mb-4 leading-tight flex justify-center">
                <EditableField
                  value={event.title}
                  onChange={(newVal) => updateField?.("title", newVal)}
                  isEditing={isEditing}
                  className="text-4xl md:text-5xl font-serif text-center"
                />
              </h1>
              <div className="h-px w-12 bg-current opacity-20 mx-auto my-4"></div>
              <p className="text-sm font-medium uppercase tracking-widest opacity-80">
                <EditableField
                  value={event.date}
                  onChange={(newVal) => updateField?.("date", newVal)}
                  isEditing={isEditing}
                  className="text-sm font-medium uppercase tracking-widest opacity-80 text-center"
                />
              </p>
            </div>
          </motion.div>
        </div>

        {/* WELCOME NOTE */}
        <div className="max-w-3xl mx-auto px-6 mt-16 md:mt-24 text-center">
          <FadeInSection>
            <span className="material-symbols-outlined text-4xl mb-6 opacity-40">
              favorite
            </span>
            <p className="text-xl md:text-2xl font-serif italic leading-relaxed opacity-90 max-w-2xl mx-auto">
              {isEditing ? (
                <EditableField
                  value={event.description}
                  onChange={(newVal) => updateField?.("description", newVal)}
                  isEditing={isEditing}
                  className="text-xl md:text-2xl font-serif italic leading-relaxed text-center"
                  multiline
                />
              ) : (
                `"${event.description}"`
              )}
            </p>
            <div className="mt-12 p-6 rounded-[2rem] bg-white/50 backdrop-blur-lg border border-white max-w-sm mx-auto shadow-sm">
              <p className="uppercase tracking-[0.2em] text-[10px] font-bold opacity-50 mb-2">
                Convidada Especial
              </p>
              <p className="text-2xl font-serif">{guestName}</p>
            </div>
          </FadeInSection>
        </div>
      </div>

      {/* EVENT DETAILS (Clean Cards) */}
      <div className="max-w-5xl mx-auto px-6 mt-24">
        <div className="grid md:grid-cols-2 gap-6">
          {/* LOCATION */}
          <EditableSectionWrapper
            isEditing={isEditing}
            section="locations"
          isHidden={(event.hiddenSections || []).includes("locations")}
            label="Locais"
            onEditSection={onEditSection}
            className="block"
          >
            <FadeInSection
              className={`${accentCard} backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/50 shadow-sm flex flex-col items-start min-h-[380px]`}
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-6">
                <span className="material-symbols-outlined opacity-60">
                  location_on
                </span>
              </div>
              <h3 className="text-2xl font-serif mb-2">
                <EditableField
                  value={event.locationName}
                  onChange={(newVal) => updateField?.("locationName", newVal)}
                  isEditing={isEditing}
                  className="text-2xl font-serif text-left"
                />
              </h3>
              <p className="font-bold opacity-80 uppercase tracking-widest text-xs mb-4">
                {isEditing ? (
                  <EditableField
                    value={event.time}
                    onChange={(newVal) => updateField?.("time", newVal)}
                    isEditing={isEditing}
                    className="font-bold opacity-80 uppercase tracking-widest text-xs text-left"
                  />
                ) : (
                  `${event.time} Hrs`
                )}
              </p>
              <p className={`${secondaryText} leading-relaxed mb-8`}>
                <EditableField
                  value={event.address}
                  onChange={(newVal) => updateField?.("address", newVal)}
                  isEditing={isEditing}
                  className={`${secondaryText} leading-relaxed text-left`}
                  multiline
                />
              </p>
              <button
                onClick={() => window.open(event.mapLink || "#", "_blank")}
                className="mt-auto text-xs font-bold uppercase tracking-widest border-b border-current pb-1 hover:opacity-50 transition-opacity"
              >
                Ver no Mapa
              </button>
            </FadeInSection>
          </EditableSectionWrapper>

          {/* GIFTS */}
          {event.gifts && event.gifts.length > 0 && (
            <EditableSectionWrapper
              isEditing={isEditing}
              section="gifts"
          isHidden={(event.hiddenSections || []).includes("gifts")}
              label="Lista de Presentes"
              onEditSection={onEditSection}
              className="block"
            >
              <FadeInSection
                className={`${accentCard} backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/50 shadow-sm flex flex-col items-start min-h-[380px]`}
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-6">
                  <span className="material-symbols-outlined opacity-60">
                    card_giftcard
                  </span>
                </div>
                <h3 className="text-2xl font-serif mb-2">Lista de Presentes</h3>
                <p
                  className={`${secondaryText} leading-relaxed mb-8 max-w-[250px]`}
                >
                  <EditableField
                    value={
                      event.gifts?.[0]?.description ||
                      "Sua presença é o maior presente. Mas se quiser nos mimar:"
                    }
                    onChange={(newVal) => {
                      const updatedGifts = [...(event.gifts || [])];
                      if (updatedGifts[0]) {
                        updatedGifts[0] = {
                          ...updatedGifts[0], description: newVal, };
                      } else {
                        updatedGifts[0] = {
                          type: "IBAN",
                          title: "Lista de Presentes",
                          description: newVal,
                          value: "",
                        };
                      }
                      updateField?.("gifts", updatedGifts);
                    }}
                    isEditing={isEditing}
                    className={`${secondaryText} leading-relaxed text-left`}
                    multiline
                  />
                </p>
                <button
                  onClick={() => {
                    copyToClipboard(event.gifts?.[0]?.value || "");
                    alert("IBAN Copiado!");
                  }}
                  className="mt-auto bg-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  Copiar IBAN
                </button>
                {event.gifts?.[0]?.value && (
                  <p className="text-xs font-mono opacity-80 mt-4 bg-white/40 border border-dashed border-white/60 p-2.5 rounded-xl w-full select-all max-w-[280px] mx-auto break-all flex flex-col items-center text-center">
                    <EditableField
                      value={event.gifts[0].value}
                      onChange={(newVal) => {
                        if (updateField) {
                          const newGifts = [...event.gifts!];
                          newGifts[0].value = newVal;
                          updateField("gifts", newGifts);
                        }
                      }}
                      isEditing={isEditing}
                      className={`text-xs font-mono ${primaryText} text-center w-full bg-transparent outline-none`}
                    />
                    {event.gifts[0].bankName && (
                      <span
                        className={`font-sans text-[10px] ${primaryText} opacity-70 mt-1 uppercase tracking-wider`}
                      >
                        {event.gifts[0].bankName}
                      </span>
                    )}
                    {event.gifts[0].accountName && (
                      <span
                        className={`font-sans text-[10px] ${primaryText} opacity-70`}
                      >
                        {event.gifts[0].accountName}
                      </span>
                    )}
                  </p>
                )}
              </FadeInSection>
            </EditableSectionWrapper>
          )}
        </div>
      </div>

      {/* GALLERY (Spatial Layout) */}
      {event.gallery && event.gallery.length > 0 && (
        <EditableSectionWrapper
          isEditing={isEditing}
          section="gallery"
          isHidden={(event.hiddenSections || []).includes("gallery")}
          label="Galeria"
          onEditSection={onEditSection}
          className="block mt-24"
        >
          <div className="max-w-6xl mx-auto px-6">
            <FadeInSection>
              <h3 className="text-center font-serif text-3xl mb-12">
                Momentos
              </h3>
              <div
                className="flex gap-4 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: "none" }}
              >
                {(event.gallery || []).map((img, i) => (
                  <div
                    key={i}
                    className="min-w-[70vw] md:min-w-[400px] aspect-[4/5] rounded-[2rem] overflow-hidden snap-center flex-shrink-0 shadow-lg relative group"
                  >
                    <img
                      src={getImageUrl(img)}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                  </div>
                ))}
              </div>
            </FadeInSection>
          </div>
        </EditableSectionWrapper>
      )}

      {/* FLOATING ACTION BAR */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="w-full"
        >
          <button
            onClick={onRSVP}
            className="w-full bg-white/90 backdrop-blur-xl text-black py-4 rounded-full font-bold shadow-2xl text-xs uppercase tracking-[0.2em] hover:bg-white transition-colors border border-white/20 active:scale-95"
          >
            {getRSVPText(event.type, "Vou no Chá!")}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// BABY SHOWER LAYOUT (Apple-Level Spatial UI, Cute Elegant Glassmorphism)
// ============================================================================
const BabyShowerLayout: React.FC<{
  event: EventDetails;
  onRSVP: () => void;
  onCheckStatus?: () => void;
  guestName: string;
  isEditing?: boolean;
  onEditSection?: (section: any) => void;
  updateField?: (field: string, value: any) => void;
  deleteTimelineItem?: (index: number) => void;
  deleteGiftItem?: (index: number) => void;
  updateGalleryImage?: (index: number, val: string) => void;
  deleteGalleryImage?: (index: number) => void;
  updateTimelineItem?: (
    index: number,
    field: "time" | "title" | "description",
    value: string,
  ) => void;
}> = ({
  event,
  onRSVP,
  onCheckStatus,
  guestName,
  isEditing,
  onEditSection,
  updateField,
  deleteTimelineItem,
  deleteGiftItem,
  updateGalleryImage,
  deleteGalleryImage,
}) => {
  const isPremium = isEditing || (event && EVENTS.some((e) => e.id === event.id)) || (event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate"));
  const isBoy = event.layoutMode === "BABY_BOY";
  const isGirl = event.layoutMode === "BABY_GIRL";

  const bgClass = isBoy
    ? "bg-[#F0F8FF]"
    : isGirl
      ? "bg-[#FFF5F5]"
      : "bg-[#FDFBF7]";

  const accentCard = isBoy
    ? "bg-white/70 border-blue-100"
    : isGirl
      ? "bg-white/70 border-rose-100"
      : "bg-white/70 border-amber-100";

  const primaryText = isBoy
    ? "text-[#1A365D]"
    : isGirl
      ? "text-[#5C2D3E]"
      : "text-[#3A3D2A]";

  const secondaryText = isBoy 
    ? "text-[#4A5568]" 
    : isGirl 
      ? "text-[#8C7A82]" 
      : "text-[#706B62]";

  const iconColor = isBoy 
    ? "text-blue-400" 
    : isGirl 
      ? "text-rose-400" 
      : "text-amber-500";

  return (
    <div
      className={`min-h-screen ${bgClass} ${primaryText} font-sans pb-32 selection:bg-blue-100 text-left`}
    >
      {/* SPATIAL HERO */}
      <div className="">
        <div className="relative h-[85vh] w-full overflow-hidden rounded-b-[40px] md:rounded-b-[80px] shadow-sm">
          <EditableImageWrapper
            src={event.heroImage}
            onChange={(newVal) => updateField?.("heroImage", newVal)}
            isEditing={isEditing}
            className="absolute inset-0"
          >
            <motion.div
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 2.8, ease: "easeInOut" }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${getImageUrl(event.heroImage, { width: 1200, quality: 80 })}')` }}
            />
          </EditableImageWrapper>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-end text-center p-8 pb-16 pointer-events-none"
          >
            <div
              className={`${accentCard} backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-2xl border max-w-lg w-full pointer-events-auto`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-65 mb-4 text-center">
                CHÁ DE BEBÉ
              </p>
              <h1 className="text-4xl md:text-5xl font-serif mb-4 leading-tight flex justify-center">
                <EditableField
                  value={event.title}
                  onChange={(newVal) => updateField?.("title", newVal)}
                  isEditing={isEditing}
                  className="text-4xl md:text-5xl font-serif text-center"
                />
              </h1>
              <div className="h-px w-12 bg-current opacity-20 mx-auto my-4"></div>
              <p className="text-sm font-medium uppercase tracking-widest opacity-80 text-center">
                <EditableField
                  value={event.date}
                  onChange={(newVal) => updateField?.("date", newVal)}
                  isEditing={isEditing}
                  className="text-sm font-medium uppercase tracking-widest opacity-80 text-center"
                />
              </p>
            </div>
          </motion.div>
        </div>

        {/* WELCOME NOTE */}
        <div className="max-w-3xl mx-auto px-6 mt-16 md:mt-24 text-center flex flex-col items-center">
          <FadeInSection>
            <span className={`material-symbols-outlined text-4xl mb-6 ${iconColor}`}>
              child_care
            </span>
            <p className="text-xl md:text-2xl font-serif italic leading-relaxed opacity-90 max-w-2xl mx-auto text-center">
              {isEditing ? (
                <EditableField
                  value={event.description}
                  onChange={(newVal) => updateField?.("description", newVal)}
                  isEditing={isEditing}
                  className="text-xl md:text-2xl font-serif italic leading-relaxed text-center"
                  multiline
                />
              ) : (
                `"${event.description}"`
              )}
            </p>
            <div className="mt-12 p-6 rounded-[2rem] bg-white/50 backdrop-blur-lg border border-white max-w-sm mx-auto shadow-sm text-center">
              <p className="uppercase tracking-[0.2em] text-[10px] font-bold opacity-50 mb-2">
                Convidado Especial
              </p>
              <p className="text-2xl font-serif">{guestName}</p>
            </div>
          </FadeInSection>
        </div>
      </div>

      {/* EVENT DETAILS (Clean Cards) */}
      <div className="max-w-5xl mx-auto px-6 mt-24">
        <div className="grid md:grid-cols-2 gap-6">
          {/* LOCATION */}
          <EditableSectionWrapper
            isEditing={isEditing}
            section="locations"
          isHidden={(event.hiddenSections || []).includes("locations")}
            label="Locais"
            onEditSection={onEditSection}
            className="block"
          >
            <FadeInSection
              className={`${accentCard} backdrop-blur-xl p-10 rounded-[2.5rem] border shadow-sm flex flex-col items-start min-h-[380px]`}
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-6">
                <span className={`material-symbols-outlined ${iconColor}`}>
                  location_on
                </span>
              </div>
              <h3 className="text-2xl font-serif mb-2">
                <EditableField
                  value={event.locationName}
                  onChange={(newVal) => updateField?.("locationName", newVal)}
                  isEditing={isEditing}
                  className="text-2xl font-serif text-left"
                />
              </h3>
              <p className={`text-sm ${secondaryText} mb-6 leading-relaxed flex-1 text-left`}>
                <EditableField
                  value={event.address}
                  onChange={(newVal) => updateField?.("address", newVal)}
                  isEditing={isEditing}
                  className={`text-sm ${secondaryText} leading-relaxed text-left`}
                  multiline
                />
              </p>
              <div className="flex gap-4 w-full mt-auto pt-6 border-t border-black/5">
                <div className="flex-1 text-left">
                  <span className="uppercase tracking-widest text-[9px] font-bold opacity-40 block mb-1">
                    Horário
                  </span>
                  <p className="text-base font-medium">
                    <EditableField
                      value={event.time}
                      onChange={(newVal) => updateField?.("time", newVal)}
                      isEditing={isEditing}
                      className="text-base font-medium text-left"
                    />
                  </p>
                </div>
                {event.mapLink && (
                  <button
                    onClick={() => window.open(event.mapLink, "_blank")}
                    className="h-12 px-6 rounded-2xl bg-black text-white hover:bg-black/80 transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-sm">map</span> Ver Mapa
                  </button>
                )}
              </div>
            </FadeInSection>
          </EditableSectionWrapper>

          {/* BRIDAL PROTAGONIST SUMMARY / ABOUT BABY */}
          <FadeInSection
            className={`${accentCard} backdrop-blur-xl p-10 rounded-[2.5rem] border shadow-sm flex flex-col items-start min-h-[380px]`}
          >
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-6">
              <span className={`material-symbols-outlined ${iconColor}`}>
                featured_seasonal_and_gifts
              </span>
            </div>
            <h3 className="text-2xl font-serif mb-2 text-left">
              O Nosso Bebé
            </h3>
            <p className={`text-sm ${secondaryText} leading-relaxed text-left flex-1`}>
              Queridos familiares e amigos, a nossa vida está prestes a ganhar um novo brilho. 
              Criámos este espaço para partilhar as nossas expectativas, planos e a nossa lista de mimos recomendada para equipar o enxoval com todo o amor. 
              A vossa presença e carinho significam tudo para nós!
            </p>
            <div className="w-full mt-auto pt-6 border-t border-black/5 text-left">
              <span className="uppercase tracking-widest text-[9px] font-bold opacity-40 block mb-1">
                Protagonista
              </span>
              <p className="text-xl font-serif">
                <EditableField
                  value={event.brideName}
                  onChange={(newVal) => updateField?.("brideName", newVal)}
                  isEditing={isEditing}
                  className="text-xl font-serif text-left"
                />
              </p>
            </div>
          </FadeInSection>
        </div>
      </div>

      {/* GIFT LIST INTEGRATION */}
      {event.gifts && event.gifts.length > 0 && (
        <EditableSectionWrapper
          isEditing={isEditing}
          section="gifts"
          isHidden={(event.hiddenSections || []).includes("gifts")}
          label="Presentes"
          onEditSection={onEditSection}
          className="block"
        >
          <div className="max-w-5xl mx-auto px-6 mt-24">
            <FadeInSection className="text-center mb-12 flex flex-col items-center">
              <span className={`material-symbols-outlined text-3xl mb-4 ${iconColor}`}>
                card_giftcard
              </span>
              <h2 className="text-3xl font-serif mb-2 text-center">Lista de Mimos</h2>
              <p className={`text-xs ${secondaryText} uppercase tracking-widest text-center`}>
                Sugestões de presentes para ajudar a preparar o enxoval
              </p>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {event.gifts.map((gift: any, index: number) => (
                <div
                  key={index}
                  className={`${accentCard} backdrop-blur-xl border p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[220px] text-left relative group`}
                >
                  {isEditing && (
                    <button
                      onClick={() => deleteGiftItem?.(index)}
                      className="absolute top-4 right-4 w-6 h-6 rounded-full bg-red-50 text-red-500 hover:bg-red-150 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">
                      {gift.type === "IBAN" ? "Transferência Bancária" : "Link Externo"}
                    </span>
                    <h4 className="text-lg font-serif mt-2 mb-1">{gift.title}</h4>
                    <p className={`text-xs ${secondaryText} line-clamp-2`}>
                      {gift.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between">
                    {gift.type === "IBAN" ? (
                      <div className="w-full">
                        <span className="text-[9px] uppercase font-bold opacity-30 block">
                          {gift.bank || "BAI"}
                        </span>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <code className="text-[11px] font-mono break-all line-clamp-1 select-all bg-black/5 px-2 py-1 rounded">
                            {gift.account}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(gift.account);
                              toast.success("IBAN copiado!");
                            }}
                            className="text-[10px] font-bold text-brand-blue uppercase hover:underline shrink-0"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => window.open(gift.url, "_blank")}
                        className="w-full h-10 rounded-xl bg-black/5 hover:bg-black/10 transition-colors text-xs font-bold flex items-center justify-center gap-2"
                      >
                        Visitar Loja <span className="material-symbols-outlined text-xs">arrow_outward</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </EditableSectionWrapper>
      )}

      {/* GALLERY / PHOTOS */}
      {event.gallery && event.gallery.length > 0 && (
        <EditableSectionWrapper
          isEditing={isEditing}
          section="gallery"
          isHidden={(event.hiddenSections || []).includes("gallery")}
          label="Galeria de Fotos"
          onEditSection={onEditSection}
          className="block"
        >
          <div className="max-w-7xl mx-auto mt-32">
            <FadeInSection className="text-center mb-12 px-6 flex flex-col items-center">
              <span className={`material-symbols-outlined text-3xl mb-4 ${iconColor}`}>
                photo_library
              </span>
              <h2 className="text-3xl font-serif mb-2 text-center">Galeria de Amor</h2>
              <p className={`text-xs ${secondaryText} uppercase tracking-widest text-center`}>
                Momentos doces da nossa espera
              </p>
            </FadeInSection>

            <FadeInSection>
              <div className="flex gap-6 overflow-x-auto pb-8 px-6 md:px-12 scrollbar-none snap-x snap-mandatory">
                {event.gallery.map((img: string, i: number) => (
                  <div
                    key={i}
                    className="min-w-[70vw] md:min-w-[400px] aspect-[4/5] rounded-[2rem] overflow-hidden snap-center flex-shrink-0 shadow-lg relative group"
                  >
                    <img
                      src={getImageUrl(img)}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                  </div>
                ))}
              </div>
            </FadeInSection>
          </div>
        </EditableSectionWrapper>
      )}

      {/* FLOATING ACTION BAR */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="w-full"
        >
          <button
            onClick={onRSVP}
            className="w-full bg-white/90 backdrop-blur-xl text-black py-4 rounded-full font-bold shadow-2xl text-xs uppercase tracking-[0.2em] hover:bg-white transition-colors border border-white/20 active:scale-95"
          >
            {getRSVPText(event.type, "Vou no Chá!")}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// CLONE LAYOUT: LIMINTSO GOLD (Chany & Pedro Elegant Wedding Clone)
// ============================================================================
const LimintsoGoldLayout: React.FC<{
  event: EventDetails;
  onRSVP: () => void;
  onCheckStatus?: () => void;
  guestName?: string;
  isEditing?: boolean;
  isOpenCover?: boolean;
  setIsOpenCover?: (open: boolean) => void;
  onEditSection?: (section: any) => void;
  updateField?: (field: string, value: any) => void;
  deleteTimelineItem?: (index: number) => void;
  updateTimelineItem?: (
    index: number,
    field: "time" | "title" | "description",
    value: string,
  ) => void;
}> = ({
  event,
  onRSVP,
  onCheckStatus,
  isEditing,
  isOpenCover,
  setIsOpenCover,
  updateField,
  deleteTimelineItem,
  updateTimelineItem,
}) => {
  const isPremium = isEditing || (event && EVENTS.some((e) => e.id === event.id)) || (event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate"));
  const [localIsOpen, setLocalIsOpen] = useState(isEditing ? true : false);
  const isOpen = isOpenCover !== undefined ? isOpenCover : localIsOpen;
  const setIsOpen = setIsOpenCover !== undefined ? setIsOpenCover : setLocalIsOpen;

  // Extract initials for the monogram
  const getMonogramInitials = () => {
    if (event.brideName && event.groomName) {
      const b = event.brideName.trim().charAt(0);
      const g = event.groomName.trim().charAt(0);
      return `${b} & ${g}`;
    }
    const parts = event.title.split("&");
    if (parts.length >= 2) {
      return `${parts[0].trim().charAt(0)} & ${parts[1].trim().charAt(0)}`;
    }
    return "C & P";
  };

  const groomVerseRef = "— Mateus 19:6";
  const brideVerseRef = "— Eclesiastes 3:1";

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-[#2C2924] font-serif relative overflow-x-hidden selection:bg-[#dcb349]/30 pb-24">
      
      {/* 1. ENTRANCE SCREEN COVER (CAPA OVERLAY) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: "-100%", transition: { duration: 1.2, ease: [0.77, 0, 0.175, 1] } }}
            className="fixed inset-0 bg-[#0F1419] z-[999] flex flex-col items-center justify-between py-20 px-6 overflow-hidden text-white"
          >
            {/* Fullscreen background image with subtle scale and overlay */}
            <div className="absolute inset-0 z-0 pointer-events-auto">
              <EditableImageWrapper
                src={event.heroImage || "/casalModel.webp"}
                onChange={(newVal) => updateField?.("heroImage", newVal)}
                isEditing={isEditing}
                className="absolute inset-0"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[12s] ease-out-quad scale-105"
                  style={{ backgroundImage: `url('${getImageUrl(event.heroImage || "/casalModel.webp", { width: 1200, quality: 80 })}')` }}
                />
              </EditableImageWrapper>
              
              {/* Dark subtle gradient overlay to guarantee perfect contrast and elite readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-slate-950/50 pointer-events-none" />
            </div>

            {/* Top tiny ornamental line */}
            <div className="w-12 h-[1px] bg-white/20 mt-2 z-10" />

            {/* Central Monogram and Info Card */}
            <div className="flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 my-auto z-10 max-w-xl px-4">
              <motion.div
                initial={{ y: 30, opacity: 0, filter: "blur(6px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.8, duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4 md:space-y-6"
              >
                <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#dcb349] font-sans font-semibold">
                  {isEditing ? (
                    <EditableField
                      value={event.hosts || "A UNIÃO MATRIMONIAL DE"}
                      onChange={(newVal) => updateField?.("hosts", newVal)}
                      isEditing={isEditing}
                      className="text-[#dcb349] text-center bg-transparent"
                    />
                  ) : (
                    event.hosts || "A UNIÃO MATRIMONIAL DE"
                  )}
                </p>
                
                <h1 className="text-5xl md:text-7xl font-serif font-light tracking-wide text-white leading-tight">
                  <EditableField
                    value={event.title}
                    onChange={(newVal) => updateField?.("title", newVal)}
                    isEditing={isEditing}
                    className="text-white text-5xl md:text-7xl font-serif font-light text-center"
                  />
                </h1>
                
                <div className="flex items-center justify-center pt-2">
                  {isEditing ? (
                    <EditableField
                      value={event.date}
                      onChange={(newVal) => updateField?.("date", newVal)}
                      isEditing={isEditing}
                      className="text-slate-200 text-sm md:text-lg text-center font-sans tracking-[0.25em]"
                    />
                  ) : (
                    <span className="text-slate-200 font-sans text-sm md:text-lg tracking-[0.25em]">
                      {event.date ? event.date.replace(/-/g, " • ").replace(/\//g, " • ").replace(/\./g, " • ") : "09 • 08 • 2025"}
                    </span>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Open/VER CONVITE Elegant Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="z-10 flex flex-col items-center space-y-4 mb-4"
            >
              <button
                onClick={() => setIsOpen(true)}
                className="group relative px-10 py-4.5 bg-[#C5A880] hover:bg-[#b49232] text-slate-950 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.4)] text-xs uppercase tracking-[0.25em] font-sans font-bold transition-all duration-500 hover:scale-105 active:scale-95 flex items-center space-x-2.5 cursor-pointer border border-[#C5A880]/20"
              >
                <span className="material-symbols-outlined text-sm text-slate-950 transition-colors">
                  play_arrow
                </span>
                <span>VER CONVITE</span>
              </button>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#C5A880]/70 font-sans">
                Clique para escutar a música
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN WEDDING INVITATION FLOW */}
      {/* 2. HERO HEADER SECTION */}
      <div className="relative min-h-[90vh] md:min-h-[95vh] flex flex-col justify-between items-center py-16 px-6 overflow-hidden">
        {/* Fullscreen hero background under fine frame */}
        <div className="absolute inset-0 p-4 md:p-8">
          <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative shadow-inner">
            <EditableImageWrapper
              src={event.heroImage}
              onChange={(newVal) => updateField?.("heroImage", newVal)}
              isEditing={isEditing}
              className="absolute inset-0"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[12s] scale-105 hover:scale-110"
                style={{ backgroundImage: `url('${getImageUrl(event.heroImage, { width: 1200, quality: 80 })}')` }}
              />
            </EditableImageWrapper>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-slate-950/40" />
          </div>
        </div>

        {/* Content overlaid on fine framed image */}
        <div className="z-10 text-white text-center flex flex-col justify-center items-center flex-1 space-y-4 max-w-xl px-4 mt-8">
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={isOpen ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-xs md:text-sm uppercase tracking-[0.3em] text-[#dcb349] font-sans font-semibold"
          >
            A união matrimonial de
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isOpen ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="text-4xl md:text-6xl font-serif font-light tracking-wide leading-tight"
          >
            <EditableField
              value={event.title}
              onChange={(val) => updateField?.("title", val)}
              isEditing={isEditing}
              className="text-white"
            />
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={isOpen ? { opacity: 0.6 } : {}}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="w-12 h-[1px] bg-white my-2"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isOpen ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-base md:text-xl tracking-[0.2em] font-light text-gray-200"
          >
            <EditableField
              value={event.date}
              onChange={(val) => updateField?.("date", val)}
              isEditing={isEditing}
            />
          </motion.p>
        </div>

        {/* Scroll indicator with gold chevron */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="z-10 text-center text-[#dcb349] flex flex-col items-center mt-auto"
        >
          <span className="material-symbols-outlined text-3xl">keyboard_double_arrow_down</span>
        </motion.div>
      </div>

      {/* 3. LEI DIVINA (THE BEAUTIFUL SCRIPTURE QUOTE BOX) */}
      <div className="max-w-4xl mx-auto py-24 px-6 md:px-12 text-center">
        <FadeInSection>
          <span className="material-symbols-outlined text-[#b49232] text-4xl mb-4">auto_awesome</span>
          <h2 className="text-xl md:text-2xl font-serif text-[#b49232] tracking-wider mb-8">
            <EditableField
              value={event.editableContent?.leiDivinaTitle || "Lei Divina..."}
              onChange={(val) => updateField?.("editableContent.leiDivinaTitle", val)}
              isEditing={isEditing}
              className="text-xl md:text-2xl font-serif text-[#b49232] tracking-wider text-center"
            />
          </h2>
          <div className="relative p-8 md:p-12 border border-[#dcb349]/20 rounded-[2rem] bg-white/60 backdrop-blur-sm shadow-sm max-w-2xl mx-auto">
            {/* Fine decoration lines in corners */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-[#dcb349]/30 rounded-tl-xl" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-[#dcb349]/30 rounded-tr-xl" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-[#dcb349]/30 rounded-bl-xl" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-[#dcb349]/30 rounded-br-xl" />

            <div className="text-slate-700 leading-relaxed font-serif italic text-base md:text-lg space-y-4">
              <EditableField
                value={event.description}
                onChange={(val) => updateField?.("description", val)}
                isEditing={isEditing}
                multiline
              />
            </div>
          </div>
        </FadeInSection>
      </div>

      {/* 4. THE NOIVOS SECTION ("Os Noivos") */}
      <div className="max-w-6xl mx-auto py-16 px-6 md:px-12">
        <FadeInSection className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-[#b49232] font-semibold mb-2 font-sans">
            <EditableField
              value={event.editableContent?.noivosSectionPreTitle || "Apresentamos"}
              onChange={(val) => updateField?.("editableContent.noivosSectionPreTitle", val)}
              isEditing={isEditing}
              className="text-xs uppercase tracking-[0.25em] text-[#b49232] font-semibold font-sans text-center"
            />
          </p>
          <h2 className="text-3xl md:text-4xl font-serif text-slate-800">
            <EditableField
              value={event.editableContent?.noivosSectionTitle || "Os Noivos"}
              onChange={(val) => updateField?.("editableContent.noivosSectionTitle", val)}
              isEditing={isEditing}
              className="text-3xl md:text-4xl font-serif text-slate-800 text-center"
            />
          </h2>
          <div className="w-16 h-[1px] bg-[#dcb349]/30 mx-auto mt-4" />
        </FadeInSection>

        {/* Groom, Couple Image, and Bride 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
          {/* O NOIVO - Slide in from Left */}
          <motion.div
            initial={{ opacity: 0, x: -60, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 2.4,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.1,
            }}
            className="order-2 lg:order-1 bg-white border border-[#dcb349]/10 rounded-[2.5rem] p-8 text-center shadow-sm relative hover:shadow-md transition-shadow duration-500 will-change-[transform,opacity]"
          >
            {/* Fine luxury header line */}
            <div className="w-12 h-[2px] bg-[#dcb349]/20 mx-auto mb-6" />
            
            <h3 className="text-2xl font-serif text-slate-800 font-medium mb-1">
              <EditableField
                value={event.groomName || "Pedro Palate Jr"}
                onChange={(val) => updateField?.("groomName", val)}
                isEditing={isEditing}
              />
            </h3>
            
            <p className="text-[11px] uppercase tracking-widest text-[#b49232] font-sans font-bold mb-4">
              Filho de: <br/>
              <EditableField
                value={event.groomParents || "Angélica Palate e Pedro Palate"}
                onChange={(val) => updateField?.("groomParents", val)}
                isEditing={isEditing}
                className="text-xs mt-1"
                multiline
              />
            </p>

            <div className="text-slate-600 text-sm leading-relaxed font-serif mt-6 px-2">
              <p className="min-h-[40px]">
                <EditableField
                  value={event.editableContent?.groomStory || '"Este é o nosso primeiro e único casamento, e não poderia estar mais feliz por dar esse passo com alguém tão incrível. Não é só um “sim” diante do altar. É um “sim” para a vida toda: para os sonhos, os planos, os desafios e todas as alegrias que virão. E queremos dividir esse momento com você."'}
                  onChange={(val) => updateField?.("editableContent.groomStory", val)}
                  isEditing={isEditing}
                  multiline
                  className="text-slate-600 text-sm leading-relaxed font-serif text-center"
                />
              </p>
              <span className="block text-xs font-semibold text-[#b49232] mt-4">
                <EditableField
                  value={event.editableContent?.groomVerseRef || "— Mateus 19:6"}
                  onChange={(val) => updateField?.("editableContent.groomVerseRef", val)}
                  isEditing={isEditing}
                  className="text-xs font-semibold text-[#b49232] text-center"
                />
              </span>
            </div>
          </motion.div>

          {/* FOTO DO CASAL - Center zoomIn animation exactly like original */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 2.5,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2,
            }}
            className="order-1 lg:order-2 bg-white border border-[#dcb349]/20 rounded-[2.5rem] p-4 shadow-md relative hover:shadow-lg transition-all duration-500 will-change-[transform,opacity]"
          >
            {/* Fine dual gold border detailing */}
            <div className="absolute inset-2 border border-[#dcb349]/10 rounded-[2rem] pointer-events-none" />
            
            <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden group shadow-inner">
              <EditableImageWrapper
                src={event.heroImage || "/casalModel.webp"}
                onChange={(newVal) => updateField?.("heroImage", newVal)}
                isEditing={isEditing}
                className="absolute inset-0"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[8s] ease-out group-hover:scale-105"
                  style={{ backgroundImage: `url('${getImageUrl(event.heroImage || "/casalModel.webp", { width: 800, quality: 80 })}')` }}
                />
              </EditableImageWrapper>
              
              {/* Subtle lighting overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </motion.div>

          {/* A NOIVA - Slide in from Right */}
          <motion.div
            initial={{ opacity: 0, x: 60, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 2.4,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.1,
            }}
            className="order-3 lg:order-3 bg-white border border-[#dcb349]/10 rounded-[2.5rem] p-8 text-center shadow-sm relative hover:shadow-md transition-shadow duration-500 will-change-[transform,opacity]"
          >
            {/* Fine luxury header line */}
            <div className="w-12 h-[2px] bg-[#dcb349]/20 mx-auto mb-6" />
            
            <h3 className="text-2xl font-serif text-slate-800 font-medium mb-1">
              <EditableField
                value={event.brideName || "Chany Huó"}
                onChange={(val) => updateField?.("brideName", val)}
                isEditing={isEditing}
              />
            </h3>
            
            <p className="text-[11px] uppercase tracking-widest text-[#b49232] font-sans font-bold mb-4">
              Filha de: <br/>
              <EditableField
                value={event.brideParents || "Ilda Dique e Jorge Dique"}
                onChange={(val) => updateField?.("brideParents", val)}
                isEditing={isEditing}
                className="text-xs mt-1"
                multiline
              />
            </p>

            <div className="text-slate-600 text-sm leading-relaxed font-serif mt-6 px-2">
              <p className="min-h-[40px]">
                <EditableField
                  value={event.editableContent?.brideStory || '"O coração bate mais forte a cada dia… Mal posso esperar para começar a nossa vida juntos, lado a lado, com Deus no centro e amor em cada passo."'}
                  onChange={(val) => updateField?.("editableContent.brideStory", val)}
                  isEditing={isEditing}
                  multiline
                  className="text-slate-600 text-sm leading-relaxed font-serif text-center"
                />
              </p>
              <span className="block text-xs font-semibold text-[#b49232] mt-4">
                <EditableField
                  value={event.editableContent?.brideVerseRef || "— Eclesiastes 3:1"}
                  onChange={(val) => updateField?.("editableContent.brideVerseRef", val)}
                  isEditing={isEditing}
                  className="text-xs font-semibold text-[#b49232] text-center"
                />
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 5. THE AGENDA & CHRONOGRAM SECTION */}
      <div className="bg-[#FAF7F2] py-24 border-y border-[#dcb349]/10">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <FadeInSection className="text-center mb-16">
            <span className="material-symbols-outlined text-[#b49232] text-3xl mb-3">calendar_month</span>
            <h2 className="text-3xl font-serif text-slate-800">
              Agenda do Grande Dia
            </h2>
            <p className="text-xs uppercase tracking-widest text-[#b49232] font-sans font-bold mt-2">
              <EditableField
                value={event.date}
                onChange={(val) => updateField?.("date", val)}
                isEditing={isEditing}
              />
            </p>
            
            <div className="max-w-xl mx-auto mt-6 text-sm text-slate-600 leading-relaxed font-serif">
              <p className="min-h-[45px]">
                <EditableField
                  value={event.editableContent?.agendaDescription || "Temos a honra de convidá-lo(a) a comemorar esta data especial connosco. Venha juntar-se a nós e celebrar de acordo com a agenda abaixo:"}
                  onChange={(val) => updateField?.("editableContent.agendaDescription", val)}
                  isEditing={isEditing}
                  multiline
                  className="text-sm text-slate-600 leading-relaxed font-serif text-center"
                />
              </p>
            </div>
          </FadeInSection>

          {/* Timeline events */}
          <div className="max-w-2xl mx-auto space-y-8 relative">
            {/* Center line decorator */}
            <div className="absolute top-2 bottom-2 left-6 md:left-1/2 -translate-x-[0.5px] w-[1px] bg-[#dcb349]/30 pointer-events-none" />

            {event.timeline && event.timeline.map((item, idx) => (
              <FadeInSection key={idx}>
                <div className={`flex flex-col md:flex-row items-start ${idx % 2 === 0 ? "md:flex-row-reverse" : ""} relative`}>
                  {/* Timeline point */}
                  <div className="absolute top-1 left-6 md:left-1/2 -translate-x-[8px] w-4 h-4 rounded-full bg-white border border-[#dcb349] z-10 flex items-center justify-center shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#dcb349]" />
                  </div>

                  {/* Left spacer block for desktop */}
                  <div className="hidden md:block md:w-1/2" />

                  {/* Content card */}
                  <div className="w-full md:w-1/2 pl-14 md:pl-0 md:px-8">
                    <div className="bg-white border border-[#dcb349]/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-lg font-serif font-bold text-[#b49232] tracking-wide">
                          <EditableField
                            value={item.time}
                            onChange={(val) => updateTimelineItem?.(idx, "time", val)}
                            isEditing={isEditing}
                          />
                        </span>
                        {isEditing && (
                          <button
                            onClick={() => deleteTimelineItem?.(idx)}
                            className="text-xs text-red-500 hover:underline flex items-center gap-1 font-sans font-bold"
                          >
                            <span className="material-symbols-outlined text-[10px]">delete</span> Excluir
                          </button>
                        )}
                      </div>
                      
                      <h4 className="text-base font-serif font-semibold text-slate-800 mb-1">
                        <EditableField
                          value={item.title}
                          onChange={(val) => updateTimelineItem?.(idx, "title", val)}
                          isEditing={isEditing}
                        />
                      </h4>
                      
                      <p className="text-xs text-slate-500 leading-relaxed">
                        <EditableField
                          value={item.description}
                          onChange={(val) => updateTimelineItem?.(idx, "description", val)}
                          isEditing={isEditing}
                          multiline
                        />
                      </p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>

          {/* Location details card */}
          <FadeInSection className="mt-16 text-center max-w-md mx-auto">
            <div className="bg-white border border-[#dcb349]/20 rounded-3xl p-8 shadow-sm">
              <span className="material-symbols-outlined text-[#b49232] text-2xl mb-2">location_on</span>
              <h4 className="text-lg font-serif text-slate-800 font-semibold mb-1">
                <EditableField
                  value={event.locationName}
                  onChange={(val) => updateField?.("locationName", val)}
                  isEditing={isEditing}
                />
              </h4>
              <p className="text-xs text-slate-500 mb-6">
                <EditableField
                  value={event.address}
                  onChange={(val) => updateField?.("address", val)}
                  isEditing={isEditing}
                  multiline
                />
              </p>
              
              {event.mapLink && (
                <button
                  onClick={() => window.open(event.mapLink, "_blank")}
                  className="px-6 py-3 bg-white border border-[#dcb349] text-[#b49232] rounded-full text-xs uppercase tracking-[0.15em] font-sans font-bold hover:bg-[#dcb349] hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">map</span> Ver Localização / Mapa
                </button>
              )}
            </div>
          </FadeInSection>
        </div>
      </div>

      {/* 6. GUESTBOOK / MURAL DE RECADOS (FELICITAÇÕES) */}
      <div className="py-24 max-w-4xl mx-auto px-6 md:px-12">
        <FadeInSection>
          <div className="text-center mb-12">
            <span className="material-symbols-outlined text-[#b49232] text-3xl mb-2">forum</span>
            <h2 className="text-3xl font-serif text-slate-800">
              Felicitações & Votos
            </h2>
            <div className="w-12 h-[1px] bg-[#dcb349]/30 mx-auto mt-4" />
          </div>

          {isPremium && <Guestbook eventId={event.id} layoutMode={event.layoutMode} />}
        </FadeInSection>
      </div>

      {/* 7. GIFTS / PRESENTES (IBAN INFO) */}
      {event.gifts && event.gifts.length > 0 && (
        <div className="py-24 bg-white border-t border-[#dcb349]/10">
          <div className="max-w-4xl mx-auto px-6 md:px-12">
            <FadeInSection className="text-center mb-12">
              <span className="material-symbols-outlined text-[#b49232] text-3xl mb-2">volunteer_activism</span>
              <h2 className="text-2xl md:text-3xl font-serif text-slate-800">Lista de Presentes</h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">Mimos em Dinheiro / Apoio</p>
              <div className="w-12 h-[1px] bg-[#dcb349]/30 mx-auto mt-4" />
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {event.gifts.map((gift, i) => (
                <FadeInSection key={i} className="bg-[#FCFAF6] border border-[#dcb349]/10 rounded-2xl p-6 shadow-sm">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#b49232] opacity-80 block mb-2">
                    {gift.type === "IBAN" ? "Transferência Bancária" : "Link Externo"}
                  </span>
                  <h4 className="text-base font-serif font-bold text-slate-800 mb-1">{gift.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{gift.description}</p>
                  
                  {gift.type === "IBAN" && (
                    <div className="bg-white border border-[#dcb349]/10 rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm">
                      <div className="truncate">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">{gift.bankName || "BAI"}</span>
                        <code className="text-[11px] font-mono font-bold text-slate-700 select-all">{gift.value}</code>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(gift.value);
                          toast.success("IBAN copiado!");
                        }}
                        className="text-[10px] font-sans font-bold text-[#b49232] uppercase hover:underline shrink-0"
                      >
                        Copiar
                      </button>
                    </div>
                  )}
                </FadeInSection>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. RSVP FLOATING / FIXED ACTION CARD */}
      <div className="py-24 text-center max-w-xl mx-auto px-6">
        <FadeInSection className="bg-white border border-[#dcb349]/20 rounded-[2.5rem] p-10 shadow-sm relative">
          <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[#dcb349]/30" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-[#dcb349]/30" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-[#dcb349]/30" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[#dcb349]/30" />

          <span className="material-symbols-outlined text-[#b49232] text-3xl mb-2">rsvp</span>
          <h2 className="text-2xl font-serif text-slate-800 mb-3">Sua Presença</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-8 max-w-sm mx-auto">
            Se recebeu este convite significa que é nosso convidado de honra e a sua presença é importante para nós. Por favor confirme a sua presença para melhor nos organizarmos.
          </p>

          <button
            onClick={onRSVP}
            className="w-full max-w-xs bg-[#dcb349] hover:bg-[#b49232] text-white py-4 rounded-full font-bold shadow-lg text-xs uppercase tracking-[0.2em] transition-all duration-300 active:scale-95"
          >
            {getRSVPText(event.type, "Confirmar Presença")}
          </button>
        </FadeInSection>
      </div>

      {/* FOOTER */}
      <footer className="text-center py-12 text-[10px] text-slate-400 tracking-wider font-sans uppercase">
        {!isPremium ? <p>© 2025 {event.title} • Criado com InoEvents</p> : <p>© 2025 {event.title}</p>}
      </footer>
    </div>
  );
};

// ============================================================================
// CLONE LAYOUT: LIMINTSO ME (Marnela & Evandro Elegant Wedding Clone)
// ============================================================================
const LimintsoMeLayout: React.FC<{
  event: EventDetails;
  onRSVP: () => void;
  onCheckStatus?: () => void;
  guestName?: string;
  isEditing?: boolean;
  isOpenCover?: boolean;
  setIsOpenCover?: (open: boolean) => void;
  onEditSection?: (section: any) => void;
  updateField?: (field: string, value: any) => void;
  deleteTimelineItem?: (index: number) => void;
  updateTimelineItem?: (
    index: number,
    field: "time" | "title" | "description",
    value: string,
  ) => void;
}> = ({
  event,
  onRSVP,
  onCheckStatus,
  isEditing,
  isOpenCover,
  setIsOpenCover,
  updateField,
  deleteTimelineItem,
  updateTimelineItem,
  guestName,
}) => {
  const isPremium = isEditing || (event && EVENTS.some((e) => e.id === event.id)) || (event && (event as any).plan && ((event as any).plan === "Premium" || (event as any).plan === "Business" || (event as any).plan === "Corporate"));
  const [localIsOpen, setLocalIsOpen] = useState(isEditing ? true : false);
  const isOpen = isOpenCover !== undefined ? isOpenCover : localIsOpen;
  const setIsOpen = setIsOpenCover !== undefined ? setIsOpenCover : setLocalIsOpen;

  // Extract initials for the monogram
  const getMonogramInitials = () => {
    if (event.brideName && event.groomName) {
      const b = event.brideName.trim().charAt(0);
      const g = event.groomName.trim().charAt(0);
      return `${b} & ${g}`;
    }
    const parts = event.title.split("&");
    if (parts.length >= 2) {
      return `${parts[0].trim().charAt(0)} & ${parts[1].trim().charAt(0)}`;
    }
    return "M & E";
  };

  // Safe helper to get/update gallery images
  const getGalleryImage = (index: number, fallback: string) => {
    if (!event.gallery || event.gallery.length <= index) return fallback;
    const item = event.gallery[index];
    return typeof item === "string" ? item : item?.url || fallback;
  };

  const updateGalleryImage = (index: number, newVal: string) => {
    if (!updateField) return;
    const currentGallery = event.gallery || [];
    const newGallery = [...currentGallery];
    
    // Ensure array is padded up to index
    while (newGallery.length <= index) {
      newGallery.push("");
    }
    
    newGallery[index] = newVal;
    updateField("gallery", newGallery);
  };

  // Countdown calculations
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = event.isoDate ? new Date(event.isoDate) : new Date("2025-10-11T11:00:00");
    
    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event.isoDate]);

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-[#121212] font-serif relative overflow-x-hidden selection:bg-[#E9BE5D]/30 pb-24">
      {/* 0. INJECT CUSTOM SIGNATURE FONT AND ANIMATIONS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Josefin+Sans:wght@300;400;600;700&family=Montserrat:wght@300;400;600&family=Quicksand:wght@400;700&display=swap');
        
        @font-face {
          font-family: 'Whispering Signature';
          font-style: normal;
          font-weight: normal;
          font-display: swap;
          src: url('https://in.limintso.com/wp-content/uploads/2025/07/WhisperingSignature.ttf') format('truetype');
        }
        
        .whispering-text {
          font-family: 'Whispering Signature', cursive, sans-serif !important;
        }
        .josefin-font {
          font-family: 'Josefin Sans', sans-serif !important;
        }
        .cinzel-font {
          font-family: 'Cinzel', serif !important;
        }
        .montserrat-font {
          font-family: 'Montserrat', sans-serif !important;
        }
        .quicksand-font {
          font-family: 'Quicksand', sans-serif !important;
        }
      ` }} />

      {/* 1. ENTRANCE SCREEN COVER (CAPA OVERLAY) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: "-100%", transition: { duration: 1.2, ease: [0.77, 0, 0.175, 1] } }}
            className="fixed inset-0 bg-[#000000] z-[999] flex flex-col items-center justify-between py-20 px-6 overflow-hidden text-white"
          >
            {/* Background cover image exactly matching original me-wedding (cav33.jpg as default) */}
            <div className="absolute inset-0 z-0 pointer-events-auto">
              <EditableImageWrapper
                src={event.heroImage || "https://in.limintso.com/wp-content/uploads/2025/08/cav33.jpg"}
                onChange={(newVal) => updateField?.("heroImage", newVal)}
                isEditing={isEditing}
                className="absolute inset-0"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[15s] ease-out-quad scale-105"
                  style={{ backgroundImage: `url('${getImageUrl(event.heroImage || "https://in.limintso.com/wp-content/uploads/2025/08/cav33.jpg", { width: 1200, quality: 80 })}')` }}
                />
              </EditableImageWrapper>
              
              {/* Overlay with subtle dark shade for clean premium legibility */}
              <div className="absolute inset-0 bg-black/45 pointer-events-none" />
            </div>

            {/* A UNIÃO MATRIMONIAL DE */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
              className="z-10 text-center"
            >
              <p className="josefin-font text-base md:text-lg uppercase tracking-[0.3em] text-[#ffffff] font-semibold">
                {isEditing ? (
                  <EditableField
                    value={event.hosts || "A UNIÃO MATRIMONIAL DE"}
                    onChange={(newVal) => updateField?.("hosts", newVal)}
                    isEditing={isEditing}
                    className="text-white text-center bg-transparent"
                  />
                ) : (
                  event.hosts || "A UNIÃO MATRIMONIAL DE"
                )}
              </p>
            </motion.div>

            {/* Marnela & Evandro Display Names */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
              className="z-10 text-center my-auto px-4"
            >
              <h1 className="whispering-text text-6xl md:text-8xl text-white tracking-normal font-normal leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                {isEditing ? (
                  <div className="flex flex-col md:flex-row items-center justify-center gap-2">
                    <EditableField
                      value={event.brideName || "Marnela"}
                      onChange={(newVal) => updateField?.("brideName", newVal)}
                      isEditing={isEditing}
                      className="bg-transparent text-center"
                    />
                    <span className="text-white">&</span>
                    <EditableField
                      value={event.groomName || "Evandro"}
                      onChange={(newVal) => updateField?.("groomName", newVal)}
                      isEditing={isEditing}
                      className="bg-transparent text-center"
                    />
                  </div>
                ) : (
                  `${event.brideName || "Marnela"} & ${event.groomName || "Evandro"}`
                )}
              </h1>
            </motion.div>

            {/* Date and Ver Convite Button at bottom */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
              className="z-10 text-center space-y-8 w-full max-w-sm px-6"
            >
              <p className="josefin-font text-base md:text-lg uppercase tracking-[0.25em] text-[#ffffff] font-medium">
                {isEditing ? (
                  <EditableField
                    value={event.date || "11 • 10 • 2025"}
                    onChange={(newVal) => updateField?.("date", newVal)}
                    isEditing={isEditing}
                    className="text-white text-center bg-transparent"
                  />
                ) : (
                  event.date || "11 • 10 • 2025"
                )}
              </p>

              <button
                onClick={() => setIsOpen(true)}
                className="josefin-font w-full py-4 bg-transparent hover:bg-white text-white hover:text-black border border-white hover:border-transparent rounded-full text-sm uppercase tracking-[0.2em] font-medium transition-all duration-300 transform active:scale-[0.98] shadow-md hover:shadow-xl hover:-translate-y-[2px]"
              >
                Ver Convite
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER (REVEALED CONTENT) */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.6, ease: "easeInOut" }}
          className="space-y-0"
        >
          {/* 2. WELCOME / BEM-VINDO SECTION (inicio) */}
          <div
            id="inicio"
            className="min-h-screen flex flex-col items-center justify-center relative py-24 text-center px-6 overflow-hidden"
          >
            <div className="absolute inset-0 z-0">
              <EditableImageWrapper
                src={getGalleryImage(0, "https://in.limintso.com/wp-content/uploads/2025/08/mar.jpg")}
                onChange={(newVal) => updateGalleryImage(0, newVal)}
                isEditing={isEditing}
                className="absolute inset-0"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${getImageUrl(getGalleryImage(0, "https://in.limintso.com/wp-content/uploads/2025/08/mar.jpg"), { width: 1200, quality: 80 })}')` }}
                />
              </EditableImageWrapper>
            </div>

            {/* Dark glassmorphic background plate for readability */}
            <div className="absolute inset-0 bg-black/60 z-5 pointer-events-none" />
            
            <FadeInSection className="z-10 flex flex-col items-center max-w-2xl mx-auto space-y-8">
              {/* Envelope Icon */}
              <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center text-white animate-pulse">
                <span className="material-symbols-outlined text-4xl text-white">mail</span>
              </div>
              
              <div className="space-y-4">
                <p id="guestNameWelcome" className="josefin-font text-lg md:text-xl font-bold uppercase tracking-[0.2em] text-white">
                  <EditableField
                    value={event.welcomeMessage || "Bem-vindo/a"}
                    onChange={(val) => updateField?.("welcomeMessage", val)}
                    isEditing={isEditing}
                    className="text-center text-white"
                  />
                </p>
                <h2 id="guestName" className="cinzel-font text-2xl md:text-3xl font-normal text-white uppercase tracking-[0.15em] border-b border-white/20 pb-4 px-6 min-w-[200px]">
                  {guestName || "Convidado Especial"}
                </h2>
              </div>
              
              {/* Scrolling Indicator */}
              <span className="material-symbols-outlined text-white/50 text-4xl animate-bounce mt-16">
                keyboard_double_arrow_down
              </span>
            </FadeInSection>
          </div>

          {/* 3. ALIANÇA INABALÁVEL SECTION */}
          <div className="py-24 bg-white text-center px-6 border-b border-stone-200">
            <FadeInSection className="max-w-2xl mx-auto space-y-8">
              {/* Rings Icon */}
              <div className="w-20 h-20 bg-amber-50 rounded-full border border-[#E9BE5D]/20 flex items-center justify-center text-[#E9BE5D] mx-auto">
                <span className="material-symbols-outlined text-4xl text-[#E9BE5D]">favorite</span>
              </div>

              <h2 className="josefin-font text-2xl md:text-3xl font-bold uppercase tracking-[0.2em] text-[#121212]">
                Aliança Inabalável
              </h2>

              <div className="josefin-font text-[#666666] text-base md:text-lg leading-relaxed space-y-4">
                <p className="font-bold text-[#E9BE5D] tracking-widest uppercase">
                  <EditableField
                    value={event.description.split("\n")[0] || "I Coríntios 13: 4-7"}
                    onChange={(val) => {
                      const lines = event.description.split("\n");
                      lines[0] = val;
                      updateField?.("description", lines.join("\n"));
                    }}
                    isEditing={isEditing}
                    className="text-center"
                  />
                </p>
                <div className="italic text-[#121212]">
                  <EditableField
                    value={event.description.split("\n").slice(1).join("\n") || "Aqui começa o nosso lar, erguido sobre a fé e o amor de Deus.\nCada passo que damos é promessa de que ele será sempre o alicerce da nossa Família."}
                    onChange={(val) => {
                      const lines = event.description.split("\n");
                      const first = lines[0] || "I Coríntios 13: 4-7";
                      updateField?.("description", `${first}\n${val}`);
                    }}
                    isEditing={isEditing}
                    multiline
                    className="text-center font-normal leading-relaxed"
                  />
                </div>
              </div>
            </FadeInSection>
          </div>

          {/* 4. OS NOIVOS SECTION */}
          <div id="casal" className="py-24 bg-[#FCFAF6] px-6 md:px-12">
            <div className="max-w-5xl mx-auto space-y-16">
              <FadeInSection className="text-center">
                <h2 className="josefin-font text-3xl md:text-4xl font-semibold uppercase tracking-[0.25em] text-[#121212]">
                  Os Noivos
                </h2>
                <div className="w-16 h-[1px] bg-[#E9BE5D] mx-auto mt-4" />
              </FadeInSection>

              {/* Grid 3 Columns: Groom, Photo, Bride */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                {/* Groom Info */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white border border-[#E9BE5D]/10 rounded-[2rem] p-8 text-center shadow-sm relative space-y-6"
                >
                  <div className="w-12 h-[2px] bg-[#E9BE5D]/30 mx-auto" />
                  <h3 className="josefin-font text-2xl font-bold uppercase tracking-[0.1em] text-[#121212]">
                    <EditableField
                      value={event.groomName || "Evandro Jojó"}
                      onChange={(val) => updateField?.("groomName", val)}
                      isEditing={isEditing}
                    />
                  </h3>
                  <div className="josefin-font text-sm text-[#666666]">
                    <p className="underline uppercase tracking-wider text-[11px] font-bold text-[#E9BE5D] mb-2">Filho de</p>
                    <EditableField
                      value={event.groomParents || "José João Jojó\ne\nAnacanizia Lopes Lima"}
                      onChange={(val) => updateField?.("groomParents", val)}
                      isEditing={isEditing}
                      multiline
                      className="text-center"
                    />
                  </div>
                </motion.div>

                {/* Center Image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white border border-[#E9BE5D]/10 rounded-[2rem] p-4 shadow-sm"
                >
                  <div className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden group">
                    <EditableImageWrapper
                      src={event.mapImage || "https://in.limintso.com/wp-content/uploads/2025/08/marrr11.jpg"}
                      onChange={(newVal) => updateField?.("mapImage", newVal)}
                      isEditing={isEditing}
                      className="absolute inset-0"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url('${getImageUrl(event.mapImage || "https://in.limintso.com/wp-content/uploads/2025/08/marrr11.jpg", { width: 600, quality: 80 })}')` }}
                      />
                    </EditableImageWrapper>
                  </div>
                </motion.div>

                {/* Bride Info */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white border border-[#E9BE5D]/10 rounded-[2rem] p-8 text-center shadow-sm relative space-y-6"
                >
                  <div className="w-12 h-[2px] bg-[#E9BE5D]/30 mx-auto" />
                  <h3 className="josefin-font text-2xl font-bold uppercase tracking-[0.1em] text-[#121212]">
                    <EditableField
                      value={event.brideName || "Marnela Zunguze"}
                      onChange={(val) => updateField?.("brideName", val)}
                      isEditing={isEditing}
                    />
                  </h3>
                  <div className="josefin-font text-sm text-[#666666]">
                    <p className="underline uppercase tracking-wider text-[11px] font-bold text-[#E9BE5D] mb-2">Filha de</p>
                    <EditableField
                      value={event.brideParents || "Jorge Senete Zunguze\ne\nAlia Alexandre Gueze"}
                      onChange={(val) => updateField?.("brideParents", val)}
                      isEditing={isEditing}
                      multiline
                      className="text-center"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Sub-quote section "Ó meu Amor," */}
              <FadeInSection className="text-center space-y-6 pt-12">
                <h2 className="whispering-text text-5xl md:text-6xl text-[#E9BE5D] font-normal tracking-wide">
                  <EditableField
                    value={event.coupleTitle || "Ó meu Amor,"}
                    onChange={(val) => updateField?.("coupleTitle", val)}
                    isEditing={isEditing}
                    className="text-center text-[#E9BE5D]"
                  />
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto text-left leading-relaxed font-serif text-slate-700 text-base italic">
                  {/* Marnela's Quote */}
                  <div className="bg-white border border-[#E9BE5D]/10 rounded-3xl p-8 space-y-4">
                    <div className="min-h-[60px]">
                      <EditableField
                        value={event.brideQuote || "Desde que os meus olhos encontram os seus, a taquicardia tomou conta de mim, era a promessa de Deus se cumprindo. O nosso amor será até após a vinda do Senhor."}
                        onChange={(val) => updateField?.("brideQuote", val)}
                        isEditing={isEditing}
                        multiline
                        className="text-left font-serif leading-relaxed italic"
                      />
                    </div>
                    <p className="josefin-font text-sm font-bold text-[#E9BE5D] uppercase tracking-widest text-right">
                      — {event.brideName?.split(" ")[0] || "Marnela"}
                    </p>
                  </div>
                  
                  {/* Evandro's Quote */}
                  <div className="bg-white border border-[#E9BE5D]/10 rounded-3xl p-8 space-y-4">
                    <div className="min-h-[60px]">
                      <EditableField
                        value={event.groomQuote || "Quando você apareceu no meu caminho, você era a luz que eu precisava para ver as coisas boas ao meu redor. Prometo te amar para sempre e te fazer feliz a cada segundo da sua vida."}
                        onChange={(val) => updateField?.("groomQuote", val)}
                        isEditing={isEditing}
                        multiline
                        className="text-left font-serif leading-relaxed italic"
                      />
                    </div>
                    <p className="josefin-font text-sm font-bold text-[#E9BE5D] uppercase tracking-widest text-right">
                      — {event.groomName?.split(" ")[0] || "Evandro"}
                    </p>
                  </div>
                </div>
              </FadeInSection>
            </div>
          </div>

          {/* 5. THE CONVITE (CEREMONY DETAILS) SECTION */}
          <div
            className="py-24 bg-cover bg-center bg-fixed flex flex-col items-center justify-center relative px-6 text-white text-center"
            style={{ backgroundImage: `url('https://in.limintso.com/wp-content/uploads/2025/03/bible-golden-ring-love-56926.webp')` }}
          >
            {/* Soft tint over church background */}
            <div className="absolute inset-0 bg-[#35100F]/70 pointer-events-none" />

            <FadeInSection className="z-10 max-w-4xl mx-auto space-y-12">
              <span className="material-symbols-outlined text-4xl text-[#E9BE5D] animate-pulse">calendar_month</span>
              <h2 className="josefin-font text-3xl md:text-4xl font-bold uppercase tracking-[0.25em] text-white">
                CONVITE
              </h2>
              <div className="w-16 h-[1px] bg-white/20 mx-auto" />

              <h3 className="josefin-font text-xl md:text-2xl font-semibold uppercase tracking-[0.2em] text-[#E9BE5D]">
                <EditableField
                  value={event.date || "Sábado, 11 de Outubro de 2025"}
                  onChange={(val) => updateField?.("date", val)}
                  isEditing={isEditing}
                  className="text-center text-white"
                />
              </h3>

              {/* Ceremony / Timeline dynamic grid cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto pt-8 text-[#121212]">
                {event.timeline && event.timeline.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: idx * 0.2 }}
                    className="bg-white rounded-3xl p-8 border border-stone-100 shadow-lg relative flex flex-col justify-between min-h-[250px]"
                  >
                    <div className="space-y-4">
                      {/* Ceremony Title */}
                      <h4 className="josefin-font text-lg font-bold uppercase tracking-wider text-[#121212]">
                        <EditableField
                          value={item.title}
                          onChange={(val) => updateTimelineItem?.(idx, "title", val)}
                          isEditing={isEditing}
                        />
                      </h4>
                      
                      {/* Time divider */}
                      <div className="w-10 h-[1px] bg-[#E9BE5D] mx-auto" />
                      
                      {/* Time */}
                      <h5 className="josefin-font text-2xl font-bold text-[#E9BE5D]">
                        <EditableField
                          value={item.time}
                          onChange={(val) => updateTimelineItem?.(idx, "time", val)}
                          isEditing={isEditing}
                        />
                      </h5>
                    </div>

                    <div className="space-y-4 mt-6">
                      {/* Location description */}
                      <p className="montserrat-font text-xs text-slate-500 leading-relaxed">
                        <EditableField
                          value={item.description}
                          onChange={(val) => updateTimelineItem?.(idx, "description", val)}
                          isEditing={isEditing}
                          multiline
                        />
                      </p>

                      {/* Map Button */}
                      {event.mapLink && (
                        <button
                          onClick={() => window.open(event.mapLink, "_blank")}
                          className="josefin-font px-4 py-2 bg-transparent hover:bg-[#E9BE5D] text-[#E9BE5D] hover:text-white border border-[#E9BE5D] rounded-full text-[11px] uppercase tracking-wider font-bold transition-all duration-300 flex items-center justify-center gap-1.5 mx-auto"
                        >
                          <span className="material-symbols-outlined text-sm">map</span> Ver Mapa
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </FadeInSection>
          </div>

          {/* 6. COUNTDOWN SECTION */}
          <div
            className="py-32 bg-cover bg-center flex flex-col items-center justify-center relative px-6 text-white text-center overflow-hidden"
          >
            <div className="absolute inset-0 z-0">
              <EditableImageWrapper
                src={getGalleryImage(1, "https://in.limintso.com/wp-content/uploads/2025/08/mar23.jpg")}
                onChange={(newVal) => updateGalleryImage(1, newVal)}
                isEditing={isEditing}
                className="absolute inset-0"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${getImageUrl(getGalleryImage(1, "https://in.limintso.com/wp-content/uploads/2025/08/mar23.jpg"), { width: 1200, quality: 80 })}')` }}
                />
              </EditableImageWrapper>
            </div>

            {/* Ambient overlay */}
            <div className="absolute inset-0 bg-black/60 z-5 pointer-events-none" />

            <FadeInSection className="z-10 max-w-4xl mx-auto space-y-12">
              <h2 className="josefin-font text-3xl md:text-4xl font-bold uppercase tracking-[0.25em] text-white">
                Falta Pouco ...
              </h2>
              
              <div className="w-12 h-[2px] bg-[#E9BE5D]/40 mx-auto" />

              {/* Countdown Board */}
              <div className="grid grid-cols-4 gap-4 md:gap-8 max-w-2xl mx-auto">
                {/* Days */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 min-w-[70px] md:min-w-[120px] border border-white/10">
                  <span className="josefin-font text-3xl md:text-5xl font-bold block text-[#E9BE5D]">{timeLeft.days}</span>
                  <span className="josefin-font text-[10px] md:text-xs uppercase tracking-widest text-slate-300 block mt-1">Dias</span>
                </div>
                {/* Hours */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 min-w-[70px] md:min-w-[120px] border border-white/10">
                  <span className="josefin-font text-3xl md:text-5xl font-bold block text-[#E9BE5D]">{timeLeft.hours}</span>
                  <span className="josefin-font text-[10px] md:text-xs uppercase tracking-widest text-slate-300 block mt-1">Horas</span>
                </div>
                {/* Minutes */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 min-w-[70px] md:min-w-[120px] border border-white/10">
                  <span className="josefin-font text-3xl md:text-5xl font-bold block text-[#E9BE5D]">{timeLeft.minutes}</span>
                  <span className="josefin-font text-[10px] md:text-xs uppercase tracking-widest text-slate-300 block mt-1">Minutos</span>
                </div>
                {/* Seconds */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 min-w-[70px] md:min-w-[120px] border border-white/10">
                  <span className="josefin-font text-3xl md:text-5xl font-bold block text-white">{timeLeft.seconds}</span>
                  <span className="josefin-font text-[10px] md:text-xs uppercase tracking-widest text-slate-300 block mt-1">Segundos</span>
                </div>
              </div>
            </FadeInSection>
          </div>

          {/* 7. RSVP SECTION */}
          <div className="py-24 bg-white text-center px-6 border-b border-stone-200">
            <FadeInSection className="max-w-xl mx-auto space-y-8">
              <span className="material-symbols-outlined text-4xl text-[#E9BE5D]">how_to_reg</span>
              
              <div className="space-y-2">
                <h2 className="josefin-font text-3xl md:text-4xl font-bold uppercase tracking-[0.2em] text-[#121212]">
                  R.S.V.P
                </h2>
                <h3 className="josefin-font text-lg md:text-xl text-[#666666] tracking-wider italic">
                  Caro(a), {guestName || "Convidado Especial"}
                </h3>
              </div>

              <div className="w-12 h-[1px] bg-[#E9BE5D]/30 mx-auto" />

              <p className="montserrat-font text-sm text-slate-500 leading-relaxed">
                Para nos ajudar a planejar cada detalhe deste dia perfeito com perfeição, confirme a sua ilustre presença clicando no botão abaixo até à data limite informada.
              </p>

              <button
                onClick={onRSVP}
                className="josefin-font px-8 py-4 bg-[#E9BE5D] hover:bg-[#d4ac4c] text-white rounded-full text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                {getRSVPText(event.type, "Confirmar Presença")}
              </button>
            </FadeInSection>
          </div>

          {/* 8. FELICITAÇÕES / GUESTBOOK SECTION */}
          <div className="py-24 bg-[#FCFAF6] px-6 md:px-12 border-b border-stone-200">
            <FadeInSection className="max-w-4xl mx-auto">
              <div className="text-center mb-12 space-y-4">
                <span className="material-symbols-outlined text-3xl text-[#E9BE5D]">forum</span>
                <h2 className="josefin-font text-3xl md:text-4xl font-semibold uppercase tracking-[0.2em] text-[#121212]">
                  Felicitações
                </h2>
                <div className="w-12 h-[1px] bg-[#E9BE5D]/30 mx-auto" />
              </div>

              {isPremium && <Guestbook eventId={event.id} layoutMode={event.layoutMode} />}
            </FadeInSection>
          </div>

          {/* 9. GALERIA (MASONRY GALLERY) SECTION */}
          {event.gallery && event.gallery.length > 0 && (
            <div className="py-24 bg-white px-6 md:px-12 border-b border-stone-200">
              <FadeInSection className="max-w-5xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                  <span className="material-symbols-outlined text-3xl text-[#E9BE5D]">photo_library</span>
                  <h2 className="josefin-font text-3xl md:text-4xl font-semibold uppercase tracking-[0.2em] text-[#121212]">
                    Galeria
                  </h2>
                  <div className="w-12 h-[1px] bg-[#E9BE5D]/30 mx-auto" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {event.gallery.map((img, i) => {
                    const url = typeof img === "string" ? img : img?.url;
                    return (
                      <div
                        key={i}
                        className="aspect-square relative rounded-2xl overflow-hidden shadow-sm group border border-stone-100 bg-stone-50"
                      >
                        <EditableImageWrapper
                          src={typeof url === 'string' ? url : (url as any).url}
                          onChange={(newVal) =>
                            updateField?.(
                              "gallery",
                              event.gallery?.map((g, gi) =>
                                gi === i ? newVal : g,
                              ),
                            )
                          }
                          isEditing={isEditing}
                          className="absolute inset-0"
                        >
                          <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                            style={{ backgroundImage: `url('${getImageUrl(url, { width: 400, quality: 80 })}')` }}
                          />
                        </EditableImageWrapper>
                      </div>
                    );
                  })}
                </div>
              </FadeInSection>
            </div>
          )}

          {/* 10. GIFTS LIST SECTION */}
          {event.gifts && event.gifts.length > 0 && (
            <div className="py-24 bg-[#FCFAF6] border-b border-stone-200">
              <div className="max-w-4xl mx-auto px-6 md:px-12">
                <FadeInSection className="text-center mb-12 space-y-4">
                  <span className="material-symbols-outlined text-3xl text-[#E9BE5D]">volunteer_activism</span>
                  <h2 className="josefin-font text-3xl md:text-4xl font-semibold uppercase tracking-[0.2em] text-[#121212]">Lista de Presentes</h2>
                  <p className="montserrat-font text-xs text-slate-500 uppercase tracking-widest mt-2">Mimos em Dinheiro / Apoio</p>
                  <div className="w-12 h-[1px] bg-[#E9BE5D]/30 mx-auto" />
                </FadeInSection>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  {event.gifts.map((gift, i) => (
                    <FadeInSection key={i} className="bg-white border border-[#E9BE5D]/10 rounded-3xl p-8 shadow-sm text-center space-y-4">
                      <span className="josefin-font text-[10px] uppercase font-bold tracking-widest text-[#E9BE5D] block">
                        {gift.type === "IBAN" ? "Transferência Bancária" : "Link Externo"}
                      </span>
                      <h4 className="josefin-font text-lg font-bold text-slate-800">{gift.title}</h4>
                      <p className="montserrat-font text-xs text-slate-500 leading-relaxed">{gift.description}</p>
                      
                      <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 inline-block w-full">
                        <span className="montserrat-font text-sm font-semibold text-slate-800 tracking-wider select-all block break-all">
                          {gift.value}
                        </span>
                      </div>
                    </FadeInSection>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 11. ENDING FOOTER HERO SECTION */}
          <div
            className="py-32 bg-cover bg-center flex flex-col items-center justify-center relative px-6 text-white text-center overflow-hidden"
          >
            <div className="absolute inset-0 z-0">
              <EditableImageWrapper
                src={getGalleryImage(2, "https://in.limintso.com/wp-content/uploads/2025/08/marb2222.jpg")}
                onChange={(newVal) => updateGalleryImage(2, newVal)}
                isEditing={isEditing}
                className="absolute inset-0"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${getImageUrl(getGalleryImage(2, "https://in.limintso.com/wp-content/uploads/2025/08/marb2222.jpg"), { width: 1200, quality: 80 })}')` }}
                />
              </EditableImageWrapper>
            </div>

            {/* Ambient overlay */}
            <div className="absolute inset-0 bg-[#35100F]/65 z-5 pointer-events-none" />

            <FadeInSection className="z-10 max-w-xl mx-auto space-y-6">
              <h2 className="josefin-font text-2xl md:text-3xl font-bold uppercase tracking-[0.2em] text-white">
                <EditableField
                  value={event.footerMessage || "Estamos ansiosos para celebrar este dia especial com você!"}
                  onChange={(val) => updateField?.("footerMessage", val)}
                  isEditing={isEditing}
                  multiline
                  className="text-center text-white"
                />
              </h2>
            </FadeInSection>
          </div>
        </motion.div>
      )}

      {/* FOOTER */}
      <footer className="text-center py-12 text-[10px] text-slate-400 tracking-wider font-sans uppercase">
        {!isPremium ? <p>© 2025 {event.title} • Criado com InoEvents</p> : <p>© 2025 {event.title}</p>}
      </footer>
    </div>
  );
};

// ============================================================================
const ConfettiBurst: React.FC<{ count?: number }> = ({ count = 30 }) => {
  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#34D399'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-50">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360 + Math.random() * 20;
        const distance = 80 + Math.random() * 140;
        const radian = (angle * Math.PI) / 180;
        const x = Math.cos(radian) * distance;
        const y = Math.sin(radian) * distance;
        const rotation = Math.random() * 360;
        const size = 6 + Math.random() * 10;
        const delay = Math.random() * 0.12;
        const color = colors[Math.floor(Math.random() * colors.length)];

        return (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              scale: [0, 1.2, 0.8, 0],
              x: x,
              y: y,
              rotate: rotation + 180,
              opacity: [1, 1, 0.8, 0],
            }}
            transition={{
              duration: 1.3,
              ease: "easeOut",
              delay: delay,
            }}
            className="absolute rounded-sm"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
            }}
          />
        );
      })}
    </div>
  );
};

const AnimatedCheckmark: React.FC<{ className?: string }> = ({ className = "w-10 h-10 text-emerald-500" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <motion.path
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 130,
        damping: 14,
        delay: 0.15,
      }}
      d="M20 6L9 17l-5-5"
    />
  </svg>
);

const RSVPForm: React.FC<{ event: EventDetails; onClose: () => void }> = ({
  event,
  onClose,
}) => {
  const isLuxury =
    event.layoutMode === "LUXURY" ||
    event.layoutMode === "INDUSTRIAL" ||
    event.layoutMode === "LIMINTSO_GOLD" ||
    event.layoutMode === "LIMINTSO_ME";
  const isBridal = event.type === "BRIDAL_SHOWER";
  const [status, setStatus] = useState<"yes" | "no">("yes");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companions, setCompanions] = useState(0);
  const [message, setMessage] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const sanitizeInput = (val: string): string => {
    if (!val) return "";
    // Remove HTML tags, javascript: protocols, and escape dangerous characters
    let clean = val.replace(/<[^>]*>/g, "").trim();
    // Strip javascript: pseudo-protocol to prevent protocol-based XSS
    clean = clean.replace(/javascript:/gi, "");
    // Strip onxxx event handlers (e.g., onload, onerror, onclick)
    clean = clean.replace(/\bon[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "");
    return clean;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeInput(name);
    const cleanMessage = sanitizeInput(message);
    const cleanDietary = sanitizeInput(dietaryRestrictions);

    if (!cleanName) {
      toast.error("Por favor, informe seu nome completo.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Por favor, informe seu número de telefone.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Verificando...");
    try {
            const normalizedPhone = phone.trim().replace(/[\s\-()]/g, "");
      const guestData = {
        name: cleanName,
        phone: normalizedPhone,
        status: status === "yes" ? "CONFIRMED" : "DECLINED",
        adults: status === "yes" ? companions + 1 : 0,
        children: 0,
        message: cleanMessage,
        dietaryRestrictions: cleanDietary,
        checkedIn: false,
      };

      const res = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, guestData }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Erro ao confirmar presença.", { id: toastId });
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      const guestId = data.guestId;
      toast.success(
        status === "yes"
          ? "Sua presença foi confirmada com sucesso!"
          : "Sua justificativa foi enviada com sucesso.",
        { id: toastId },
      );

      if (status === "yes") {
        setSuccessData({ id: guestId, name: name.trim() });
      } else {
        onClose();
      }
    } catch (err) {
      console.error("Erro ao salvar RSVP:", err);
      toast.error("Erro ao enviar sua resposta. Tente novamente.", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR_Code_${successData?.name || "Convite"}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  if (successData) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: {
              staggerChildren: 0.12,
              delayChildren: 0.1,
            },
          },
        }}
        className={`flex flex-col items-center justify-center py-6 relative overflow-hidden ${
          isLuxury ? "text-white" : "text-slate-800"
        }`}
      >
        <ConfettiBurst count={30} />

        <motion.div
          variants={{
            hidden: { scale: 0, rotate: -45 },
            visible: { 
              scale: 1, 
              rotate: 0,
              transition: { type: "spring", stiffness: 200, damping: 14 } 
            }
          }}
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-md ${
            isLuxury 
              ? "bg-[#BF9B30]/10 border-2 border-[#BF9B30]/40 text-[#BF9B30]" 
              : "bg-emerald-50 border-2 border-emerald-500/20 text-emerald-500"
          }`}
        >
          <AnimatedCheckmark className={`w-10 h-10 ${isLuxury ? "text-[#BF9B30]" : "text-emerald-500"}`} />
        </motion.div>

        <motion.h3 
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 15 } }
          }}
          className="text-2xl font-black text-center tracking-tight mb-2"
        >
          Presença Confirmada!
        </motion.h3>

        <motion.p
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 15 } }
          }}
          className={`text-sm text-center max-w-xs mb-6 px-2 leading-relaxed ${
            isLuxury ? "text-gray-300" : "text-slate-500"
          }`}
        >
          Muito obrigado, <span className="font-semibold">{successData.name}</span>! Guarde este QR Code, ele será seu passe de entrada no dia do evento.
        </motion.p>

        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.9, y: 20 },
            visible: { 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: { type: "spring", stiffness: 150, damping: 18 } 
            }
          }}
          className="p-5 bg-white border border-slate-100 rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.06)] mb-8 flex flex-col items-center justify-center"
        >
          <QRCodeSVG
            id="qr-code-svg"
            value={`guest=${successData.id}`}
            size={180}
            level="H"
            includeMargin={true}
          />
          <span className="text-[10px] text-slate-400 font-mono tracking-wider mt-3 uppercase">Passe de Entrada</span>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 15 } }
          }}
          className="flex gap-3 w-full max-w-xs mt-2"
        >
          <button
            onClick={handleDownloadQR}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
              isLuxury
                ? "bg-transparent border-2 border-[#BF9B30] text-[#BF9B30] hover:bg-[#BF9B30]/10"
                : "bg-white border border-slate-200 text-brand-blue hover:bg-slate-50 shadow-sm"
            }`}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Baixar QR
          </button>
          <button
            onClick={onClose}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${
              isLuxury
                ? "bg-[#BF9B30] text-black hover:bg-[#BF9B30]/90 shadow-md"
                : "bg-slate-900 text-white hover:bg-slate-800 shadow-md"
            }`}
          >
            Fechar
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <p className={`text-sm ${isLuxury ? "text-gray-400" : "opacity-70"}`}>
        {isBridal
          ? "Por favor, confirme sua presença no chá de panela."
          : `Por favor, confirme sua presença para o evento de ${event.title}.`}
      </p>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setStatus("yes")}
          disabled={loading}
          className={`flex-1 py-3 border rounded-lg text-sm font-bold transition-all ${
            status === "yes"
              ? isLuxury
                ? "bg-[#BF9B30] text-black border-[#BF9B30]"
                : "bg-brand-blue text-white border-brand-blue"
              : isLuxury
                ? "border-gray-600 text-gray-300 hover:border-gray-500"
                : "border-gray-200 text-gray-400"
          }`}
        >
          {isBridal ? "Vou no Chá!" : "Sim, estarei lá"}
        </button>
        <button
          type="button"
          onClick={() => setStatus("no")}
          disabled={loading}
          className={`flex-1 py-3 border rounded-lg text-sm font-bold transition-all ${
            status === "no"
              ? isLuxury
                ? "bg-red-900/80 text-white border-red-800"
                : "bg-red-50 text-red-600 border-red-200"
              : isLuxury
                ? "border-gray-600 text-gray-300 hover:border-gray-500"
                : "border-gray-200 text-gray-400"
          }`}
        >
          {isBridal ? "Não vou poder ir" : "Não poderei ir"}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label
            className={`text-xs font-bold uppercase tracking-wider mb-1 block ${isLuxury ? "text-[#BF9B30]" : "opacity-50"}`}
          >
            Nome Completo
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full bg-transparent border-b py-2 focus:outline-none ${isLuxury ? "border-gray-600 text-white focus:border-[#BF9B30]" : "border-gray-300 text-black focus:border-black"}`}
            placeholder="Seu nome completo"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label
            className={`text-xs font-bold uppercase tracking-wider mb-1 block ${isLuxury ? "text-[#BF9B30]" : "opacity-50"}`}
          >
            Telefone / Contacto
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`w-full bg-transparent border-b py-2 focus:outline-none ${isLuxury ? "border-gray-600 text-white focus:border-[#BF9B30]" : "border-gray-300 text-black focus:border-black"}`}
            placeholder="Ex: 923 000 000"
            required
            disabled={loading}
          />
        </div>

        {status === "yes" && !isBridal && (
          <div>
            <label
              className={`text-xs font-bold uppercase tracking-wider mb-1 block ${isLuxury ? "text-[#BF9B30]" : "opacity-50"}`}
            >
              Acompanhantes
            </label>
            <select
              value={companions}
              onChange={(e) => setCompanions(parseInt(e.target.value))}
              className={`w-full bg-transparent border-b py-2 focus:outline-none ${isLuxury ? "border-gray-600 text-white focus:border-[#BF9B30] [&>option]:text-black" : "border-gray-300 text-black focus:border-black"}`}
              disabled={loading}
            >
              <option value="0">Apenas eu</option>
              <option value="1">+1 Acompanhante</option>
              <option value="2">+2 Acompanhantes</option>
            </select>
          </div>
        )}


        {status === "yes" && (
          <div>
            <label
              className={`text-xs font-bold uppercase tracking-wider mb-1 block ${isLuxury ? "text-[#BF9B30]" : "opacity-50"}`}
            >
              Restrições Alimentares (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Vegetariano, alergia a glúten, nenhuma..."
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
              className={`w-full bg-transparent border-b py-2 focus:outline-none ${isLuxury ? "border-gray-600 text-white focus:border-[#BF9B30] placeholder-gray-600" : "border-gray-300 text-black focus:border-black placeholder-gray-400"}`}
              disabled={loading}
            />
          </div>
        )}
        <div>
          <label
            className={`text-xs font-bold uppercase tracking-wider mb-1 block ${isLuxury ? "text-[#BF9B30]" : "opacity-50"}`}
          >
            {isBridal
              ? "Mensagem para a Noiva (Opcional)"
              : "Mensagem aos Noivos (Opcional)"}
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`w-full bg-transparent border rounded-lg p-3 focus:outline-none text-sm ${isLuxury ? "border-gray-600 text-white focus:border-[#BF9B30]" : "border-gray-200 text-black focus:border-black"}`}
            placeholder={
              status === "yes"
                ? "Mal posso esperar..."
                : "Desejo muitas felicidades..."
            }
            disabled={loading}
          />
        </div>
      </div>

      <Button
        type="submit"
        fullWidth
        variant={isLuxury ? "outline" : "primary"}
        disabled={loading}
        className={
          isLuxury
            ? "border-[#BF9B30] text-[#BF9B30] hover:bg-[#BF9B30] hover:text-black font-bold uppercase tracking-widest"
            : ""
        }
      >
        {loading
          ? "ENVIANDO..."
          : status === "yes"
            ? "ENVIAR RESPOSTA"
            : "ENVIAR JUSTIFICATIVA"}
      </Button>
    </form>
  );
};

export default InvitationView;
