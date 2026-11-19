import React from 'react';
import { Link } from 'react-router-dom';
import { Wind, Github, ShieldAlert, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
                <Wind className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-navy-900 dark:text-white">
                Pollution <span className="text-blue-600 dark:text-blue-400">XAI</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
              Final-year B.Tech Capstone Project: <em>Explainable AI-Based Air Pollution Prediction and Source Attribution</em>. 
              Delivers rigorous predictive modeling, Copernicus CAMS reference benchmarking, and local SHAP feature attribution from surface meteorology.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/BhanuDanda-09/Air-Pollution-XAI"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Capabilities
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link to="/live-assessment" className="hover:text-blue-600 dark:hover:text-blue-400">Live Assessment</Link></li>
              <li><Link to="/livability" className="hover:text-blue-600 dark:hover:text-blue-400">Livability Index</Link></li>
              <li><Link to="/prediction" className="hover:text-blue-600 dark:hover:text-blue-400">PM2.5 Estimation</Link></li>
              <li><Link to="/comparison" className="hover:text-blue-600 dark:hover:text-blue-400">Model Comparison</Link></li>
              <li><Link to="/explainability" className="hover:text-blue-600 dark:hover:text-blue-400">SHAP Attribution</Link></li>
              <li><Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">Model Telemetry</Link></li>
            </ul>
          </div>

          {/* Column 3: Tech Stack */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Stack
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li>• Python 3.11 / Flask REST API</li>
              <li>• Scikit-learn Random Forest</li>
              <li>• XGBoost Regressor (Tuned)</li>
              <li>• Keras 3 / TensorFlow MLP</li>
              <li>• SHAP (Tree & Kernel Explainer)</li>
              <li>• React 18 / Tailwind CSS / Chart.js</li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-start gap-2 max-w-3xl">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong>Scientific Disclaimer:</strong> This platform provides indicative statistical PM2.5 estimates based on surface meteorological features. 
              Output categories represent indicative concentration bands and do not constitute an official regulatory CPCB National AQI or certified monitor measurement.
            </p>
          </div>
          <div className="text-right shrink-0">
            © 2026 Air Pollution XAI Project
          </div>
        </div>
      </div>
    </footer>
  );
}
