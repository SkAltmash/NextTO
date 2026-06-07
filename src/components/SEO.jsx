import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'NextTo';
const BASE_URL = 'https://www.nextto.in';
const DEFAULT_IMAGE = `${BASE_URL}/logo.jpeg`;
const DEFAULT_DESCRIPTION =
  'NextTo — Fast & premium delivery of food, medicine, and groceries in Hinganghat. Order online from top restaurants, pharmacies, and shops near you in Hinganghat, Wardha.';

/**
 * SEO component — drop into any page/component.
 *
 * @param {string}  title         - Page title (without site suffix)
 * @param {string}  description   - Meta description (≤ 160 chars ideal)
 * @param {string}  canonical     - Canonical URL path, e.g. "/restaurants"
 * @param {string}  image         - Absolute OG image URL
 * @param {string}  type          - OG type, default "website"
 * @param {string[]} keywords     - Extra keywords array
 * @param {boolean} noIndex       - If true, adds noindex directive
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  keywords = [],
  noIndex = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Fast Delivery in Hinganghat`;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  const defaultKeywords = [
    'NextTo', 'Hinganghat', 'Hinganghat delivery', 'food delivery Hinganghat',
    'medicine delivery Hinganghat', 'grocery delivery Hinganghat',
    'online order Hinganghat', 'Wardha delivery', 'fast delivery', 'nextto.in',
    ...keywords,
  ].join(', ');

  return (
    <Helmet>
      {/* ── Primary ── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={defaultKeywords} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* ── Open Graph ── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_IN" />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* ── Geo / Local SEO (Hinganghat, Wardha, Maharashtra) ── */}
      <meta name="geo.region" content="IN-MH" />
      <meta name="geo.placename" content="Hinganghat, Wardha, Maharashtra, India" />
      <meta name="geo.position" content="20.5500;78.8400" />
      <meta name="ICBM" content="20.5500, 78.8400" />
      <meta name="language" content="English" />
    </Helmet>
  );
}
