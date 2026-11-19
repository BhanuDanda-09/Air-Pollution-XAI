import { useEffect } from 'react';

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

export function usePageMeta(pathname) {
  useEffect(() => {
    const meta = PAGE_META[pathname] || {
      title: 'Pollution XAI | Explainable Air Quality Intelligence',
      description: 'Real-time air quality diagnostics and explainable AI for Delhi-NCR.',
    };

    document.title = meta.title;

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', meta.description);
    }

    // Update Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', meta.title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', meta.description);
  }, [pathname]);
}

export default usePageMeta;
