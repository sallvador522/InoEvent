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
  image = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop',
  type = 'website',
  url,
  keywords,
}) => {
  const finalTitle = title.includes('InoEvents') ? title : `${title} | InoEvents Angola`;
  const finalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const defaultKeywords = "Convites digitais, Luanda, Angola, casamento, chás de panela, InoEvents, RSVP, confirmação de presença, convites interactivos, eventos Angola";

  const schemaOrgJSONLD = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": finalUrl,
    "name": "InoEvents Angola - Convites Digitais Premium",
    "description": description,
    "publisher": {
      "@type": "Organization",
      "name": "InoEvents",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ais-pre-7dnjw3h6d2pydmeyxad55m-55590364739.europe-west2.run.app/favicon.ico"
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://ais-pre-7dnjw3h6d2pydmeyxad55m-55590364739.europe-west2.run.app/templates?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Helmet>
      {/* General Meta */}
      <title>{finalTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <meta name="robots" content="index, follow" />
      {finalUrl && <link rel="canonical" href={finalUrl} />}
      <meta name="geo.region" content="AO" />
      <meta name="geo.placename" content="Luanda" />

      {/* OpenGraph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="pt_AO" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={description} />
      {finalUrl && <meta property="og:url" content={finalUrl} />}
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(schemaOrgJSONLD)}
      </script>
    </Helmet>
  );
};
