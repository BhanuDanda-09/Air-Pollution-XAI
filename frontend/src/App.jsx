import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthModal from './components/AuthModal';
import ServiceWorkerToast from './components/ServiceWorkerToast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DemoBanner from './components/DemoBanner';
import ProtectedRoute from './components/ProtectedRoute';
import PageSkeleton from './components/PageSkeleton';
import ErrorBoundary from './components/ErrorBoundary';
import usePageMeta from './hooks/usePageMeta';
import predictionService from './services/predictionService';

// Code-split route components for optimized bundle performance
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LiveAssessmentPage = lazy(() => import('./pages/LiveAssessmentPage'));
const LivabilityPage = lazy(() => import('./pages/LivabilityPage'));
const SavedPlacesPage = lazy(() => import('./pages/SavedPlacesPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const Prediction = lazy(() => import('./pages/Prediction'));
const ModelComparisonPage = lazy(() => import('./pages/ModelComparisonPage'));
const Explainability = lazy(() => import('./pages/Explainability'));
const About = lazy(() => import('./pages/About'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const DataSourcesPage = lazy(() => import('./pages/DataSourcesPage'));
const CookieNoticePage = lazy(() => import('./pages/CookieNoticePage'));
const MethodologyPage = lazy(() => import('./pages/MethodologyPage'));
const RelocationAdvisorPage = lazy(() => import('./pages/RelocationAdvisorPage'));
const HotspotsPage = lazy(() => import('./pages/HotspotsPage'));
const DistrictsPage = lazy(() => import('./pages/DistrictsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const WorkerPage = lazy(() => import('./pages/WorkerPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function MetaHandler() {
  const location = useLocation();
  usePageMeta(location.pathname);
  return null;
}

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
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <MetaHandler />
          <div className="flex flex-col min-h-[100dvh] pb-[env(safe-area-inset-bottom)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-100 transition-colors">
            <DemoBanner />
            <Navbar isBackendOnline={isBackendOnline} />
            <AuthModal />
            <ServiceWorkerToast />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <ErrorBoundary>
                <Suspense fallback={<PageSkeleton variant="generic" className="py-6" />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/relocation" element={<RelocationAdvisorPage />} />
                    <Route path="/hotspots" element={<HotspotsPage />} />
                    <Route path="/districts" element={<DistrictsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/livability" element={<LivabilityPage />} />
                    <Route path="/live-assessment" element={<LiveAssessmentPage />} />
                    <Route path="/check-air" element={<LiveAssessmentPage />} />
                    <Route path="/saved-places" element={<SavedPlacesPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/prediction" element={<Prediction />} />
                    <Route path="/comparison" element={<ModelComparisonPage />} />
                    <Route path="/explainability" element={<Explainability />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/methodology" element={<MethodologyPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/data-sources" element={<DataSourcesPage />} />
                    <Route path="/cookies" element={<CookieNoticePage />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <AdminPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/worker"
                      element={
                        <ProtectedRoute requiredRole={['worker', 'admin']}>
                          <WorkerPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                    <Route path="/404" element={<NotFoundPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>

            <Footer isBackendOnline={isBackendOnline} />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
