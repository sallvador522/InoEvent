import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Heart } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './FirebaseProvider';
import toast from 'react-hot-toast';

interface PhotoInfo {
  id: string;
  url: string;
  likes: number;
}

interface GalleryLightboxProps {
  eventId: string;
  gallery: Array<string | PhotoInfo>;
  onLikeUpdate: (updatedGallery: Array<PhotoInfo>) => void;
  renderMode: 'ESSENTIAL' | 'CLASSIC' | 'MODERN' | 'GARDEN' | 'RUSTIC' | 'INDUSTRIAL' | 'LUXURY';
}

export const GalleryLightbox: React.FC<GalleryLightboxProps> = ({ eventId, gallery, onLikeUpdate, renderMode }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`liked_photos_${eventId}`);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
    return new Set();
  });

  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`liked_photos_${eventId}`);
      if (stored) {
        setLikedPhotos(new Set(JSON.parse(stored)));
      } else {
        setLikedPhotos(new Set());
      }
    } catch (e) {
      console.error(e);
    }
  }, [eventId]);

  // Normalize photos
  const photos: PhotoInfo[] = gallery.map((item, idx) => {
    if (typeof item === 'string') {
      return { id: `photo-${idx}`, url: item, likes: 0 };
    }
    return item;
  });

  const handleLike = async (index: number) => {
    if (isLiking) return;
    const photo = photos[index];
    if (likedPhotos.has(photo.id)) {
        toast('Você já deixou coração nesta foto.', {icon: '🤍'});
        return;
    }

    setIsLiking(true);
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 1000); // 1 second animation

    try {
      const newPhotos = [...photos];
      newPhotos[index] = { ...photo, likes: (photo.likes || 0) + 1 };
      
      if (eventId !== 'created' && !eventId.startsWith('wedding-') && eventId.trim() !== '') {
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, {
          gallery: newPhotos
        });
      }
      
      const newLikedStatus = new Set([...likedPhotos, photo.id]);
      setLikedPhotos(newLikedStatus);
      try {
        localStorage.setItem(`liked_photos_${eventId}`, JSON.stringify(Array.from(newLikedStatus)));
      } catch (e) {
        console.error(e);
      }
      onLikeUpdate(newPhotos);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes("permissions")) {
        toast.error('Sem permissão para curtir.');
      } else {
        toast.error('Erro ao adicionar coração.');
      }
    } finally {
      setIsLiking(false);
    }
  };

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % photos.length);
  };

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length);
  };

  const renderGrid = () => {
    switch (renderMode) {
      case 'ESSENTIAL':
        return (
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo, i) => (
              <div 
                key={photo.id} 
                onClick={() => setSelectedIndex(i)}
                className={`rounded-xl overflow-hidden shadow-sm cursor-pointer relative group ${i === 0 ? 'col-span-2' : ''}`}
              >
                <img src={photo.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {photo.likes > 0 && (
                  <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 flex items-center gap-1 rounded-full text-xs font-bold text-red-500">
                    <Heart size={12} fill="currentColor" /> {photo.likes}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      case 'CLASSIC':
      case 'GARDEN':
      case 'RUSTIC':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, i) => (
              <div 
                key={photo.id} 
                onClick={() => setSelectedIndex(i)}
                className="aspect-square rounded-2xl overflow-hidden shadow-sm cursor-pointer relative group"
              >
                <img src={photo.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                {photo.likes > 0 && (
                  <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 flex items-center gap-1 rounded-full text-xs font-bold text-red-500">
                    <Heart size={12} fill="currentColor" /> {photo.likes}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      case 'MODERN':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
            {photos.map((photo, i) => (
              <div 
                key={photo.id} 
                onClick={() => setSelectedIndex(i)}
                className={`rounded-lg overflow-hidden shadow-sm cursor-pointer relative group ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
              >
                <img src={photo.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                {photo.likes > 0 && (
                 <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 flex items-center gap-1 rounded-full text-xs font-bold text-red-500">
                   <Heart size={12} fill="currentColor" /> {photo.likes}
                 </div>
               )}
              </div>
            ))}
          </div>
        );
      case 'INDUSTRIAL':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
            {photos.map((photo, i) => (
              <div 
                 key={photo.id} 
                 onClick={() => setSelectedIndex(i)}
                 className="aspect-square overflow-hidden bg-white/5 cursor-pointer relative group"
              >
                 <img src={photo.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                 {photo.likes > 0 && (
                   <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 flex items-center gap-1 rounded-full text-xs font-bold text-red-500">
                     <Heart size={12} fill="currentColor" /> {photo.likes}
                   </div>
                 )}
              </div>
            ))}
          </div>
        );
      case 'LUXURY':
        return (
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
             {photos.map((photo, i) => (
                <div key={photo.id} onClick={() => setSelectedIndex(i)} className="relative shrink-0 cursor-pointer group">
                  <img src={photo.url} className="h-48 w-36 object-cover rounded-lg border border-[#BF9B30]/20 grayscale group-hover:grayscale-0 transition-all duration-500" />
                  {photo.likes > 0 && (
                    <div className="absolute bottom-2 right-2 bg-[#0A0D10]/90 px-2 py-1 flex items-center gap-1 rounded-full text-[10px] font-bold text-[#BF9B30] border border-[#BF9B30]/30">
                       <Heart size={10} fill="currentColor" /> {photo.likes}
                    </div>
                  )}
                </div>
             ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderGrid()}

      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Toolbar */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
              <div className="text-white font-mono text-sm tracking-widest">
                {selectedIndex + 1} / {photos.length}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(null); }}
                className="text-white/80 hover:text-white transition-colors p-2"
              >
                <X size={28} />
              </button>
            </div>

            {/* Main Image */}
            <div className="relative w-full max-w-4xl max-h-[70vh] flex items-center justify-center">
              <motion.img
                key={selectedIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                src={photos[selectedIndex].url}
                className="max-w-full max-h-[70vh] object-contain cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (!likedPhotos.has(photos[selectedIndex].id)) {
                    handleLike(selectedIndex);
                  }
                }}
              />
              <AnimatePresence>
                {showHeartAnimation && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <Heart size={120} className="text-red-500 drop-shadow-2xl" fill="currentColor" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 w-full p-8 flex justify-center items-center z-10 bg-gradient-to-t from-black/80 to-transparent">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); handleLike(selectedIndex); }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${likedPhotos.has(photos[selectedIndex].id) ? 'bg-white text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md'}`}
                >
                  <motion.div
                    animate={likedPhotos.has(photos[selectedIndex].id) ? { scale: [1, 1.5, 1] } : {}}
                    transition={{ duration: 0.4, type: "spring", bounce: 0.5 }}
                  >
                    <Heart size={20} fill={likedPhotos.has(photos[selectedIndex].id) ? "currentColor" : "none"} />
                  </motion.div>
                  <span className="font-bold">{photos[selectedIndex].likes > 0 ? photos[selectedIndex].likes : 'Gostei'}</span>
                </motion.button>
            </div>

            {/* Nav Buttons */}
            {photos.length > 1 && (
              <>
                <button 
                  onClick={showPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 bg-black/20 rounded-full hover:bg-black/40"
                >
                  <ChevronLeft size={36} />
                </button>
                <button 
                  onClick={showNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 bg-black/20 rounded-full hover:bg-black/40"
                >
                  <ChevronRight size={36} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
