import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Zap, Target } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useFirebase } from '../../components/FirebaseProvider';
import { Navbar } from '../../components/Navbar';

export const AboutPage = () => {
    const navigate = useNavigate();
    const { user } = useFirebase();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleCreateEvent = () => {
        if (!user) {
            navigate('/auth');
            return;
        }
        navigate('/create-invitation');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-brand-blue/20">
            <Navbar />

            <main className="pt-24 pb-24 px-6 max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6"
                    >
                        Transformando Ideias <br className="hidden md:block"/> num Evento Inesquecível.
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
                    >
                        Somos a <span className="font-bold text-slate-700">Ino-Service Marketing Solution</span>. Unimos engenharia de software e design de ponta para democratizar a gestão e criação de eventos em Angola e em África.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="prose prose-slate prose-lg"
                    >
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">O Início da Jornada</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Tudo começou com uma visão compartilhada por dois jovens angolanos: Antonio Salvador Samuel e Helder Deniz. A questão era simples, mas ambiciosa: como eliminar as dores de cabeça organizacionais dos nossos eventos com tecnologia?
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                            Fundada em 2024, a Ino-Service nasceu como um movimento focado em inovação. O <strong>InoEvents</strong> é o reflexo da nossa vontade de criar um padrão de excelência de interface - acessível a organizadores de eventos, noivos celebrando momentos especiais ou equipes corporativas a gerir grandes plateias.
                        </p>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                    >
                        <div className="p-8 bg-white rounded-3xl shadow-[0_5px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-center">
                            <Target className="w-10 h-10 text-brand-blue mb-4" />
                            <h3 className="font-bold text-xl text-slate-900 mb-2">Missão</h3>
                            <p className="text-slate-500 text-sm">Democratizar o acesso a ferramentas de gestão e produção de eventos de classe mundial.</p>
                        </div>
                        <div className="p-8 bg-white rounded-3xl shadow-[0_5px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-center">
                            <Zap className="w-10 h-10 text-brand-blue mb-4" />
                            <h3 className="font-bold text-xl text-slate-900 mb-2">Visão</h3>
                            <p className="text-slate-500 text-sm">Colocar Angola no centro da inovação tecnológica africana e global.</p>
                        </div>
                    </motion.div>
                </div>

                <div className="mb-24">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Liderança Visionária</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm"
                        >
                            <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center text-slate-400">
                                <Users size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">Antonio Salvador Samuel</h3>
                            <p className="text-brand-blue font-medium text-sm mb-4">CEO & Co-Founder</p>
                            <p className="text-slate-500 text-sm">Visionário tecnológico liderando a estratégia de produto e inovação da Ino-Service.</p>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm"
                        >
                            <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center text-slate-400">
                                <Users size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">Helder Deniz</h3>
                            <p className="text-brand-blue font-medium text-sm mb-4">COO & Co-Founder</p>
                            <p className="text-slate-500 text-sm">Especialista em operações e crescimento, transformando visão em realidade.</p>
                        </motion.div>
                    </div>
                </div>

                <div className="text-center rounded-3xl bg-slate-900 px-8 py-16">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white mb-6">O futuro dos eventos começa aqui.</h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={handleCreateEvent} className="px-8 py-4 bg-brand-blue text-white rounded-full font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-brand-blue/90 transition-all hover:scale-105 w-full sm:w-auto">
                            {user ? 'Criar Eventos' : 'Começar Agora'}
                        </button>
                        <a href="https://wa.me/244957975771" className="px-8 py-4 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-colors w-full sm:w-auto border border-white/10">
                            Fale Conosco
                        </a>
                    </div>
                </div>

            </main>
        </div>
    );
};
