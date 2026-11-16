import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import LiveAssessmentPage from './pages/LiveAssessmentPage';
import LivabilityPage from './pages/LivabilityPage';
import Prediction from './pages/Prediction';
import ModelComparisonPage from './pages/ModelComparisonPage';
import Explainability from './pages/Explainability';
import About from './pages/About';
import predictionService from './services/predictionService';

export default function App() {
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  useEffect(() => {
    // Check initial backend health
    predictionService
      .getHealth()
      .then((res) => {
        setIsBackendOnline(res?.status === 'healthy');
      })
      .catch(() => {
        setIsBackendOnline(false);
      });
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <Navbar isBackendOnline={isBackendOnline} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/livability" element={<LivabilityPage />} />
            <Route path="/live-assessment" element={<LiveAssessmentPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/prediction" element={<Prediction />} />
            <Route path="/comparison" element={<ModelComparisonPage />} />
            <Route path="/explainability" element={<Explainability />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
