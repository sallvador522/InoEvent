import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  limit
} from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
import {
  db,
  handleFirestoreError,
  OperationType,
} from "../../components/FirebaseProvider";
import { useFirebase } from "../../components/FirebaseProvider";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import {
  Calendar,
  Plus,
  Building2,
  Ticket,
  Settings,
  ArrowRight,
  ExternalLink,
  X,
  Trash2,
  Award,
  Sparkles,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "../../components/Navbar";
import { SupportModal } from "../../components/SupportModal";
import { Skeleton } from "../../components/ui/Skeleton";
import { OnboardingWizard } from "./OnboardingWizard";

import { getEventByLayoutMode } from "../../mockData";

export const UserDashboard: React.FC = () => {
  const { user, userProfile } = useFirebase();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [subTab, setSubTab] = useState<"events" | "notifications">("events");
  const [supportOpen, setSupportOpen] = useState(false);
  const navigate = useNavigate();

  // Subscrição em Tempo Real para as Notificações do Usuário
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const notificationsRef = collection(
        db,
        "users",
        user.uid,
        "notifications",
      );
      const q = query(notificationsRef, orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notifsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setNotifications(notifsList);
        },
        (error) => {
          console.warn(
            "Could not listen to user dashboard notifications",
            error,
          );
        },
      );
      return unsubscribe;
    } catch (err) {
      console.warn("Failed to set up notifications listener", err);
    }
  }, [user]);

  const handleMarkAsRead = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "notifications", notifId), {
        read: true,
      });
      toast.success("Notificação lida!");
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleDeleteNotification = async (
    notifId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "notifications", notifId));
      toast.success("Notificação eliminada!");
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      try {
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, where("ownerId", "==", user.uid), limit(50));
        const snap = await getDocs(q);
        const eventsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvents(eventsList);
        if (eventsList.length === 0) {
          setShowWizard(true);
        }
      } catch (err) {
        console.error(err);
        handleFirestoreError(err, OperationType.LIST, "events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user]);

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      // Delete associated storage files (audio, image urls, etc.) before deleting database document
      try {
        const storage = getStorage();
        const urlsToDelete: string[] = [];

        // Audio URL
        if (
          eventToDelete.audioUrl &&
          typeof eventToDelete.audioUrl === "string" &&
          eventToDelete.audioUrl.includes("firebasestorage.googleapis.com")
        ) {
          urlsToDelete.push(eventToDelete.audioUrl);
        }

        // Cover image URL
        if (
          eventToDelete.coverUrl &&
          typeof eventToDelete.coverUrl === "string" &&
          eventToDelete.coverUrl.includes("firebasestorage.googleapis.com")
        ) {
          urlsToDelete.push(eventToDelete.coverUrl);
        }

        // Background image URL
        if (
          eventToDelete.backgroundImage &&
          typeof eventToDelete.backgroundImage === "string" &&
          eventToDelete.backgroundImage.includes(
            "firebasestorage.googleapis.com",
          )
        ) {
          urlsToDelete.push(eventToDelete.backgroundImage);
        }

        // Gallery images
        if (eventToDelete.gallery && Array.isArray(eventToDelete.gallery)) {
          eventToDelete.gallery.forEach((pic: any) => {
            if (
              typeof pic === "string" &&
              pic.includes("firebasestorage.googleapis.com")
            ) {
              urlsToDelete.push(pic);
            } else if (
              pic &&
              typeof pic === "object" &&
              pic.url &&
              typeof pic.url === "string" &&
              pic.url.includes("firebasestorage.googleapis.com")
            ) {
              urlsToDelete.push(pic.url);
            }
          });
        }

        // Run parallelized deletions
        await Promise.all(
          urlsToDelete.map(async (url) => {
            try {
              const fileRef = ref(storage, url);
              await deleteObject(fileRef);
              console.log("Removed storage resource:", url);
            } catch (e) {
              console.warn(
                "Failed or skipped deleting storage resource:",
                url,
                e,
              );
            }
          }),
        );
      } catch (storageErr) {
        console.error("Storage files cleanup failure:", storageErr);
      }

      await deleteDoc(doc(db, "events", eventToDelete.id));
      setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      toast.success("Convite apagado com sucesso!");
      setEventToDelete(null);
    } catch (error) {
      console.error("Erro ao eliminar convite:", error);
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `events/${eventToDelete.id}`,
      );
      toast.error("Erro ao eliminar o convite.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isPartner =
    userProfile?.plan === "Business" || userProfile?.plan === "Corporate";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-20">
        {/* Navbar Skeleton */}
        <div className="h-16 bg-white border-b border-slate-200" />
        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div className="space-y-3">
              <Skeleton className="h-10 w-64 rounded-xl" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-12 w-40 rounded-xl" />
              <Skeleton className="h-12 w-32 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const handleCreateEvent = () => {
    const plan = userProfile?.plan || "Essencial";
    let limit = 2;
    if (plan === "Premium") limit = 5;
    if (plan === "Business" || plan === "Corporate") limit = Infinity;

    // Filter out baby showers and bridal showers from checking limits
    const paidEvents = events.filter((e: any) => e.type !== "BABY_SHOWER" && e.type !== "BRIDAL_SHOWER");

    if (paidEvents.length >= limit) {
      toast.error(
        `Você atingiu o limite de ${limit} convites de casamento do seu plano. Faça upgrade para criar mais!`,
      );
      return;
    }

    navigate("/templates");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Olá, {user?.displayName?.split(" ")[0] || "Usuário"}!
            </h1>
            <p className="text-slate-500">
              Seja bem-vindo ao seu painel de controle.
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setSupportOpen(true)}
              className="hidden sm:flex border-emerald-500/20 text-emerald-600 hover:bg-emerald-50"
            >
              Suporte
            </Button>
            <Button onClick={handleCreateEvent}>
              <Plus size={16} className="mr-2" /> Novo Evento
            </Button>
          </div>
        </div>

        {/* Active Plan Stats & Upgrade Alert Banner */}
        <div className="mb-10">
          <div
            className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${
              userProfile?.plan === "Premium"
                ? "bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border-amber-500/20 shadow-sm"
                : userProfile?.plan === "Business" ||
                    userProfile?.plan === "Corporate"
                  ? "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-800 text-white shadow-xl shadow-slate-950/10"
                  : "bg-gradient-to-r from-blue-50/50 via-slate-50 to-transparent border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-left w-full">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                  userProfile?.plan === "Premium"
                    ? "bg-amber-100 text-amber-600"
                    : userProfile?.plan === "Business" ||
                        userProfile?.plan === "Corporate"
                      ? "bg-white/10 text-amber-400 border border-white/10"
                      : "bg-blue-50 text-brand-blue"
                }`}
              >
                {userProfile?.plan === "Premium" ? (
                  <Sparkles size={22} className="animate-pulse" />
                ) : userProfile?.plan === "Business" ||
                  userProfile?.plan === "Corporate" ? (
                  <Award size={22} />
                ) : (
                  <Zap size={22} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    STATUS DA CONTA
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      userProfile?.plan === "Premium"
                        ? "bg-amber-500/10 text-amber-700 border border-amber-500/10"
                        : userProfile?.plan === "Business" ||
                            userProfile?.plan === "Corporate"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/10"
                          : "bg-slate-200/50 text-slate-600 border border-slate-200"
                    }`}
                  >
                    Plano {userProfile?.plan || "Essencial"}
                  </span>
                  {userProfile?.planExpiresAt && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/80 hidden sm:inline">
                      (Expira:{" "}
                      {new Date(userProfile.planExpiresAt).toLocaleDateString(
                        "pt-BR",
                      )}
                      )
                    </span>
                  )}
                </div>
                <h3
                  className={`text-lg font-serif font-bold mt-1 ${
                    userProfile?.plan === "Business" ||
                    userProfile?.plan === "Corporate"
                      ? "text-white"
                      : "text-slate-800"
                  }`}
                >
                  {userProfile?.plan === "Premium"
                    ? "Seu Evento Sem Limites com Elegância Absoluta"
                    : userProfile?.plan === "Business" ||
                        userProfile?.plan === "Corporate"
                      ? "Cockpit de Agência de Eventos Activado"
                      : "Crie Convites Digitais Interativos Clássicos"}
                </h3>
                <p
                  className={`text-xs mt-1 leading-relaxed max-w-2xl ${
                    userProfile?.plan === "Business" ||
                    userProfile?.plan === "Corporate"
                      ? "text-slate-350"
                      : "text-slate-500 font-medium"
                  }`}
                >
                  {userProfile?.plan === "Business" ||
                   userProfile?.plan === "Corporate"
                      ? "Como parceiro certificado, usufrua de marcas brancas (white-label) dedicadas e criação de eventos ilimitados."
                      : "Pague apenas pelo evento que realizar. Crie convites com RSVP e design Premium sem subscrições mensais chatas."}
                </p>
              </div>
            </div>
            {(!userProfile?.plan || userProfile?.plan === "Essencial") && (
              <Button
                onClick={() => navigate("/plans")}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-lg shadow-brand-blue/15 hover:scale-[1.02] active:scale-95 transition-all outline-none cursor-pointer select-none whitespace-nowrap self-start md:self-center"
              >
                Comprar Novo Convite
              </Button>
            )}
          </div>
        </div>

        {(userProfile?.plan === "Business" ||
          userProfile?.plan === "Corporate") && (
          <div className="mb-10 bg-gradient-to-r from-brand-blue to-blue-700 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-lg shadow-brand-blue/20">
            <div className="text-white mb-6 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">Acessar Painel B2B</h2>
              <p className="text-blue-100 max-w-lg">
                Você possui um plano empresarial. Acesse as ferramentas
                avançadas para gerenciar seus clientes, créditos e simulações.
              </p>
            </div>
            <Button
              className="bg-white text-brand-blue hover:bg-slate-50 whitespace-nowrap"
              onClick={() => navigate("/b2b")}
            >
              Acessar Meu Negócio
            </Button>
          </div>
        )}

        {/* Tab Selection Segments */}
        <div className="flex border-b border-slate-200 mb-8 items-center justify-between">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() => setSubTab("events")}
              className={`pb-4 text-base font-bold tracking-tight relative transition-all cursor-pointer outline-none ${
                subTab === "events"
                  ? "text-brand-blue"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Meus Eventos ({events.length})
              {subTab === "events" && (
                <motion.div
                  layoutId="dashboardActiveTabDecoration"
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-blue rounded-full"
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => setSubTab("notifications")}
              className={`pb-4 text-base font-bold tracking-tight relative transition-all cursor-pointer flex items-center gap-2 outline-none ${
                subTab === "notifications"
                  ? "text-brand-blue"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Notificações ({notifications.length})
              {notifications.some((n) => !n.read) && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
              )}
              {subTab === "notifications" && (
                <motion.div
                  layoutId="dashboardActiveTabDecoration"
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-blue rounded-full"
                />
              )}
            </button>
          </div>
        </div>

        {subTab === "events" ? (
          <>
            {events.length === 0 ? (
              showWizard ? (
                <OnboardingWizard
                  onCancel={() => setShowWizard(false)}
                  onSuccess={() => {
                    // The page will navigate away so no refresh needed
                  }}
                />
              ) : (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mb-4">
                    <Calendar size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    Nenhum evento criado
                  </h3>
                  <p className="text-slate-500 max-w-sm mb-6">
                    Você ainda não criou nenhum convite digital. Que tal começar
                    a jornada agora?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => setShowWizard(true)}
                      className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-none text-white shadow-lg shadow-indigo-100"
                    >
                      <Sparkles
                        size={14}
                        className="animate-pulse text-yellow-300"
                      />{" "}
                      Usar Assistente Guiado
                    </Button>
                    <Button variant="outline" onClick={handleCreateEvent}>
                      Criação Rápida Manual
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event: any) => {
                  const templateDefaults = getEventByLayoutMode(
                    event.layoutMode || "MODERN",
                  );
                  const displayImage =
                    event.heroImage || templateDefaults?.heroImage;
                  return (
                    <div
                      key={event.id}
                      className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-brand-blue/30 hover:shadow-xl hover:shadow-brand-blue/5 transition-all group flex flex-col relative"
                    >
                      <Link to={`/dashboard/${event.id}`} className="block">
                        <div className="h-40 bg-slate-100 relative overflow-hidden">
                          {displayImage ? (
                            <img
                              src={displayImage}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Calendar size={40} />
                            </div>
                          )}
                          <div className="absolute top-4 left-4">
                            <span className={`backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm border ${
                              event.type === 'BABY_SHOWER' 
                                ? 'bg-cyan-50/90 text-cyan-700 border-cyan-200' 
                                : event.type === 'BRIDAL_SHOWER' 
                                  ? 'bg-pink-50/90 text-pink-700 border-pink-200'
                                  : 'bg-white/95 text-brand-blue border-slate-100'
                            }`}>
                              {event.type === 'BABY_SHOWER' ? 'Chá de Bebé' : event.type === 'BRIDAL_SHOWER' ? 'Chá de Panela' : 'Casamento'}
                            </span>
                          </div>
                          <div className="absolute top-4 right-4 z-10">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEventToDelete(event);
                              }}
                              className="w-8 h-8 rounded-full bg-white/95 hover:bg-slate-100 text-slate-500 hover:text-red-500 flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-red-100"
                              title="Eliminar Convite"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </Link>
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">
                          {event.title}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                          {event.date} • {event.time}
                        </p>
                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                          <Link
                            to={`/dashboard/${event.id}`}
                            className="font-bold text-brand-blue flex items-center gap-1"
                          >
                            Acessar Painel <ArrowRight size={14} />
                          </Link>
                          <Button
                            variant="outline"
                           
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(`/invite/${event.id}`, "_blank");
                            }}
                            className="h-8 shadow-sm"
                          >
                            <ExternalLink size={14} className="mr-1.5" /> Ver
                            Convite
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4 max-w-3xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                HISTÓRICO COMPLETO
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={async () => {
                    if (!user) return;
                    try {
                      const { writeBatch, collection, getDocs } =
                        await import("firebase/firestore");
                      const batch = writeBatch(db);
                      const snap = await getDocs(
                        collection(db, "users", user.uid, "notifications"),
                      );
                      snap.docs.forEach((doc) => batch.delete(doc.ref));
                      await batch.commit();
                      toast.success("Histórico limpo!");
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                >
                  Limpar Todas as Notificações
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/50 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-16 text-center flex flex-col items-center justify-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-purple-500/5 opacity-50"></div>
                <div className="w-20 h-20 bg-gradient-to-tr from-slate-100 to-white shadow-inner rounded-full flex items-center justify-center mb-6 relative z-10">
                  <BellOff size={32} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 relative z-10">Caixa de Entrada Limpa</h3>
                <p className="text-slate-500 max-w-sm relative z-10">
                  Não há novas mensagens ou actualizações no momento. Quando algo importante acontecer, avisaremos aqui.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 }
                  }
                }}
                className="space-y-4"
              >
                <AnimatePresence>
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -2 }}
                      onClick={(e) =>
                        !notif.read && handleMarkAsRead(notif.id, e)
                      }
                      className={`group p-5 sm:p-6 rounded-3xl border transition-all duration-300 flex justify-between items-start gap-4 relative overflow-hidden ${
                        notif.read
                          ? "bg-white/60 border-slate-100/50 opacity-75 backdrop-blur-md"
                          : "bg-white/80 border-brand-blue/20 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-brand-blue/40 cursor-pointer backdrop-blur-xl"
                      }`}
                    >
                      {!notif.read && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-blue to-purple-500"></div>
                      )}
                      <div className="flex gap-4 sm:gap-6 relative z-10 w-full">
                        <div
                          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-transform duration-500 group-hover:scale-105 ${
                            notif.read
                              ? "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400"
                              : "bg-gradient-to-br from-blue-50 to-indigo-50 text-brand-blue"
                          }`}
                        >
                          {notif.type === "plan_upgrade" ? (
                            <Gem size={22} className={!notif.read ? "animate-pulse" : ""} />
                          ) : (
                            <Bell size={22} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                            <h4 className={`font-bold text-base ${notif.read ? 'text-slate-700' : 'text-slate-900'}`}>
                              {notif.title || "Notificação InoEvents"}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                              {notif.createdAt
                                ? new Date(notif.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                                : "N/A"}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed ${notif.read ? 'text-slate-500' : 'text-slate-600'}`}>
                            {notif.message}
                          </p>
                          {!notif.read && (
                            <div className="mt-4 flex items-center">
                              <span className="inline-flex items-center gap-1.5 bg-brand-blue/10 text-brand-blue text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse"></span>
                                Nova Atualização
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 shrink-0 relative z-20">
                        <button
                          onClick={(e) => handleDeleteNotification(notif.id, e)}
                          className="w-8 h-8 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 flex items-center justify-center transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}
      </main>

      <AnimatePresence>
        {eventToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-serif text-slate-800 mb-2">
                Eliminar convite?
              </h3>
              <p className="text-slate-500 mb-8">
                Esta ação não pode ser desfeita. Todos os convidados, fotos e
                confirmações de presença associados a{" "}
                <strong>{eventToDelete.title}</strong> serão removidos
                permanentemente.
              </p>
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setEventToDelete(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteEvent}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex justify-center items-center gap-2"
                >
                  {isDeleting ? (
                     <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    "Eliminar!"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SupportModal
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </div>
  );
};
