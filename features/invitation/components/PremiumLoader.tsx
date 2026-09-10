import React from "react";

export const PremiumLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-slate-900 font-display relative">
      <div className="flex flex-col items-center max-w-md text-center">
        <div className="relative w-14 h-14 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#C5A028]/30" />
          <div className="absolute inset-0 rounded-full border-t-2 border-[#1B365D] animate-spin" />
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.22em] uppercase bg-[#1B365D]/5 text-[#1B365D] border border-[#1B365D]/10 mb-4">
          InoEvents
        </span>
        <p className="text-sm font-light text-slate-600">
          A preparar o convite…
        </p>
      </div>
    </div>
  );
};
