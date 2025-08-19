import React from 'react';

const JsonLD: React.FC = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness", "FinancialService"],
    "name": "INVERCOP Semillas de Fe",
    "url": "https://invercorp.netlify.app/",
    "logo": "https://invercorp.netlify.app/assets/images/invercoorp_logo.png",
    "image": "https://invercorp.netlify.app/assets/images/invercoorp_logo.png",
    "description": "Asesoría gratuita para emprendedores en Ecuador. INVERCOP te ayuda a crecer tu negocio con fe, orden y respaldo financiero.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Quito",
      "addressRegion": "Pichincha",
      "addressCountry": "Ecuador"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "-0.1807",
      "longitude": "-78.4678"
    },
    "telephone": "+593-993845713",
    "email": "invercopsemillasdefe@gmail.com",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+593-993845713",
      "contactType": "customer service",
      "email": "invercopsemillasdefe@gmail.com",
      "availableLanguage": ["Spanish"]
    },
    "sameAs": [
      "https://facebook.com/invercop",
      "https://instagram.com/invercop",
      "https://linkedin.com/company/invercop"
    ],
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    },
    "priceRange": "$$",
    "paymentAccepted": "Cash, Credit Card",
    "currenciesAccepted": "USD",
    "taxID": "RUC: 1793227553001"
  };

  const faqPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cuánto cuesta la asesoría inicial?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La primera asesoría es totalmente gratuita y sin compromiso."
        }
      },
      {
        "@type": "Question",
        "name": "¿Debo tener un negocio ya formalizado?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No es necesario. Te ayudamos desde la etapa de idea hasta la formalización y crecimiento."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuánto tiempo tardan los trámites?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Depende del trámite, pero siempre buscamos agilizar el proceso y mantenerte informado/a."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué documentos necesito?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Te asesoramos y guiamos sobre los documentos necesarios según tu caso."
        }
      }
    ]
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Servicios profesionales para negocios y empresas",
    "provider": {
      "@type": "Organization",
      "name": "INVERCOP Semillas de Fe"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Servicios INVERCOP",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Asesoría Legal",
            "description": "Acompañamiento profesional en temas legales empresariales y familiares."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Contabilidad",
            "description": "Gestión tributaria y contable para tu empresa o emprendimiento."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Finanzas",
            "description": "Soluciones financieras para tu crecimiento personal o empresarial."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Psicología",
            "description": "Bienestar personal, familiar y empresarial con apoyo profesional."
          }
        }
      ]
    }
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "url": "https://invercorp.netlify.app/",
    "name": "INVERCOP Semillas de Fe - Te ayudamos a crecer",
    "description": "Asesoría gratuita para emprendedores en Ecuador. INVERCOP te ayuda a crecer tu negocio con fe, orden y respaldo financiero. Solicita tu consulta ahora.",
    "inLanguage": "es",
    "isPartOf": {
      "@type": "WebSite",
      "name": "INVERCOP Semillas de Fe",
      "url": "https://invercorp.netlify.app/"
    },
    "primaryImageOfPage": {
      "@type": "ImageObject",
      "url": "https://invercorp.netlify.app/assets/images/invercoorp_logo.png"
    },
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["h1", "h2", "h3"]
    },
    "mainEntity": {
      "@type": "FinancialService",
      "name": "INVERCOP Semillas de Fe",
      "description": "Asesoría gratuita para emprendedores en Ecuador. INVERCOP te ayuda a crecer tu negocio con fe, orden y respaldo financiero."
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
    </>
  );
};

export default JsonLD;
