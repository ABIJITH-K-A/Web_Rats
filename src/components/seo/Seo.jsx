import React from 'react';
import { Helmet } from 'react-helmet';

/**
 * Seo Component - Handles SEO meta tags and structured data
 * @param {Object} props - SEO props
 * @param {string} props.title - Page title
 * @param {string} props.description - Meta description
 * @param {string} props.keywords - Keywords (comma-separated)
 * @param {string} props.image - Open Graph image
 * @param {string} props.url - Current URL
 * @param {boolean} props.noIndex - Whether to index the page
 */
const Seo = ({
  title = 'Rynix - Professional Design & Development Services',
  description = 'Rynix provides professional design, web development, and creative services for students, startups, and businesses. Fast delivery, affordable pricing, and direct access to our founding team.',
  keywords = 'web development, design services, portfolio website, ppt presentation, student friendly, affordable design, web design, logo design, business website',
  image = 'https://rynix.studio/images/og-image.jpg',
  url = typeof window !== 'undefined' ? window.location.href : '',
  noIndex = false,
}) => {
  const siteName = 'Rynix';
  const siteUrl = 'https://rynix.studio';
  const logoUrl = 'https://rynix.studio/images/logo.png';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: siteName,
    image: logoUrl,
    description: description,
    url: siteUrl,
    telephone: '+91-8300920680',
    email: 'hello@rynix.studio',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    },
    openingHours: ['Mo-Fr 10:00-19:00', 'Sa 11:00-17:00'],
    priceRange: '₹₹₹',
    sameAs: [
      'https://instagram.com/rynix.studio',
    ],
  };

  return (
    <Helmet>
      {/* General Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Viewport and Character Set */}
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Robots */}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      
      {/* Open Graph / Facebook Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@rynix.studio" />
      
      {/* Favicon and Icons */}
      <link rel="icon" type="image/png" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      
      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default Seo;
