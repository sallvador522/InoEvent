import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle2, Clock, XCircle, TrendingUp, HelpCircle } from 'lucide-react';

interface Guest {
  id: string;
  name?: string;
  phone?: string;
  status?: 'CONFIRMED' | 'PENDING' | 'DECLINED';
  checkedIn?: boolean;
}

interface GuestsProgressBarProps {
  guests: Guest[];
  className?: string;
}

export const GuestsProgressBar: React.FC<GuestsProgressBarProps> = ({ guests, className = "" }) => {
  const [hoveredSegment, setHoveredSegment] = useState<'confirmed' | 'pending' | 'declined' | null>(null);

  const totalCount = guests.length;
  const confirmedCount = guests.filter(g => g.status === 'CONFIRMED').length;
  const pendingCount = guests.filter(g => g.status === 'PENDING').length;
  const declinedCount = guests.filter(g => g.status === 'DECLINED').length;
  const checkedInCount = guests.filter(g => g.checkedIn).length;

  // Percentages calculated with precision
  const confirmedPercent = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;
  const pendingPercent = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;
  // Make sure they sum up nicely or use standard math
  const declinedPercent = totalCount > 0 ? Math.round((declinedCount / totalCount) * 100) : 0;

  // Let's get checked in percentage of confirmed guests
  const checkedInPercent = confirmedCount > 0 ? Math.round((checkedInCount / confirmedCount) * 100) : 0;

  // Generate dynamic pace message in Portuguese to match rest of app
  const getPaceMessage = () => {
    if (totalCount === 0) {
      return {
        title: "Aguardando convidados",
        desc: "Adicione pessoas ou partilhe o link do convite para começar a receber as respostas.",
        color: "text-slate-500",
        bg: "bg-slate-50",
        border: "border-slate-100"
      };
    }

    if (confirmedPercent >= 80) {
      return {
        title: "Engajamento Excelente!",
        desc: "Excelente! O seu evento está praticamente lotado. Excelente engajamento dos seus convidados!",
        color: "text-emerald-700",
        bg: "bg-emerald-50/70",
        border: "border-emerald-100/70"
      };
    }

    if (confirmedPercent >= 50) {
      return {
        title: "Bom ritmo de adesão",
        desc: "Mais de metade dos convidados já confirmaram presença! O seu planejamento está no caminho certo.",
        color: "text-brand-blue",
        bg: "bg-blue-50/70",
        border: "border-blue-100/75"
      };
    }

    return {
      title: "Respostas em andamento",
      desc: "A recolha de presenças está a iniciar. Envie lembretes amigáveis para acelerar as respostas!",
      color: "text-amber-700",
      bg: "bg-amber-50/70",
      border: "border-amber-100/70"
    };
  };

  const pace = getPaceMessage();

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 relative overflow-hidden ${className}`}>
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} className="text-brand-blue" />
            <h4 className="font-serif font-bold text-lg text-slate-800">Adesão do Público</h4>
          </div>
          <p className="text-xs text-slate-500">Métrica dinâmica de aceitação e respostas pendentes.</p>
        </div>
        
        {totalCount > 0 && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {confirmedPercent}% Aceitação
          </div>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <Users size={32} className="text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">Nenhum convidado registado</p>
          <p className="text-xs text-slate-400 mt-1">Inscreva convidados para visualizar o progresso em tempo real.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Multi-Segment Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2 px-1">
              <span>0%</span>
              <span className="text-slate-500">Fluxo Total dos Convites</span>
              <span>100%</span>
            </div>
            
            <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden shadow-inner relative group border border-slate-200/10">
              {/* Confirmed Segment */}
              {confirmedCount > 0 && (
                <div
                  style={{ width: `${(confirmedCount / totalCount) * 100}%` }}
                  className={`h-full bg-emerald-500 hover:bg-emerald-400 transition-all duration-300 cursor-pointer relative ${
                    hoveredSegment === 'confirmed' ? 'brightness-105 scale-y-[1.12]' : ''
                  }`}
                  onMouseEnter={() => setHoveredSegment('confirmed')}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              )}

              {/* Pending Segment */}
              {pendingCount > 0 && (
                <div
                  style={{ width: `${(pendingCount / totalCount) * 100}%` }}
                  className={`h-full bg-amber-400 hover:bg-amber-300 transition-all duration-300 cursor-pointer relative border-l border-white/20 ${
                    hoveredSegment === 'pending' ? 'brightness-105 scale-y-[1.12]' : ''
                  }`}
                  onMouseEnter={() => setHoveredSegment('pending')}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              )}

              {/* Declined Segment */}
              {declinedCount > 0 && (
                <div
                  style={{ width: `${(declinedCount / totalCount) * 100}%` }}
                  className={`h-full bg-rose-500 hover:bg-rose-400 transition-all duration-300 cursor-pointer relative border-l border-white/20 ${
                    hoveredSegment === 'declined' ? 'brightness-105 scale-y-[1.12]' : ''
                  }`}
                  onMouseEnter={() => setHoveredSegment('declined')}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              )}
            </div>
          </div>

          {/* Interactive Legend with micro hover effects */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            
            {/* Confirmed Legend */}
            <div 
              onMouseEnter={() => setHoveredSegment('confirmed')}
              onMouseLeave={() => setHoveredSegment(null)}
              className={`p-3 rounded-2xl transition-all border ${
                hoveredSegment === 'confirmed' 
                  ? 'bg-emerald-50/80 border-emerald-200/80 scale-[1.02] shadow-sm shadow-emerald-500/5' 
                  : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-xs font-bold text-slate-500">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Confirmados</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-serif text-slate-800">{confirmedCount}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100/80 px-1.5 py-0.5 rounded-md">{confirmedPercent}%</span>
              </div>
            </div>

            {/* Pending Legend */}
            <div 
              onMouseEnter={() => setHoveredSegment('pending')}
              onMouseLeave={() => setHoveredSegment(null)}
              className={`p-3 rounded-2xl transition-all border ${
                hoveredSegment === 'pending' 
                  ? 'bg-amber-50/80 border-amber-200/80 scale-[1.02] shadow-sm shadow-amber-500/5' 
                  : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-xs font-bold text-slate-500">
                <Clock size={14} className="text-amber-500" />
                <span>Pendentes</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-serif text-slate-800">{pendingCount}</span>
                <span className="text-xs font-bold text-amber-600 bg-amber-100/85 px-1.5 py-0.5 rounded-md">{pendingPercent}%</span>
              </div>
            </div>

            {/* Declined Legend */}
            <div 
              onMouseEnter={() => setHoveredSegment('declined')}
              onMouseLeave={() => setHoveredSegment(null)}
              className={`p-3 rounded-2xl transition-all border ${
                hoveredSegment === 'declined' 
                  ? 'bg-rose-50/80 border-rose-200/80 scale-[1.02] shadow-sm shadow-rose-500/5' 
                  : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-xs font-bold text-slate-500">
                <XCircle size={14} className="text-rose-500" />
                <span>Recusados</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-serif text-slate-800">{declinedCount}</span>
                <span className="text-xs font-bold text-rose-600 bg-rose-100/80 px-1.5 py-0.5 rounded-md">{declinedPercent}%</span>
              </div>
            </div>

          </div>

          {/* Dynamic Information Block (Pace Message / Extra Insight) */}
          <div className={`p-4 rounded-2xl border ${pace.border} ${pace.bg} transition-all duration-300`}>
            <div className="flex gap-3">
              <div className="mt-0.5">
                <HelpCircle size={16} className={pace.color} />
              </div>
              <div>
                <h5 className={`text-xs font-bold uppercase tracking-wider ${pace.color} mb-0.5`}>
                  {pace.title}
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pace.desc} {checkedInCount > 0 && `De todos os confirmados, ${checkedInCount} (${checkedInPercent}%) já efetuaram o check-in na recepção.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
