import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage = () => {
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
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-8">Termos de Serviço</h1>
                    <p className="text-slate-500 text-sm mb-12">Última atualização: 08 de Maio de 2026</p>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Aceitação dos Termos</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Ao acessar e usar o InoEvents, você concorda em cumprir e ser regido por estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Uso do Serviço</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            O InoEvents fornece uma plataforma para criação de convites digitais, gestão de convidados e check-in inteligente. Você concorda em usar o serviço apenas para fins legais e de acordo com as leis aplicáveis de Angola e legislação internacional.
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 leading-relaxed space-y-2">
                            <li>Você é responsável por manter a confidencialidade da sua conta e senha.</li>
                            <li>Não deve usar o serviço para enviar spam ou conteúdo malicioso.</li>
                            <li>A revenda não autorizada de nossos serviços é estritamente proibida (exceto em planos projetados para agências/Corporate).</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Planos e Pagamentos</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Os serviços Premium, Business e Corporate estão sujeitos ao pagamento de taxas, conforme detalhado na página de planos. O não pagamento pode resultar na suspensão da conta e perda de funcionalidades avançadas.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Propriedade Intelectual</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Todo o conteúdo incluído no serviço, como textos, gráficos, logotipos, ícones de botões, imagens e software, é propriedade do InoEvents ou de seus fornecedores de conteúdo e protegido pelas leis de direitos autorais internacionais.
                        </p>
                    </section>
                    
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Limitação de Responsabilidade</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            O InoEvents não será responsável por quaisquer danos diretos, indiretos, incidentais, especiais ou consequenciais resultantes do uso ou da incapacidade de usar o serviço, incluindo falhas de conectividade de internet durante eventos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Contato</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Para dúvidas ou esclarecimentos sobre estes termos, por favor, entre em contato através do nosso suporte pelo e-mail: <a href="mailto:suporte@inoevents.com" className="text-brand-blue hover:underline">suporte@inoevents.com</a>.
                        </p>
                    </section>
                </motion.div>
            </main>
        </div>
    );
};
