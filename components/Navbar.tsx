import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase, signOut, auth, db, handleFirestoreError, OperationType } from './FirebaseProvider';
import { collection, query, where, getDocs, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const { user, userProfile } = useFirebase();
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);

  // Lock body scroll and force scroll position of mobile drawer to the top on open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        if (mobileMenuRef.current) {
          mobileMenuRef.current.scrollTop = 0;
        }
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);
  
  const isAdmin = user?.email?.toLowerCase() === 'antoniosalvador522@gmail.com' || user?.email === import.meta.env.VITE_ADMIN_EMAIL;

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      const q = query(notificationsRef, orderBy('createdAt', 'desc'));
      
      const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
        const notifsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notifsList);
      }, (error) => {
         console.warn("Could not listen to notifications", error);
      });
      return unsubscribeNotifications;
    } catch(err) {
      console.warn("Failed to listen notifications", err);
    }
  }, [user]);

  const handleMarkAsRead = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', notifId), { read: true });
    } catch(err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleDeleteNotification = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', notifId));
    } catch(err) {
      console.error("Failed to delete notification", err);
    }
  };

  useEffect(() => {
    if (!user) {
      setUserEvents([]);
      return;
    }
    
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where("ownerId", "==", user.uid));
      
      const unsubscribeEvents = onSnapshot(q, (snapshot: any) => {
        const eventsList = snapshot.docs.map((doc: any) => ({
          ...doc.data(),
          id: doc.id
        }));
        setUserEvents(eventsList);
      }, (error: any) => {
        // Suppress missing permissions error during development if rule not exist
        if(error.message.includes("Missing or insufficient permissions")) {
            console.warn("Firestore rules test or missing index error, ignore if dev", error);
        } else {
            handleFirestoreError(error, OperationType.LIST, 'events');
        }
      });
      return unsubscribeEvents;
    } catch(err) {
      console.warn("Failed to set up events listener", err);
    }
  }, [user]);

  const handleCreateEvent = () => {
    navigate('/templates');
  }

  return (
    <>
      {/* Elegant Translucent Blue Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-brand-blue/95 backdrop-blur-md text-white shadow-lg shadow-brand-blue/10 px-4 md:px-6 py-3.5 flex items-center justify-between transition-all border-b border-white/5">
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 md:gap-3 group">
            <img src="/favicon.ico" alt="InoEvents" className="w-8 h-8 md:w-9 md:h-9 rounded-xl object-contain border border-white/10 bg-white/5 p-1 shadow-md group-hover:scale-105 transition-all duration-300" referrerPolicy="no-referrer" />
            <span className="text-white text-base md:text-lg font-sans font-extrabold tracking-tight hidden sm:block bg-gradient-to-r from-white via-blue-50 to-white/95 bg-clip-text text-transparent">
              InoEvents
            </span>
          </Link>

          {/* User Plan Badge and Credits directly in header */}
          {user && (
            <div className="flex items-center gap-1.5 ml-1 sm:ml-2">
              <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold leading-none bg-gradient-to-r from-amber-500/20 to-amber-600/30 text-amber-300 border border-amber-500/20 shadow-sm uppercase tracking-wider flex items-center gap-1 scale-95 md:scale-100">
                <span className="material-symbols-outlined text-[10px] md:text-[12px] text-amber-400">verified</span>
                <span>{userProfile?.plan || 'Essencial'}</span>
              </span>
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-blue-100">
           <a href="/#features" className="hover:text-white transition-colors">Funcionalidades</a>
           <Link to="/plans" className="hover:text-white transition-colors">Preços</Link>
           <a href="https://wa.me/244952815430" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contactos</a>
           <a href="/#faq" className="hover:text-white transition-colors">Perguntas</a>
           <Link to="/about" className="hover:text-white transition-colors">Sobre Nós</Link>
           
           <div className="flex items-center gap-6 pl-2">
             <span className="text-white/20 text-lg font-light select-none">|</span>
             {user ? (
               <div className="flex items-center gap-4 relative group">
                  <span className="cursor-pointer font-semibold text-white flex items-center gap-1 hover:text-blue-200 transition-colors">
                    Meus Eventos <span className="material-symbols-outlined text-sm transition-transform group-hover:rotate-180">expand_more</span>
                  </span>
                  
                  {/* Dropdown Desktop */}
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col overflow-hidden">
                     {userEvents.length > 0 ? (
                        <>
                          <div className="flex flex-col max-h-80 overflow-y-auto w-full max-w-full overflow-hidden">
                            {[...userEvents].reverse().slice(0, 3).map(event => (
                              <Link to={`/dashboard/${event.id}`} key={event.id} className="px-4 py-3 hover:bg-slate-50 text-slate-700 hover:text-brand-blue truncate font-medium text-sm transition-colors border-b border-slate-50 last:border-0 block w-full">
                                {event.title}
                              </Link>
                            ))}
                          </div>
                          {userEvents.length > 3 && (
                            <Link to="/dashboard" className="px-4 py-3 text-primary text-center font-bold text-xs hover:bg-slate-50 transition-colors uppercase tracking-wider bg-slate-50/50 block w-full">
                              Ver todos os eventos ({userEvents.length})
                            </Link>
                          )}
                        </>
                     ) : (
                        <div className="px-4 py-4 text-slate-400 text-sm text-center">Nenhum evento criado.</div>
                     )}
                     {(userProfile?.plan === 'Business' || userProfile?.plan === 'Corporate') && (
                        <Link to="/b2b" className="px-4 py-3 text-brand-blue border-t border-slate-100 text-center font-bold text-xs hover:bg-slate-50 transition-colors uppercase tracking-wider bg-blue-50/50 block w-full">
                           Meu Negócio
                        </Link>
                     )}
                  </div>
                  
                  {/* Real-time Notifications Bell */}
                  <div className="relative ml-2">
                    <button 
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="relative w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/15 border border-white/10 flex items-center justify-center transition-all cursor-pointer select-none outline-none focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[18px] text-white">notifications</span>
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse border border-brand-blue shadow-lg">
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {notificationsOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                          
                          <motion.div 
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl shadow-xl shadow-brand-blue/10 border border-slate-100 z-50 overflow-hidden text-slate-700 flex flex-col"
                          >
                            <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                              <span className="font-bold text-xs tracking-wide text-slate-800 flex items-center gap-1.5 uppercase">
                                <span className="material-symbols-outlined text-sm text-brand-blue">circle_notifications</span>
                                Notificações
                              </span>
                              {notifications.filter(n => !n.read).length > 0 && (
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    for(const n of notifications.filter(notif => !notif.read)) {
                                      await updateDoc(doc(db, 'users', user.uid, 'notifications', n.id), { read: true });
                                    }
                                  }}
                                  className="text-[10px] font-bold text-brand-blue hover:underline uppercase tracking-wider cursor-pointer"
                                >
                                  Lidas
                                </button>
                              )}
                            </div>

                            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 flex flex-col">
                              {notifications.length > 0 ? (
                                notifications.map((n) => (
                                  <div 
                                    key={n.id} 
                                    className={`p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col relative group ${!n.read ? 'bg-blue-50/20' : ''}`}
                                  >
                                    <div className="flex justify-between items-start gap-2 pr-12">
                                      <span className={`font-bold text-xs ${!n.read ? 'text-brand-blue' : 'text-slate-700'}`}>
                                        {n.title}
                                      </span>
                                      <span className="text-[9px] text-slate-400 whitespace-nowrap font-medium mt-0.5">
                                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                                      </span>
                                    </div>
                                    <p className="text-slate-500 text-[11px] leading-relaxed mt-1">{n.message}</p>
                                    
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-white/90 backdrop-blur p-1 rounded-lg border border-slate-100 shadow-sm shadow-brand-blue/5">
                                      {!n.read && (
                                        <button 
                                          onClick={(e) => handleMarkAsRead(n.id, e)} 
                                          className="p-1 hover:bg-blue-50 text-brand-blue rounded flex items-center justify-center transition-colors cursor-pointer"
                                          title="Marcar como lida"
                                        >
                                          <span className="material-symbols-outlined text-[13px]">done</span>
                                        </button>
                                      )}
                                      <button 
                                        onClick={(e) => handleDeleteNotification(n.id, e)} 
                                        className="p-1 hover:bg-red-50 text-red-500 rounded flex items-center justify-center transition-colors cursor-pointer"
                                        title="Eliminar"
                                      >
                                        <span className="material-symbols-outlined text-[13px]">delete</span>
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="py-10 text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-1 bg-white">
                                  <span className="material-symbols-outlined text-2xl text-slate-300">chat_bubble_outline</span>
                                  Nenhuma notificação
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {isAdmin && (
                    <Link to="/admin" className="ml-4 hover:text-primary transition-colors font-semibold text-white flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                      Admin
                    </Link>
                  )}

                  <button onClick={() => signOut(auth)} className="hover:text-red-400 transition-colors font-semibold text-white ml-4">Sair</button>
               </div>
             ) : (
               <Link to="/auth" className="hover:text-primary transition-colors font-semibold text-white">Entrar</Link>
             )}
           </div>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 sm:gap-4 md:hidden">
          <Link to="/plans" className="text-sm font-semibold text-blue-100 hover:text-white transition-colors">Preços</Link>
          {!user && (
            <Link to="/auth" className="text-sm font-semibold text-blue-100 hover:text-white transition-colors">Entrar</Link>
          )}
          
          {/* Mobile Notifications Bell when logged in */}
          {user && (
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/15 flex items-center justify-center transition-all cursor-pointer outline-none"
              >
                <span className="material-symbols-outlined text-[18px] text-white">notifications</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white font-bold text-[8px] rounded-full flex items-center justify-center animate-pulse">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-[-2.5rem] top-full mt-3 w-72 xs:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden text-slate-700 flex flex-col"
                    >
                      <div className="p-3.5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-800 flex items-center gap-1">
                          Notificações
                        </span>
                      </div>
                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div key={n.id} className="p-3 hover:bg-slate-50 relative group flex flex-col">
                              <span className="font-bold text-xs text-brand-blue">{n.title}</span>
                              <p className="text-slate-500 text-[10px] mt-0.5">{n.message}</p>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-slate-400 text-xs">Nenhuma notificação</div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          <button 
           onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
           className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-[20px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-blue/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            ref={mobileMenuRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 p-6 shadow-2xl md:hidden overflow-y-auto flex flex-col font-display"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="font-bold text-2xl text-brand-blue w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined">celebration</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-6 font-semibold text-lg text-slate-700">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">home</span> Início</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </Link>
              
              {user && (
                <div className="flex flex-col gap-4 w-full">
                  <button 
                    onClick={() => setDashboardOpen(!dashboardOpen)} 
                    className="hover:text-primary transition-colors flex items-center justify-between w-full truncate"
                  >
                    <span className="flex items-center gap-3 truncate"><span className="material-symbols-outlined text-slate-400">dashboard</span> Meus Eventos</span>
                    <span className="material-symbols-outlined text-slate-300 text-xl transition-transform duration-300 flex-shrink-0" style={{ transform: dashboardOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      expand_more
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {dashboardOpen && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden w-full"
                      >
                        <div className="flex flex-col gap-3 ml-[38px] bg-slate-50 p-4 rounded-2xl text-base font-medium border border-slate-100 max-h-60 overflow-y-auto w-[calc(100%-38px)]">
                          {userEvents.length > 0 ? (
                            <>
                              {[...userEvents].reverse().slice(0, 3).map(event => (
                                <Link to={`/dashboard/${event.id}`} key={event.id} onClick={() => setMobileMenuOpen(false)} className="hover:text-primary truncate text-slate-600 block py-1 w-full">
                                  {event.title}
                                </Link>
                              ))}
                              {userEvents.length > 3 && (
                                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-primary mt-2 flex items-center gap-1 font-bold truncate">
                                  Ver todos <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 text-sm whitespace-normal">Nenhum evento criado.</span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {(userProfile?.plan === 'Business' || userProfile?.plan === 'Corporate') && (
                  <Link to="/b2b" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
                    <span className="flex items-center gap-3"><span className="material-symbols-outlined text-brand-blue">business_center</span> <span className="font-bold text-brand-blue">Meu Negócio</span></span>
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </Link>
              )}

              {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
                    <span className="flex items-center gap-3"><span className="material-symbols-outlined text-purple-600">admin_panel_settings</span> <span className="font-bold text-purple-600">Admin</span></span>
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </Link>
              )}
              
              <a href="/#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">favorite</span> Funcionalidades</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </a>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">info</span> Sobre Nós</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </Link>
              <a href="https://wa.me/244952815430" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">call</span> Contactos</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </a>
            </div>
            
            <div className="mt-auto pt-8 flex flex-col gap-4">
              {user ? (
                   <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 max-w-[70%]">
                         <div className="w-10 h-10 bg-brand-blue text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                           {userProfile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                         </div>
                         <div className="flex flex-col overflow-hidden w-full">
                           <span className="text-sm font-bold text-brand-blue truncate w-full">{userProfile?.name || user.email}</span>
                           <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Plano {userProfile?.plan || 'Essencial'}</span>
                         </div>
                       </div>
                       <button onClick={() => { signOut(auth); setMobileMenuOpen(false); }} className="text-red-500 bg-red-50 w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl hover:bg-red-100 transition-colors">
                         <span className="material-symbols-outlined text-xl">logout</span>
                       </button>
                     </div>
                     <button 
                       onClick={() => { setMobileMenuOpen(false); handleCreateEvent(); }} 
                       className="w-full py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-blue/90 transition-colors flex items-center justify-center gap-2"
                     >
                       <span className="material-symbols-outlined text-xl">add</span>
                       Criar Evento
                     </button>
                   </div>
              ) : (
                  <div className="flex flex-col gap-3">
                    <Link 
                      to="/auth" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-4 bg-slate-100 text-brand-blue rounded-xl font-bold hover:bg-slate-200 transition-colors text-center"
                    >
                      Entrar na sua conta
                    </Link>
                    <button 
                      onClick={() => { setMobileMenuOpen(false); handleCreateEvent(); }}
                      className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-center shadow-lg shadow-primary/20"
                    >
                      Começar Agora
                    </button>
                  </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

