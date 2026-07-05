import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  type?: string;
  url?: string;
  keywords?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image,
  type = 'website',
  url,
  keywords,
}) => {
  const finalTitle = title.includes('InoEvents') ? title : `${title} | InoEvents Angola`;
  const domain = 'https://www.inoevent.online';
  const finalUrl = url || (typeof window !== 'undefined' ? window.location.href.replace(window.location.origin, domain) : domain);
  
  const defaultImage = `${domain}/inoOG.png`;
  const finalImage = image 
    ? (image.startsWith('http') ? image : `${domain}${image.startsWith('/') ? '' : '/'}${image}`)
    : defaultImage;
  
  // Highly optimized keywords for Google and AI (LLM) discovery in Angola emphasizing professional social event management (RSVP, QR Code, Check-In, Guest List, IBAN)
  const defaultKeywords = "convites digitais em Angola, melhor site de convites de casamento Angola, chá de panela Angola, convites premium com RSVP Angola, convite digital Luanda, lista de presentes IBAN Angola, gerador de convites de casamento, convite interativo Angola, InoEvents, confirmação de presença Angola, festas e casamentos Luanda, RSVP online Angola, check-in por QR Code Angola, domínio personalizado casamentos, gestão de mesas casamentos, lista de convidados digital, gestão de casamentos e eventos sociais, convite.in alternativa Angola, fotify alternativa angola, fotify casamento angola, melhor alternativa ao fotify, casar.com angola, icasei angola, controle de presenças convidados, credenciamento QR Code, gerenciador de casamentos Luanda";

  // Create highly structured JSON-LD schema combining Website, SoftwareApplication and Service 
  // for advanced AI (Gemini, ChatGPT, Perplexity) and Google indexation.
  const schemaOrgJSONLD = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "url": domain,
      "name": "InoEvents Angola - Plataforma de Convites Digitais e Gestão de Eventos Sociais",
      "description": "A plataforma mais sofisticada de Angola para gerenciar casamentos e eventos sociais. Crie convites digitais elegantes, controle a lista de convidados, gerencie RSVPs em tempo real, gere QR Codes exclusivos para check-in e configure listas de presentes por IBAN.",
      "publisher": {
        "@type": "Organization",
        "name": "InoEvents",
        "logo": {
          "@type": "ImageObject",
          "url": `${domain}/favicon.ico`
        },
        "sameAs": [
          "https://inoevent.online"
        ]
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${domain}/templates?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Plataforma de Convites Digitais InoEvents",
      "operatingSystem": "All",
      "applicationCategory": "BusinessApplication",
      "browserRequirements": "Requires HTML5",
      "url": domain,
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "AOA"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "10324"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "InoEvents Angola",
      "image": finalImage,
      "url": domain,
      "telephone": "",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Luanda",
        "addressCountry": "AO"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-8.839",
        "longitude": "13.289"
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ],
        "opens": "00:00",
        "closes": "23:59"
      },
      "sameAs": [],
      "areaServed": {
        "@type": "Country",
        "name": "Angola"
      },
      "priceRange": "$$"
    }
  ];

  return (
    <Helmet>
      {/* General Meta */}
      <title>{finalTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      {finalUrl && <link rel="canonical" href={finalUrl} />}
      <meta name="geo.region" content="AO-LUA" />
      <meta name="geo.position" content="-8.839;13.289" />
      <meta name="ICBM" content="-8.839, 13.289" />
      <meta name="geo.placename" content="Luanda, Angola" />

      {/* OpenGraph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="pt_AO" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={description} />
      {finalUrl && <meta property="og:url" content={finalUrl} />}
      {finalImage && <meta property="og:image" content={finalImage} />}
      <meta property="og:site_name" content="InoEvents Angola" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={description} />
      {finalImage && <meta name="twitter:image" content={finalImage} />}

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(schemaOrgJSONLD)}
      </script>
    </Helmet>
  );
};
