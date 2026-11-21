import { useEffect } from 'react';

const BASE_URL = 'https://air-pollution-xai.vercel.app';
const OG_IMAGE_URL = `${BASE_URL}/og-image.png`;
const OG_IMAGE_ALT = 'VayuPulse - Live Air Quality & Health Advisor';

const PAGE_META = {
  '/': {
    title: 'VayuPulse | Know Your Air. Protect Your Life.',
    description: 'Real-time air quality forecasts, personal health advisories, and relocation intelligence across India.',
  },
  '/live-assessment': {
    title: 'Check My Air | VayuPulse',
    description: 'Instant local air quality check, 6-pollutant breakdown, and practical health recommendations.',
  },
  '/check-air': {
    title: 'Check My Air | VayuPulse',
    description: 'Instant local air quality check, 6-pollutant breakdown, and practical health recommendations.',
  },
  '/relocation': {
    title: 'Relocation Advisor | VayuPulse',
    description: 'Compare air quality between cities and find healthier places to live with asthma-safe guidance.',
  },
  '/districts': {
    title: 'District Intelligence | VayuPulse',
    description: 'All-India administrative district air quality rankings, seasonal patterns, and environmental guidance.',
  },
  '/hotspots': {
    title: 'National Hotspot Rankings | VayuPulse',
    description: 'Empirical exposure rankings identifying vulnerable pollution basins and clean sanctuaries across India.',
  },
  '/livability': {
    title: 'Livability Score & Verdict | VayuPulse',
    description: 'Personalized 0–100 residential suitability scoring based on your family health profile.',
  },
  '/saved-places': {
    title: 'Saved Places & Custom Alerts | VayuPulse',
    description: 'Save your home, office, and school locations for custom air quality safety alerts.',
  },
  '/history': {
    title: 'Personal Exposure & Assessment History | VayuPulse',
    description: 'Review your past air quality assessments, exposure trends, and export consultation reports.',
  },
  '/dashboard': {
    title: 'Environmental Intelligence Dashboard | VayuPulse',
    description: 'Comprehensive system telemetry, monitoring station status, and atmospheric stability indicators.',
  },
  '/prediction': {
    title: 'Surface Weather Estimator | VayuPulse',
    description: 'Understand how surface temperature, humidity, and wind physics shape particulate concentrations.',
  },
  '/comparison': {
    title: 'Forecast Accuracy & Model Verification | VayuPulse',
    description: 'Transparent verification metrics and held-out cross-validation across lead forecast horizons.',
  },
  '/explainability': {
    title: 'Weather Factors & Air Quality Drivers | VayuPulse',
    description: 'Explore what atmospheric conditions are driving particulate spikes in your neighborhood.',
  },
  '/how-it-works': {
    title: 'How It Works | VayuPulse',
    description: 'Learn how satellites, monitoring stations, and atmospheric physics provide neighborhood-level air forecasts.',
  },
  '/faq': {
    title: 'Frequently Asked Questions | VayuPulse',
    description: 'Answers on AQI, masks, air purifiers, outdoor exercise, and health precautions.',
  },
  '/terms': {
    title: 'Terms of Service | VayuPulse',
    description: 'Terms of service, platform guidance, and environmental advisory notices.',
  },
  '/contact': {
    title: 'Contact & Feedback | VayuPulse',
    description: 'Get in touch with our team for questions, suggestions, or reporting station discrepancies.',
  },
  '/privacy': {
    title: 'Privacy Policy & Data Rights | VayuPulse',
    description: 'DPDP Act 2023 compliance, explicit consent, data export, and permanent account erasure.',
  },
  '/about': {
    title: 'About Our Mission | VayuPulse',
    description: 'Our mission to empower citizens across India with transparent, health-first air quality intelligence.',
  },
  '/404': {
    title: '404 Page Not Found | VayuPulse',
    description: 'The requested page was not found. Return to VayuPulse home.',
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
      title: 'VayuPulse | Know Your Air. Protect Your Life.',
      description: 'Real-time air quality forecasts, personal health advisories, and relocation intelligence across India.',
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
