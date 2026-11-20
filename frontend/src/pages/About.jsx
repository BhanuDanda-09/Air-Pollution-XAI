import React from 'react';
import {
  BookOpen,
  Target,
  Database,
  Cpu,
  Sparkles,
  ShieldAlert,
  Layers,
  Code2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function About() {
  const sections = [
    {
      id: 'problem',
      title: '1. Problem Statement',
      icon: Target,
      content: (
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Urban centers such as Delhi face chronic severe particulate matter episodes. While atmospheric dispersion models rely on emission inventories that are frequently outdated or unavailable in real time, machine learning offers rapid surrogate predictions. However, complex non-linear models often operate as "black boxes," obscuring why a specific concentration was predicted and impeding regulatory trust.
        </p>
      ),
    },
    {
      id: 'objectives',
      title: '2. Project Objectives',
      icon: CheckCircle2,
      content: (
        <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <li>Establish a rigorous ML pipeline predicting ambient PM2.5 from 5 surface meteorological features.</li>
          <li>Systematically evaluate and benchmark Random Forest, tuned XGBoost, and Deep Learning (MLP) on 406 untouched test samples.</li>
          <li>Implement Explainable AI (SHAP and LIME) to quantify feature importance and local instance attributions.</li>
          <li>Deploy a production-ready Flask REST backend and responsive React frontend for interactive stakeholder analysis.</li>
        </ul>
      ),
    },
    {
      id: 'dataset',
      title: '3. Dataset & Preprocessing',
      icon: Database,
      content: (
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            The dataset comprises <strong>2,027 clean, deduplicated hourly surface observations</strong> from Delhi monitoring stations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <strong className="text-slate-800 dark:text-slate-200">Target Variable:</strong> PM2.5 (Fine particulate matter ≤ 2.5 µm, µg/m³)
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <strong className="text-slate-800 dark:text-slate-200">5 Meteorological Features:</strong> RH (%), WD (°), SR (W/m²), BP (mmHg), AT (°C)
            </div>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 p-2.5 rounded-lg border border-blue-200 dark:border-blue-800">
            <strong>Barometric Pressure Unit:</strong> Confirmed in <strong>mmHg</strong> (values ~720–755 mmHg). Not converted or scaled to hPa.
          </p>
        </div>
      ),
    },
    {
      id: 'models',
      title: '4. Evaluated Model Architectures',
      icon: Cpu,
      content: (
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="space-y-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-navy-900 dark:text-white">Random Forest Regressor (Phase 1):</span> Bagging ensemble of 100 decision trees with median imputation. Achieved test R²=0.7269, RMSE=38.05 µg/m³.
            </div>
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
              <span className="font-bold text-blue-900 dark:text-blue-200">XGBoost Regressor (Phase 2 - Best Model):</span> 5-fold cross-validated hyperparameter-tuned gradient boosted trees. Achieved test R²=0.7455, RMSE=36.74 µg/m³.
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-navy-900 dark:text-white">Multilayer Perceptron / MLP (Phase 4):</span> Keras 3 sequential 3-layer neural network (128-64-32 units, Dropout, BatchNorm) with leak-free standardization on 1,377 sub-train samples. Achieved test R²=0.5408, RMSE=49.34 µg/m³.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'xai',
      title: '5. Explainable AI Techniques',
      icon: Sparkles,
      content: (
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            <strong>SHAP (Shapley Additive exPlanations):</strong> Employs cooperative game theory to distribute the difference between model output and baseline expected value fairly among input features. TreeExplainer provides exact, efficient solutions for tree models, while KernelExplainer provides model-agnostic sampling for the neural network.
          </p>
          <p>
            <strong>LIME (Local Interpretable Model-agnostic Explanations):</strong> Fits locally weighted linear surrogate models around individual instances to verify explanation stability.
          </p>
        </div>
      ),
    },
    {
      id: 'limitations',
      title: '6. Scientific Integrity & Limitations',
      icon: AlertTriangle,
      content: (
        <div className="space-y-2.5 text-sm text-amber-900 dark:text-amber-200 bg-amber-50/60 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800 leading-relaxed">
          <p>
            <strong>1. Statistical vs. Causal Attribution:</strong> Feature attributions (SHAP/LIME) quantify how the mathematical model utilizes meteorological inputs (what drives the model). They do <em>not</em> prove physical chemical emission causality or analytical chemical emission source apportionment (which requires physical laboratory speciation via EPA PMF).
          </p>
          <p>
            <strong>2. Sequential & Temporal Modeling:</strong> Using the 162,000-row all-India hourly dataset (Jan–May 2024), chronological time-series splitting (70% Train &lt; 15% Val &lt; 15% Test) was strictly applied to prevent future-to-past lookahead leakage.
          </p>
          <p>
            <strong>3. Model Reanalysis vs. Station Telemetry:</strong> CAMS is an atmospheric numerical model combining satellite data, chemical transport equations, and meteorological assimilation. While providing spatially continuous coverage across India without sensor dropouts, it represents grid-cell averages (~11 km resolution) rather than micro-local point measurements at a specific traffic intersection.
          </p>
        </div>
      ),
    },
    {
      id: 'viva-guide',
      title: '7. Viva Voce Defense & Methodology FAQ',
      icon: Code2,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Key academic defenses and scientific rationales prepared for capstone project review:
          </p>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                Q1: Why does persistence outperform ML at 1-hour, but collapses at 6-hour and 24-hour lead times?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Atmospheric inertia means that over short 1-hour lags, current particulate concentration is strongly autocorrelated (y_{'{'}t+1{'}'} ≈ y_t, R² ≈ 0.92–0.96). Adding ML regression at 1h introduces slight statistical variance. However, beyond 3 hours, diurnal solar heating, boundary layer mixing, and wind advection break persistence. At 6h, persistence R² collapses to 0.57 for PM2.5 and negative for photochemical Ozone (-0.43) and reactive NO2 (-0.20), while XGBoost and Random Forest maintain high positive skill (+33% to +85% improvement over persistence).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                Q2: How was spatial generalization tested on unseen geographies?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                A rigorous Leave-Cities-Out cross-validation was conducted. Six representative cities across different meteorological zones (Amritsar, Pune, Chennai, Patna, Indore, Guwahati — 21,600 samples) were completely isolated from the training partition. On these unseen geographies, the models achieved strong generalizability (R² = 0.9629 at 1h, R² = 0.6027 at 24h for PM2.5), demonstrating that synoptic meteorological features and topographic elevation allow transferable regional predictions.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                Q3: What is the exact distinction between SHAP Feature Attribution and Chemical Source Apportionment?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                SHAP (Shapley Additive Explanations) is an algorithmic game-theoretic technique revealing <em>which mathematical input features drove the model's numerical prediction</em>. Chemical source apportionment (e.g. EPA Positive Matrix Factorization / PMF) requires physical chemical laboratory analysis of filter tapes for elemental carbon, heavy metals, and secondary inorganic ions to allocate mass to vehicular exhaust, coal, or biomass combustion. Our platform strictly labels SHAP as "Feature Attribution (what drives the model)", adhering to strict scientific honesty.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                Q4: How does the Personal Exposure Risk score integrate WHO 2021 guidelines?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                The relocation decision engine combines the governing CPCB pollutant sub-index with rule-based sensitivity multipliers established in WHO 2021 air quality guidelines. Pre-existing chronic airway inflammation (asthma, COPD) triggers a 1.4× to 1.8× risk penalty when PM2.5 &gt; 60 µg/m³, transplacental particulate transfer adds elevated vulnerability for pregnancy, and hyperventilation during outdoor cardio exercise (&gt; 5 hrs/week) increases the estimated inhaled aerosol dose.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                Q5: How does the system remain within Render's 512 MB free-tier RAM ceiling?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Rather than loading massive uncompressed scikit-learn Random Forest ensembles (&gt; 330 MB RAM) simultaneously with Gunicorn web workers, the online serving bundle utilizes regularized XGBoost models serialized with joblib level-3 compression. The runtime serving bundle occupies only 2.06 MB on disk and consumes just 10.2 MB memory RSS, leaving over 400 MB of free memory headroom on Render's 512 MB free tier.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-10 py-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Project Documentation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
          About the Project
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Explainable AI-Based Air Pollution Prediction and Source Attribution — B.Tech Capstone Project.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{sec.title}</span>
              </h2>
              {sec.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
