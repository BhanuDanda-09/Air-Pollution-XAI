import { useEffect } from 'react';

const BASE_URL = 'https://air-pollution-xai.vercel.app';
const OG_IMAGE_URL = `${BASE_URL}/og-image.png`;
const OG_IMAGE_ALT = 'AirIQ India — Smarter air decisions for every address in India';

const PAGE_META = {
  '/': {
    title: 'AirIQ India | Smarter air decisions for every address in India',
    description: 'Smarter air decisions for every address in India. Real-time air quality forecasts, gridded village estimates, and personalized health guidance.',
  },
  '/live-assessment': {
    title: 'Live Air Quality Assessment | AirIQ India',
    description: 'Instant local air quality check, 6-pollutant breakdown, and practical health recommendations.',
  },
  '/check-air': {
    title: 'Check My Air | AirIQ India',
    description: 'Instant local air quality check, 6-pollutant breakdown, and practical health recommendations.',
  },
  '/relocation': {
    title: 'Relocation Advisor | AirIQ India',
    description: 'Compare air quality between cities and find healthier places to live with asthma-safe guidance.',
  },
  '/districts': {
    title: 'District Intelligence | AirIQ India',
    description: 'All-India administrative district air quality rankings, seasonal patterns, and environmental guidance.',
  },
  '/hotspots': {
    title: 'National Hotspots | AirIQ India',
    description: 'Empirical exposure rankings identifying vulnerable pollution basins and clean sanctuaries across India.',
  },
  '/livability': {
    title: 'Residential Livability Index | AirIQ India',
    description: 'Personalized 0–100 residential suitability scoring based on your family health profile.',
  },
  '/saved-places': {
    title: 'Saved Places & Alerts | AirIQ India',
    description: 'Save your home, office, and school locations for custom air quality safety alerts.',
  },
  '/history': {
    title: 'Exposure History | AirIQ India',
    description: 'Review your past air quality assessments, exposure trends, and export consultation reports.',
  },
  '/dashboard': {
    title: 'Air Quality Dashboard | AirIQ India',
    description: 'Comprehensive system telemetry, monitoring station status, and atmospheric stability indicators.',
  },
  '/prediction': {
    title: 'Surface Weather Estimator | AirIQ India',
    description: 'Understand how surface temperature, humidity, and wind physics shape particulate concentrations.',
  },
  '/comparison': {
    title: 'Model Comparison & Verification | AirIQ India',
    description: 'Transparent verification metrics and held-out cross-validation across lead forecast horizons.',
  },
  '/explainability': {
    title: 'Weather Factors & Air Drivers | AirIQ India',
    description: 'Explore what atmospheric conditions are driving particulate spikes in your neighborhood.',
  },
  '/how-it-works': {
    title: 'How It Works | AirIQ India',
    description: 'Learn how satellites, monitoring stations, and atmospheric physics provide neighborhood-level air forecasts.',
  },
  '/faq': {
    title: 'Frequently Asked Questions | AirIQ India',
    description: 'Answers on AQI, masks, air purifiers, outdoor exercise, and health precautions.',
  },
  '/terms': {
    title: 'Terms of Service | AirIQ India',
    description: 'Terms of service, platform guidance, and environmental advisory notices.',
  },
  '/contact': {
    title: 'Contact & Support | AirIQ India',
    description: 'Get in touch with our team for questions, suggestions, or reporting station discrepancies.',
  },
  '/privacy': {
    title: 'Privacy Policy & DPDP Rights | AirIQ India',
    description: 'DPDP Act 2023 compliance, explicit consent, data export, and permanent account erasure.',
  },
  '/about': {
    title: 'About AirIQ India | AirIQ India',
    description: 'Our mission to empower citizens across India with transparent, health-first air quality intelligence.',
  },
  '/404': {
    title: '404 Page Not Found | AirIQ India',
    description: 'The requested page was not found. Return to AirIQ India home.',
  },
};

function setOrCreateMeta(selector, attribute, value) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [attrName, attrVal] = selector.replace('meta[', '').replace(']', '').split('=');
    el.setAttribute(attrName, attrVal.replace(/['"]/g, ''));
    document.head.appendChild(el);
  }
  el.setAttribute(attribute, value);
}

function setOrCreateLink(rel, href) {
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function usePageMeta(pathname) {
  useEffect(() => {
    // Normalize path (handle trailing slashes or subpaths)
    const normalizedPath = pathname && pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : (pathname || '/');
    const meta = PAGE_META[normalizedPath] || {
      title: 'AirIQ India | Smarter air decisions for every address in India',
      description: 'Smarter air decisions for every address in India. Real-time air quality forecasts, gridded village estimates, and personalized health guidance.',
    };

    const currentUrl = `${BASE_URL}${normalizedPath === '/' ? '' : normalizedPath}`;

    // 1. Ensure <title>, og:title, and twitter:title are IDENTICAL
    document.title = meta.title;
    setOrCreateMeta('meta[property="og:title"]', 'content', meta.title);
    setOrCreateMeta('meta[name="twitter:title"]', 'content', meta.title);

    // 2. Ensure meta description, og:description, and twitter:description are IDENTICAL
    setOrCreateMeta('meta[name="description"]', 'content', meta.description);
    setOrCreateMeta('meta[property="og:description"]', 'content', meta.description);
    setOrCreateMeta('meta[name="twitter:description"]', 'content', meta.description);

    // 3. Update canonical link and URLs
    setOrCreateLink('canonical', currentUrl || BASE_URL);
    setOrCreateMeta('meta[property="og:url"]', 'content', currentUrl || BASE_URL);
    setOrCreateMeta('meta[name="twitter:url"]', 'content', currentUrl || BASE_URL);

    // 4. Set og:image and twitter:image (1200x630 branded card)
    setOrCreateMeta('meta[property="og:image"]', 'content', OG_IMAGE_URL);
    setOrCreateMeta('meta[property="og:image:width"]', 'content', '1200');
    setOrCreateMeta('meta[property="og:image:height"]', 'content', '630');
    setOrCreateMeta('meta[property="og:image:alt"]', 'content', OG_IMAGE_ALT);

    setOrCreateMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setOrCreateMeta('meta[name="twitter:image"]', 'content', OG_IMAGE_URL);
    setOrCreateMeta('meta[name="twitter:image:alt"]', 'content', OG_IMAGE_ALT);
  }, [pathname]);
}

export default usePageMeta;
