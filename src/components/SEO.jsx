import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for centralized Meta tag management.
 * Isolating Helmet logic helps prevent initialization race conditions in production builds.
 */
const SEO = ({ siteContent, title, description, ogImage, ogTitle, ogDescription, canonicalPath, jsonLd }) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kentehaul.com';
  const favicon = siteContent?.logo || `${origin}/favicon.svg`;
  const siteTitle = title ? `${title} | KenteHaul` : "KenteHaul | Authentic Ghanaian Kente & Smocks";
  const seoDescription = description || "The world's premier destination for authentic, hand-woven Ghanaian Kente. Discover the legacy of royalty, heritage, and imperial craftsmanship.";
  const fullUrl = canonicalPath ? `${origin}${canonicalPath}` : (typeof window !== 'undefined' ? window.location.href : origin);
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={ogTitle || siteTitle} />
      <meta property="og:description" content={ogDescription || seoDescription} />
      <meta property="og:image" content={ogImage || `${origin}/favicon.svg`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={ogTitle || siteTitle} />
      <meta name="twitter:description" content={ogDescription || seoDescription} />
      <meta name="twitter:image" content={ogImage || `${origin}/favicon.svg`} />

      {/* Favicon & Icons */}
      <link rel="icon" type="image/svg+xml" href={favicon} />
      <link rel="apple-touch-icon" href={favicon} />

      {/* Structured Data (JSON-LD) */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
