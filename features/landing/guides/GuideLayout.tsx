import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { SEO } from '../../../components/SEO';

export interface GuideFaq {
  q: string;
  a: string;
}

interface GuideLayoutProps {
  title: string;
  description: string;
  keywords: string;
  kicker: string;
  h1Lead: string;
  h1Accent: string;
  intro: string;
  children: React.ReactNode;
  faqs: GuideFaq[];
  related: { to: string; label: string }[];
}

/**
 * Molde das páginas-guia de SEO (/guia/*): uma keyword, um URL.
 * Hero editorial + artigo + FAQ com schema + CTA + interligação.
 */
export const GuideLayout: React.FC<GuideLayoutProps> = ({
  title,
  description,
  keywords,
  kicker,
  h1Lead,
  h1Accent,
  intro,
  children,
  faqs,
  related,
}) => {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col font-display bg-[#FDFBF7] text-slate-900">
      <SEO title={title} description={description} keywords={keywords} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-28 md:pt-32 pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a6d1c] mb-3">{kicker}</p>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1B365D] tracking-tight leading-[1.05] mb-5">
          {h1Lead} <span className="italic font-medium text-[#8a6d1c]">{h1Accent}</span>
        </h1>
        <p className="text-lg text-slate-600 font-light leading-relaxed mb-10">{intro}</p>
        <article className="flex flex-col gap-8 text-slate-700 leading-[1.75] font-light">{children}</article>

        <section className="mt-14" aria-label="Perguntas frequentes">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#1B365D] tracking-tight mb-6">
            Perguntas <span className="italic font-medium text-[#8a6d1c]">frequentes</span>
          </h2>
          <div className="flex flex-col gap-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group bg-white border border-slate-200 rounded-2xl px-5 py-4 open:shadow-md"
              >
                <summary className="font-bold text-slate-900 text-[15px] cursor-pointer list-none flex items-center justify-between gap-3">
                  {f.q}
                  <span className="text-[#8a6d1c] group-open:rotate-45 transition-transform text-xl leading-none" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl bg-[#1B365D] px-8 py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight mb-3">
            Pronto para criar o <span className="italic font-medium text-[#E9BE5D]">teu convite?</span>
          </h2>
          <p className="text-blue-200/80 font-light mb-8 max-w-md mx-auto">
            Conta grátis em 30 segundos. O primeiro evento de casamento é grátis em Premium.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/templates"
              className="inline-flex items-center gap-2 h-12 px-8 bg-[#C5A028] text-[#1B365D] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#d4af37] active:scale-[0.97]"
            >
              Ver modelos <ArrowRight size={15} />
            </Link>
            <Link
              to="/plans"
              className="inline-flex items-center justify-center h-12 px-8 rounded-full border-2 border-white/40 text-white text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-[#1B365D] active:scale-[0.97]"
            >
              Ver preços
            </Link>
          </div>
        </section>

        {related.length > 0 && (
          <nav className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-slate-500" aria-label="Guias relacionados">
            <MapPin size={14} className="text-[#8a6d1c]" aria-hidden="true" />
            <span className="font-bold">Ler a seguir:</span>
            {related.map((r) => (
              <Link key={r.to} to={r.to} className="font-bold text-[#1B365D] hover:text-[#8a6d1c] underline underline-offset-2">
                {r.label}
              </Link>
            ))}
          </nav>
        )}
      </main>
      <footer className="px-6 py-10 text-center border-t border-[#C5A028]/30 mt-8">
        <p className="text-xs text-slate-500 font-light">© {new Date().getFullYear()} InoEvents · Feito em Luanda, Angola</p>
      </footer>
    </div>
  );
};
