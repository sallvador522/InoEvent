import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { EVENTS } from '../../mockData';
import { ThemeType } from '../../types';
import { Navbar } from '../../components/Navbar';
import { SEO } from '../../components/SEO';
import { Skeleton } from '../../components/ui/Skeleton';
import { getOptimizedImageUrl } from '../../lib/imageOptimizer';

const MotionLink = motion(Link as any) as any;

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: 'auto_awesome' },
  { id: 'wedding', label: 'Casamento', icon: 'diamond' },
  { id: 'bridal', label: 'Chá de Panela', icon: 'kitchen' }, 
  { id: 'birthday', label: 'Aniversário', icon: 'cake' },
  { id: 'baby', label: 'Chá de Bebê', icon: 'child_care' },
  { id: 'corporate', label: 'Corporativo', icon: 'business_center' },
];

export const TemplateGalleryPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const catParam = searchParams.get('category') || 'all';
    const [selectedCategory, setSelectedCategory] = useState(catParam);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (catParam) {
            setSelectedCategory(catParam);
        }
    }, [catParam]);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, [selectedCategory]);

    const filteredEvents = EVENTS.filter(event => {
        if (selectedCategory === 'all') return true;
        if (selectedCategory === 'wedding') return event.type === ThemeType.WEDDING;
        if (selectedCategory === 'bridal') return event.type === ThemeType.BRIDAL_SHOWER;
        if (selectedCategory === 'birthday') return event.type === ThemeType.BIRTHDAY;
        if (selectedCategory === 'baby') return event.type === ThemeType.BABY_SHOWER;
        if (selectedCategory === 'corporate') return event.type === ThemeType.CORPORATE;
        return true;
    });

    const getBadgeConfig = (type: ThemeType) => {
        switch(type) {
          case ThemeType.WEDDING: return { className: 'bg-emerald-100 text-emerald-800' };
          case ThemeType.BRIDAL_SHOWER: return { className: 'bg-pink-100 text-pink-800' };
          case ThemeType.BIRTHDAY: return { className: 'bg-purple-100 text-purple-800' };
          case ThemeType.BABY_SHOWER: return { className: 'bg-cyan-100 text-cyan-800' };
          case ThemeType.CORPORATE: return { className: 'bg-slate-800 text-slate-100' };
          default: return { className: 'bg-brand-blue/10 text-brand-blue' };
        }
    };

    const getLayoutLabel = (layoutMode: string) => {
        switch (layoutMode) {
            case 'CLASSIC': return 'Clássico Romântico';
            case 'MODERN': return 'Minimalista Etéreo';
            case 'LUXURY': return 'Luxuoso Black Tie';
            case 'LIMINTSO_GOLD': return 'Ouro Imperial';
            case 'LIMINTSO_ME': return 'Nobreza de Luanda';
            case 'GARDEN': return 'Jardim Elegante';
            case 'RUSTIC': return 'Rústico Chic';
            case 'INDUSTRIAL': return 'Industrial Urbano';
            default: return layoutMode;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <SEO 
                title="Modelos de Convites Digitais Angola | Casamento e Chá de Panela"
                description="Os mais elegantes modelos de convites digitais de casamento e chá de panela em Angola. Escolha um template de alta costura com RSVP e IBAN para presentes integrado e envie por WhatsApp."
            />
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
                <div className="mb-12">
                     <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">Galeria de Modelos</h1>
                     <p className="text-slate-500 text-lg max-w-2xl">Encontre o design perfeito para o seu próximo evento. Escolha um dos nossos modelos e personalize como desejar.</p>
                </div>

                {/* Categories */}
                <div className="flex overflow-x-auto no-scrollbar gap-4 mb-12 pb-4">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setSelectedCategory(cat.id);
                                setSearchParams({ category: cat.id });
                            }}
                            className={`px-5 py-3 rounded-full flex items-center gap-2 text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                                selectedCategory === cat.id
                                ? 'bg-brand-blue text-white shadow-brand-blue/30'
                                : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-3 gap-3 md:gap-6 pb-20 max-w-5xl mx-auto">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex flex-col gap-2 md:gap-4">
                                <Skeleton className="w-full aspect-[3/4] rounded-xl md:rounded-2xl" />
                                <div className="px-1 md:px-2 space-y-2">
                                    <Skeleton className="h-5 w-3/4 rounded" />
                                    <Skeleton className="h-3 w-1/2 rounded" />
                                    <Skeleton className="h-3 w-5/6 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredEvents.length > 0 && ['all', 'wedding', 'bridal', 'baby'].includes(selectedCategory) ? (
                    <div className="grid grid-cols-3 gap-3 md:gap-6 pb-20 max-w-5xl mx-auto">
                        {filteredEvents.map((event, index) => {
                            const badge = getBadgeConfig(event.type);
                            return (
                                <MotionLink
                                    to={`/invite/${event.id}`}
                                    key={event.id}
                                    className="flex flex-col gap-2 md:gap-4 group cursor-pointer"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut", delay: index % 6 * 0.1 }}
                                >
                                    <div className="w-full aspect-[3/4] rounded-xl md:rounded-2xl overflow-hidden relative shadow-md group-hover:shadow-2xl group-hover:shadow-brand-blue/20 transition-all duration-500">
                                        <img
                                            alt={event.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            src={getOptimizedImageUrl(event.heroImage, { width: 500, quality: 75 })}
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20 flex flex-col md:flex-row gap-1 md:gap-2 items-end">
                                            <span className={`inline-block px-2 py-1 md:px-3 md:py-1.5 backdrop-blur-md rounded-full text-[8px] md:text-xs font-bold shadow-sm ${badge.className}`}>
                                                {getLayoutLabel(event.layoutMode)}
                                            </span>
                                            {!['MODERN', 'CLASSIC', 'ESSENTIAL'].includes(event.layoutMode) && (
                                                <span className="inline-block px-2 py-1 md:px-3 md:py-1.5 bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 rounded-full text-[8px] md:text-xs font-bold shadow-sm">
                                                    PRO
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="px-1 md:px-2">
                                        <h4 className="text-slate-900 font-serif font-bold text-sm md:text-xl group-hover:text-brand-blue transition-colors line-clamp-1">{event.title}</h4>
                                        <p className="text-slate-500 text-[10px] md:text-sm mt-0.5 md:mt-1 line-clamp-2 md:line-clamp-2">{event.description}</p>
                                    </div>
                                </MotionLink>
                            );
                        })}
                    </div>
                ) : (
                    <div className="w-full text-center py-32 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-6xl text-slate-300 mb-6">hourglass_empty</span>
                        <h4 className="text-2xl font-serif font-bold text-slate-700 mb-3">Brevemente</h4>
                        <p className="text-slate-500 max-w-md text-lg">Os modelos para {CATEGORIES.find(c => c.id === selectedCategory)?.label.toLowerCase()} estão em desenvolvimento e estarão disponíveis muito em breve.</p>
                    </div>
                )}
            </main>
        </div>
    );
};
