import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase, signOut, auth, db, handleFirestoreError, OperationType } from './FirebaseProvider';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const { user, userProfile } = useFirebase();
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const navigate = useNavigate();

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
    if (!user) {
        navigate('/auth');
        return;
    }
    navigate('/create-invitation');
  }

  return (
    <>
      {/* Elegant Blue Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-brand-blue text-white shadow-lg shadow-brand-blue/10 px-6 py-4 flex items-center justify-between transition-all">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
          <h2 className="text-white text-xl font-serif font-bold tracking-wide">InoEvents</h2>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-blue-100">
           <a href="/#features" className="hover:text-white transition-colors">Funcionalidades</a>
           <Link to="/plans" className="hover:text-white transition-colors">Preços</Link>
           <a href="mailto:suporte@inoevents.com" className="hover:text-white transition-colors">Contactos</a>
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
               
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white shadow-sm border border-white/10 ml-2">{userProfile?.plan || 'Essencial'}</span>
                  <button onClick={() => signOut(auth)} className="hover:text-red-400 transition-colors font-semibold text-white ml-4">Sair</button>
               </div>
             ) : (
               <Link to="/auth" className="hover:text-primary transition-colors font-semibold text-white">Entrar</Link>
             )}
           </div>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-4 md:hidden">
          <Link to="/plans" className="text-sm font-semibold text-blue-100 hover:text-white transition-colors">Preços</Link>
          {!user && (
            <Link to="/auth" className="text-sm font-semibold text-blue-100 hover:text-white transition-colors">Entrar</Link>
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
              
              <a href="/#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">favorite</span> Funcionalidades</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </a>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">info</span> Sobre Nós</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </Link>
              <a href="mailto:suporte@inoevents.com" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors flex items-center justify-between">
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

