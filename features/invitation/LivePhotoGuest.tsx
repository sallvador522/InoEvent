import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Upload, Image as ImageIcon, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../components/FirebaseProvider';
import { toast } from 'react-hot-toast';

export const LivePhotoGuest: React.FC<{ eventId: string, eventName: string, guestName?: string }> = ({ eventId, eventName, guestName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [recentPhotos, setRecentPhotos] = useState<any[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const photosRef = collection(db, 'events', eventId, 'photos');
        const q = query(photosRef, orderBy('createdAt', 'desc'), limit(12));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRecentPhotos(msgs);
        });
        return () => unsubscribe();
    }, [eventId, isOpen]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            // Read as data URL to preview (and to upload as string for this demo version)
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    // Create an image to resize it before uploading to Firestore (avoid 1MB limit)
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const MAX_DIM = 800; // Resize large photos

                        if (width > height) {
                            if (width > MAX_DIM) {
                                height *= MAX_DIM / width;
                                width = MAX_DIM;
                            }
                        } else {
                            if (height > MAX_DIM) {
                                width *= MAX_DIM / height;
                                height = MAX_DIM;
                            }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0, width, height);
                        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        setPreview(resizedDataUrl);
                    };
                    img.src = e.target.result.toString();
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!preview) return;
        
        setIsUploading(true);
        try {
            await addDoc(collection(db, 'events', eventId, 'photos'), {
                url: preview,
                author: guestName || 'Convidado',
                createdAt: serverTimestamp()
            });
            toast.success('Foto enviada para o Live Wall!');
            setPreview(null);
        } catch (error: any) {
            console.error(error);
            toast.error('Ocorreu um erro. Tente novamente.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <motion.button 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/30 text-white rounded-full px-5 py-4 flex items-center justify-center gap-2"
                style={{ backdropFilter: 'blur(8px)' }}
            >
                <Camera size={20} />
                <span className="font-bold tracking-wide uppercase text-sm">Live Wall</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
                        >
                            <div className="absolute top-4 right-4 z-10">
                                <button onClick={() => { setIsOpen(false); setPreview(null); }} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-slate-800">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 md:p-8 flex flex-col h-full overflow-y-auto">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold font-display">{eventName} • Live Wall</h2>
                                    <p className="text-slate-500 text-sm mt-1">Carregue ou capture momentos para passarem no telão em tempo real!</p>
                                </div>

                                {!preview ? (
                                    <div className="flex-1 flex flex-col gap-6">
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-rose-300 bg-rose-50 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-rose-100 transition-colors"
                                        >
                                            <div className="bg-white p-4 rounded-full shadow-sm text-rose-500">
                                                <Camera size={40} />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-slate-700">Tirar Fotografia</p>
                                                <p className="text-sm text-slate-500">Ou escolha da galeria</p>
                                            </div>
                                        </div>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleFileSelect} 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            capture="environment" 
                                        />

                                        {recentPhotos.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 ml-2 flex items-center gap-2">
                                                    <ImageIcon size={14} /> Memórias Recentes
                                                </h3>
                                                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                                    {recentPhotos.map(photo => (
                                                        <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                                                            <img src={photo.url} alt="Recente" className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col gap-4">
                                        <div className="flex-1 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                                            <img src={preview} alt="Preview" className="w-full h-auto max-h-[50vh] object-contain" />
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button 
                                                onClick={() => setPreview(null)}
                                                disabled={isUploading}
                                                className="flex-1 py-4 font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                                            >
                                                Mudar Foto
                                            </button>
                                            <button 
                                                onClick={handleUpload}
                                                disabled={isUploading}
                                                className="flex-1 py-4 font-bold text-white bg-rose-500 rounded-2xl hover:bg-rose-600 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                            >
                                                {isUploading ? 'A Enviar...' : <>Enviar <Send size={18} /></>}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
