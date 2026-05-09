import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-brand-blue/20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 py-6 px-8 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-xl tracking-tight text-slate-900">InoEvents</span>
                    </Link>
                </div>
            </header>

            <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="prose prose-slate prose-lg max-w-none"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-8">Políticas de Privacidade</h1>
                    <p className="text-slate-500 text-sm mb-12">Última atualização: 08 de Maio de 2026</p>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Informações que Coletamos</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Coletamos diferentes tipos de informações para oferecer e aprimorar nossos serviços:
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 leading-relaxed space-y-2">
                            <li><strong>Informações de Registro:</strong> Nome, e-mail, senha e dados de autenticação via Google.</li>
                            <li><strong>Dados de Eventos:</strong> Informações sobre os eventos que você cria, listas de convidados, datas e locais.</li>
                            <li><strong>Dados dos Convidados:</strong> Nomes e informações de contato inseridas pelos organizadores para envio de convites e gestão do check-in.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Como Usamos suas Informações</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            As informações que coletamos são utilizadas exclusivamente para a prestação do serviço InoEvents, o que inclui:
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 leading-relaxed space-y-2">
                            <li>Gerar e enviar convites interativos;</li>
                            <li>Processar check-ins via QR Code na entrada dos eventos;</li>
                            <li>Fornecer insights e analytics sobre a presença nos eventos;</li>
                            <li>Melhorar e otimizar constantemente a performance da nossa plataforma.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Proteção e Segurança</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            A segurança dos seus dados e dos seus convidados é prioridade. Implementamos medidas técnicas e organizacionais avançadas (como criptografia Firebase, infraestrutura Google Cloud e tokens seguros) para proteger suas informações contra acesso, alteração, divulgação ou destruição não autorizada.
                        </p>
                    </section>
                    
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Compartilhamento de Dados</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Nós não vendemos, alugamos nem comercializamos os dados dos nossos usuários ou dos seus convidados. As informações podem ser compartilhadas apenas nos casos em que seja necessário para processar pagamentos através de integradores parceiros ou por exigência legal devidamente qualificada.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Seus Direitos</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Você tem o direito de acessar, atualizar ou excluir suas informações pessoais a qualquer momento através do seu painel. Se precisar de assistência adicional relacionada aos seus dados, entre em contato em <a href="mailto:privacy@inoevents.com" className="text-brand-blue hover:underline">privacy@inoevents.com</a>.
                        </p>
                    </section>
                </motion.div>
            </main>
        </div>
    );
};
