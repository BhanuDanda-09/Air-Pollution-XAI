import React, { useState } from 'react';
import {
  ShieldCheck,
  Download,
  Trash2,
  AlertTriangle,
  Lock,
  FileText,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { useAuth } from '../context/AuthContext';
import airService from '../services/airService';

export default function PrivacyPage() {
  usePageMeta({
    title: 'Privacy & DPDP Act 2023 | Pollution XAI',
    description: 'Statutory compliance with the Digital Personal Data Protection Act, 2023. Export or delete your health profile.',
  });

  const { isAuthenticated, user, logout } = useAuth();

  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleExportData = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to export your personalized account data.');
      return;
    }
    setExporting(true);
    setError(null);
    setMessage(null);
    try {
      const data = await airService.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pollution_xai_user_data_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage('Your personal and health telemetry data was exported successfully.');
    } catch (err) {
      console.error('Export failed', err);
      setError('Failed to export user data. Please ensure you are logged in.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError(null);
    try {
      await airService.deleteUserAccount();
      setShowDeleteModal(false);
      logout();
      window.location.href = '/';
    } catch (err) {
      console.error('Account deletion failed', err);
      setError('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Statutory Data Protection
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Privacy Policy & DPDP Act 2023 Compliance
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            We adhere strictly to the Digital Personal Data Protection (DPDP) Act, 2023 of the Republic of India. You retain absolute ownership of your personal exposure and health vulnerability data.
          </p>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* DPDP Act Rights Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Right to Access & Portability</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Under Section 11 of the DPDP Act, you have the right to obtain a summary of your personal data being processed and export a machine-readable copy at any time.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Right to Erasure (Forget Me)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Under Section 12, you can demand permanent erasure of your account, health vulnerabilities, saved locations, and assessment history with instant cascading deletion.
            </p>
          </div>
        </div>

        {/* User Data Actions Box */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Manage Your Personal Data</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isAuthenticated ? `Signed in as ${user?.email}` : 'Sign in to access your saved data export and deletion.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              type="button"
              disabled={!isAuthenticated || exporting}
              onClick={handleExportData}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 disabled:opacity-40 transition-colors"
            >
              {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-blue-600" />}
              <span>Download My Complete Data Bundle (JSON)</span>
            </button>

            <button
              type="button"
              disabled={!isAuthenticated}
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Permanently Delete My Account & Health Data</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Confirm Permanent Erasure
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This action is irreversible under Section 12 of India's DPDP Act, 2023. All your saved places, health conditions, assessment history, and user credentials will be permanently erased immediately.
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 disabled:opacity-50"
                >
                  {deleting ? 'Erasing...' : 'Yes, Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
