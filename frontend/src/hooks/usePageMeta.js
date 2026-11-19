import { useEffect } from 'react';

const BASE_URL = 'https://air-pollution-xai.vercel.app';
const OG_IMAGE_URL = `${BASE_URL}/og-image.png`;
const OG_IMAGE_ALT = 'Pollution XAI - Live Air Quality Assessment & Explainable PM2.5 Intelligence';

const PAGE_META = {
  '/': {
    title: 'Pollution XAI | Is The Air Safe Where You Are?',
    description: 'Instant residential air safety diagnostics, live PM2.5 assessments, and explainable ML intelligence for Delhi-NCR.',
  },
  '/live-assessment': {
    title: 'Live Air Quality Assessment | Pollution XAI',
    description: 'Real-time scientific diagnostic comparing XGBoost meteorological estimations with Copernicus CAMS regional PM2.5 reference data.',
  },
  '/livability': {
    title: 'Residential Livability Index & Comparison | Pollution XAI',
    description: 'Actionable 0–100 residential livability scoring, head-to-head location comparisons, and personalized health profile recommendations.',
  },
  '/saved-places': {
    title: 'Saved Places & Custom PM2.5 Alerts | Pollution XAI',
    description: 'Bookmark Delhi-NCR locations for 1-click diagnostics and automated PM2.5 threshold alerts.',
  },
  '/history': {
    title: 'Personal Exposure & Assessment History | Pollution XAI',
    description: 'Review past air quality assessments, exposure trends, and export medical consultation reports as CSV.',
  },
  '/dashboard': {
    title: 'Model Telemetry & System Dashboard | Pollution XAI',
    description: 'Live backend health status, held-out test benchmarks for 3 deployed models, and meteorological bounds.',
  },
  '/prediction': {
    title: 'Surface Meteorology PM2.5 Prediction | Pollution XAI',
    description: 'Input RH, WD, SR, BP, and AT to estimate 24-hr PM2.5 concentration with indicative CPCB health categories.',
  },
  '/comparison': {
    title: 'Multi-Model Performance Benchmarking | Pollution XAI',
    description: 'Simultaneously evaluate Random Forest, tuned XGBoost, and MLP neural network on identical weather inputs.',
  },
  '/explainability': {
    title: 'Explainable AI & SHAP Local Attributions | Pollution XAI',
    description: 'Deconstruct individual PM2.5 predictions with exact Shapley values and meteorological force plots.',
  },
  '/about': {
    title: 'About the Capstone Project | Pollution XAI',
    description: 'Problem statement, preprocessing pipeline, model architectures, and scientific limitations of the Delhi air quality study.',
  },
  '/404': {
    title: '404 Page Not Found | Pollution XAI',
    description: 'The requested page or diagnostic coordinate was not found.',
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
    const normalizedPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const meta = PAGE_META[normalizedPath] || {
      title: 'Pollution XAI | Explainable Air Quality Intelligence',
      description: 'Real-time air quality diagnostics and explainable AI for Delhi-NCR.',
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
