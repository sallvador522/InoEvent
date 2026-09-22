import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PLANS } from '../config/plans';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  type?: string;
  url?: string;
  keywords?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image,
  imageAlt,
  type = 'website',
  url,
  keywords,
}) => {
  const finalTitle = title.includes('InoEvents') ? title : `${title} | InoEvents Angola`;
  const domain = 'https://www.inoevent.online';
  const finalUrl = url || (typeof window !== 'undefined' ? window.location.href.replace(window.location.origin, domain) : domain);
  
  const defaultImage = `${domain}/inoOG.png`;
  const rawImage = image
    ? (image.startsWith('http') ? image : `${domain}${image.startsWith('/') ? '' : '/'}${image}`)
    : defaultImage;
  // Scrapers (WhatsApp/Facebook) não leem data:/blob: — cai para a imagem padrão
  const finalImage =
    rawImage.startsWith('data:') || rawImage.startsWith('blob:') ? defaultImage : rawImage;
  const isDefaultImage = finalImage === defaultImage;
  const finalImageAlt = imageAlt || 'InoEvents Angola — Convites Digitais Premium com RSVP e QR Code';
  
  // Keywords próprias — sem marcas de terceiros
  const defaultKeywords = "convites digitais em Angola, convites de casamento Angola, chá de panela Angola, convites premium com RSVP Angola, convite digital Luanda, lista de presentes IBAN Angola, convite interativo Angola, InoEvents, confirmação de presença Angola, festas e casamentos Luanda, RSVP online Angola, check-in por QR Code Angola, gestão de mesas casamentos, lista de convidados digital, gestão de casamentos e eventos sociais, controle de presenças convidados, credenciamento QR Code, gerenciador de casamentos Luanda, convite com mapa Angola, mapa do evento e como chegar Luanda";

  // Create highly structured JSON-LD schema combining Website, SoftwareApplication and Service 
  // for advanced AI (Gemini, ChatGPT, Perplexity) and Google indexation.
  const schemaOrgJSONLD = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "url": domain,
      "name": "InoEvents Angola - Plataforma de Convites Digitais e Gestão de Eventos Sociais",
      "description": "A plataforma mais sofisticada de Angola para gerenciar casamentos e eventos sociais. Crie convites digitais elegantes com mapa da zona e botão Como chegar, controle a lista de convidados, gerencie RSVPs em tempo real, gere QR Codes exclusivos para check-in e configure listas de presentes por IBAN.",
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
      "featureList": "Convites digitais com mapa da zona e botão Como chegar, RSVP online, QR Code de check-in, lista de presentes por IBAN, galeria de fotos, contagem regressiva",
      "offers": [
        { "@type": "Offer", "name": "Convite Essencial", "price": String(PLANS.essential.price), "priceCurrency": "AOA" },
        { "@type": "Offer", "name": "Convite Premium", "price": String(PLANS.premium.price), "priceCurrency": "AOA" },
        { "@type": "Offer", "name": "Convite VIP", "price": String(PLANS.vip.price), "priceCurrency": "AOA" },
        { "@type": "Offer", "name": "Business", "price": String(PLANS.business.price), "priceCurrency": "AOA" }
      ]
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
      {finalImage && isDefaultImage && <meta property="og:image:width" content="1424" />}
      {finalImage && isDefaultImage && <meta property="og:image:height" content="752" />}
      {finalImage && <meta property="og:image:alt" content={finalImageAlt} />}
      <meta property="og:site_name" content="InoEvents Angola" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={description} />
      {finalImage && <meta name="twitter:image" content={finalImage} />}
      {finalImage && <meta name="twitter:image:alt" content={finalImageAlt} />}

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(schemaOrgJSONLD)}
      </script>
    </Helmet>
  );
};
