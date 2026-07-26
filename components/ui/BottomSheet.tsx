import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  themeClasses?: string; // To pass specific theme colors
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  themeClasses = "bg-white text-black"
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            style={{ maxHeight: "85dvh" }}
            className={`fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-xl md:bottom-4 md:rounded-[32px] z-[70] rounded-t-[32px] p-5 md:p-6 ${themeClasses} shadow-2xl flex flex-col overflow-hidden`}
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-gray-300/50 rounded-full mx-auto mb-3 shrink-0" />
            
            {/* Fixed Header */}
            <div className="flex justify-between items-center pb-3 mb-2 border-b border-gray-100/10 shrink-0">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer">
                <X size={22} />
              </button>
            </div>
            
            {/* Scrollable Content Container (min-h-0 ensures flexbox height constraint) */}
            <div className="overflow-y-auto pr-1 pb-6 space-y-4 flex-1 min-h-0 overscroll-contain touch-pan-y scrollbar-thin scrollbar-thumb-gray-300/80 scrollbar-track-transparent">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
