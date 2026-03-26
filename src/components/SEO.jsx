import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for centralized Meta tag management.
 * Isolating Helmet logic helps prevent initialization race conditions in production builds.
 */
const SEO = ({ title, description, ogImage, ogTitle, ogDescription, canonicalPath, jsonLd }) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kentehaul-b1cb5.web.app';
  const siteTitle = title ? `${title} | KenteHaul` : "KenteHaul | Authentic Ghanaian Kente & Smocks";
  const fullUrl = canonicalPath ? `${origin}${canonicalPath}` : (typeof window !== 'undefined' ? window.location.href : origin);
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={ogTitle || siteTitle} />
      <meta property="og:description" content={ogDescription || description} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={ogTitle || siteTitle} />
      <meta name="twitter:description" content={ogDescription || description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Favicon & Icons */}
      <link rel="icon" type="image/svg+xml" href={`${origin}/favicon.svg`} />
      <link rel="apple-touch-icon" href={`${origin}/favicon.svg`} />

      {/* Structured Data (JSON-LD) */}
      {jsonLd && (
        <script type="application/ld+json">
          {` ${JSON.stringify(jsonLd)} `}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
