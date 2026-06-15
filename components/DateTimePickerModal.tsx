import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

interface DateTimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  type: 'date' | 'time';
  onSave: (value: string) => void;
  title?: string;
}

const monthsPtFull = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const weekdaysPt = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const parseToDateInputVal = (val: string): string => {
  if (!val) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  if (/^\d{4}-\d{2}-\d{2}T/.test(val)) return val.substring(0, 10);
  
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().substring(0, 10);
  }

  const clean = val.toLowerCase().replace(/\s+/g, ' ');
  const dayMatch = clean.match(/\b\d{1,2}\b/);
  const yearMatch = clean.match(/\b\d{4}\b/);
  const monthsPtShort = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  
  let monthIndex = -1;
  for (let i = 0; i < 12; i++) {
    if (clean.includes(monthsPtFull[i].toLowerCase())) {
      monthIndex = i;
      break;
    }
  }
  if (monthIndex === -1) {
    for (let i = 0; i < 12; i++) {
      if (clean.includes(monthsPtShort[i])) {
        monthIndex = i;
        break;
      }
    }
  }

  const day = dayMatch ? parseInt(dayMatch[0], 10) : 1;
  const year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();
  const month = monthIndex !== -1 ? monthIndex : new Date().getMonth();

  const finalDate = new Date(year, month, day);
  const yyyy = finalDate.getFullYear();
  const mm = String(finalDate.getMonth() + 1).padStart(2, '0');
  const dd = String(finalDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseToTimeInputVal = (val: string): string => {
  if (!val) return '12:00';
  const match = val.match(/(\d{1,2})[h:](\d{2})/i) || val.match(/(\d{1,2})/);
  if (match) {
    const hours = match[1].padStart(2, '0');
    const minutes = match[2] ? match[2].padStart(2, '0') : '00';
    return `${hours}:${minutes}`;
  }
  return '12:00';
};

export const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  isOpen,
  onClose,
  initialValue,
  type,
  onSave,
  title
}) => {
  // Calendar states
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Time states
  const [selectedHour, setSelectedHour] = useState<string>('12');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');

  // Load initial values
  useEffect(() => {
    if (isOpen) {
      if (type === 'date') {
        const dateIso = parseToDateInputVal(initialValue);
        if (dateIso) {
          const parts = dateIso.split('-');
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            setCurrentYear(y);
            setCurrentMonth(m);
            setSelectedDay(d);
          }
        } else {
          const today = new Date();
          setCurrentYear(today.getFullYear());
          setCurrentMonth(today.getMonth());
          setSelectedDay(today.getDate());
        }
      } else {
        const timeVal = parseToTimeInputVal(initialValue);
        const parts = timeVal.split(':');
        if (parts.length === 2) {
          setSelectedHour(parts[0]);
          setSelectedMinute(parts[1]);
        }
      }
    }
  }, [isOpen, initialValue, type]);

  if (!isOpen) return null;

  // Year choices
  const years = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Calendar math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // Sunday=0
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleSave = () => {
    if (type === 'date') {
      const dayStr = String(selectedDay || 1).padStart(2, '0');
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dateString = `${currentYear}-${monthStr}-${dayStr}`;
      onSave(dateString);
    } else {
      onSave(`${selectedHour}:${selectedMinute}`);
    }
    onClose();
  };

  const handleQuickPreset = (preset: 'today' | 'tomorrow' | 'nextWeekend') => {
    const today = new Date();
    if (preset === 'today') {
      setCurrentYear(today.getFullYear());
      setCurrentMonth(today.getMonth());
      setSelectedDay(today.getDate());
    } else if (preset === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      setCurrentYear(tomorrow.getFullYear());
      setCurrentMonth(tomorrow.getMonth());
      setSelectedDay(tomorrow.getDate());
    } else if (preset === 'nextWeekend') {
      const nextSaturday = new Date(today);
      // Days to next Saturday: Sunday=0, Monday=1, ... Saturday=6
      const daysToAdd = (6 - today.getDay() + 7) % 7 || 7;
      nextSaturday.setDate(today.getDate() + daysToAdd);
      setCurrentYear(nextSaturday.getFullYear());
      setCurrentMonth(nextSaturday.getMonth());
      setSelectedDay(nextSaturday.getDate());
    }
  };

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white/95 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100/80 flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {type === 'date' ? (
                <CalendarIcon className="w-5 h-5 text-brand-blue" />
              ) : (
                <Clock className="w-5 h-5 text-brand-blue" />
              )}
              <h3 className="font-serif text-lg font-bold text-slate-800">
                {title || (type === 'date' ? 'Escolher Data' : 'Escolher Horário')}
              </h3>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal body */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {type === 'date' ? (
              <div className="space-y-4">
                {/* Year/Month selection layout */}
                <div className="flex items-center justify-between pb-2">
                  <div className="flex gap-2">
                    <select 
                      value={currentMonth} 
                      onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                      className="bg-slate-100 border-none text-slate-800 font-bold text-sm px-3 py-1.5 rounded-xl outline-none hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {monthsPtFull.map((m, idx) => (
                        <option key={idx} value={idx}>{m}</option>
                      ))}
                    </select>
                    <select 
                      value={currentYear} 
                      onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                      className="bg-slate-100 border-none text-slate-800 font-bold text-sm px-3 py-1.5 rounded-xl outline-none hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-all hover:text-slate-800"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button 
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-all hover:text-slate-800"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 pb-2 border-b border-slate-100">
                  {weekdaysPt.map((w, idx) => (
                    <div key={idx} className="h-6 flex items-center justify-center font-bold">
                      {w}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Previous month days pad */}
                  {Array.from({ length: startDayOfWeek }).map((_, idx) => {
                    const dayNum = prevMonthDays - startDayOfWeek + idx + 1;
                    return (
                      <button
                        key={`prev-${idx}`}
                        onClick={() => {
                          if (currentMonth === 0) {
                            setCurrentMonth(11);
                            setCurrentYear(prev => prev - 1);
                          } else {
                            setCurrentMonth(prev => prev - 1);
                          }
                          setSelectedDay(dayNum);
                        }}
                        className="h-10 text-slate-300 hover:bg-slate-50 text-xs rounded-xl transition-all font-medium py-1 cursor-pointer"
                      >
                        {dayNum}
                      </button>
                    );
                  })}

                  {/* Current month days */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const isSelected = selectedDay === dayNum;
                    const isToday = new Date().getDate() === dayNum && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
                    return (
                      <button
                        key={`day-${dayNum}`}
                        onClick={() => setSelectedDay(dayNum)}
                        className={`h-10 text-sm font-semibold rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20 scale-105' 
                            : isToday 
                              ? 'bg-slate-100 text-brand-blue font-bold border border-brand-blue/10' 
                              : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Presets */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Sugestões rápidas</p>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleQuickPreset('today')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors flex items-center"
                    >
                      Hoje
                    </button>
                    <button 
                      onClick={() => handleQuickPreset('tomorrow')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors flex items-center"
                    >
                      Amanhã
                    </button>
                    <button 
                      onClick={() => handleQuickPreset('nextWeekend')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors flex items-center"
                    >
                      Fim de semana
                    </button>
                  </div>
                </div>

                {/* Live Preview */}
                {selectedDay && (
                  <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 text-center">
                    <p className="text-xs text-brand-blue">Drafe da Data Selecionada</p>
                    <p className="text-sm font-serif font-bold text-slate-800 mt-1">
                      {selectedDay} de {monthsPtFull[currentMonth]} de {currentYear}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-4">
                  {/* Hours column */}
                  <div className="flex-1">
                    <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 text-center">Hora</label>
                    <div className="h-44 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 border border-slate-100 rounded-2xl p-1 bg-slate-50 flex flex-col gap-1">
                      {hoursList.map((hr) => {
                        const isSel = selectedHour === hr;
                        return (
                          <button
                            key={hr}
                            onClick={() => setSelectedHour(hr)}
                            className={`py-2 text-sm font-bold rounded-xl text-center cursor-pointer transition-all ${
                              isSel 
                                ? 'bg-brand-blue text-white shadow-md' 
                                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-800'
                            }`}
                          >
                            {hr}h
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Minutes column */}
                  <div className="flex-1">
                    <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 text-center">Minutos</label>
                    <div className="h-44 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 border border-slate-100 rounded-2xl p-1 bg-slate-50 flex flex-col gap-1">
                      {minutesList.map((min) => {
                        const isSel = selectedMinute === min;
                        return (
                          <button
                            key={min}
                            onClick={() => setSelectedMinute(min)}
                            className={`py-2 text-sm font-bold rounded-xl text-center cursor-pointer transition-all ${
                              isSel 
                                ? 'bg-brand-blue text-white shadow-md' 
                                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-800'
                            }`}
                          >
                            {min} m
                          </button>
                        );
                      })}
                      {/* Add fallback for non-multiples of 5 if user had one */}
                      {!minutesList.includes(selectedMinute) && (
                        <button
                          onClick={() => {}}
                          className="py-2 text-sm font-bold rounded-xl text-center bg-brand-blue text-white shadow-md"
                        >
                          {selectedMinute} m
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Display clock */}
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center flex items-center justify-center gap-3">
                  <div className="text-4xl font-mono font-bold text-slate-800 tracking-wider">
                    {selectedHour}:{selectedMinute}
                  </div>
                  <span className="text-xs bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full font-bold">24 Horas</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className="flex-1 py-3 px-4 rounded-xl font-bold bg-brand-blue hover:bg-brand-blue/90 text-white transition-all shadow-lg shadow-brand-blue/10 text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={18} />
              Confirmar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
