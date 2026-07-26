import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export const EditableField: React.FC<{
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
