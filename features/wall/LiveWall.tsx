import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, Maximize, X } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';

export const LiveWall: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [photos, setPhotos] = useState<any[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (!id) return;
        const photosRef = collection(db, 'events', id, 'photos');
        const q = query(photosRef, orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPhotos(msgs);
        });

        return () => unsubscribe();
    }, [id]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative">
            <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl flex items-center gap-2">
                    <Camera className="text-rose-400" size={24} />
                    <span className="font-bold text-white tracking-widest uppercase text-sm">Live Wall</span>
                </div>
                {!isFullscreen && (
                   <Link to={`/dashboard/${id}`} className="bg-white/10 hover:bg-white/20 transition backdrop-blur-md p-3 rounded-2xl flex items-center gap-2 text-sm text-slate-300">
                      Voltar
                   </Link>
                )}
            </div>

            <button 
                onClick={toggleFullscreen}
                className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-2xl text-white transition-all"
            >
                {isFullscreen ? <X size={20} /> : <Maximize size={20} />}
            </button>

            {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-screen opacity-50">
                    <ImageIcon size={64} className="mb-4 text-slate-600" />
                    <h2 className="text-2xl font-bold font-display uppercase tracking-widest text-slate-500">Live Photo Wall</h2>
                    <p className="text-slate-500 mt-2">As fotos carregadas pelos convidados aparecerão aqui.</p>
                </div>
            ) : (
                <div className="min-h-screen p-6 pt-24 overflow-y-auto" style={{
                    columnCount: window.innerWidth > 1024 ? 4 : window.innerWidth > 768 ? 3 : 2,
                    columnGap: '1rem',
                }}>
                    <AnimatePresence>
                        {photos.map((photo, idx) => (
                            <motion.div
                                key={photo.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 100, delay: Math.min(idx * 0.1, 1) }}
                                className="mb-4 break-inside-avoid relative group rounded-2xl overflow-hidden"
                            >
                                <img src={photo.url} alt={`Photo ${idx}`} className="w-full h-auto object-cover rounded-2xl leading-none block" />
                                {photo.author && (
                                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                      <p className="text-white font-bold text-sm">{photo.author}</p>
                                   </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
