import React from 'react';
import { Database, ExternalLink, ShieldCheck, Info, CheckCircle2, Globe, MapPin, Satellite } from 'lucide-react';
import usePageMeta from '../hooks/usePageMeta';

export default function DataSourcesPage() {
  usePageMeta('/data-sources');

  const sources = [
    {
      title: 'Open-Meteo Weather & Air Quality API',
      provider: 'Open-Meteo GmbH',
      license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      url: 'https://open-meteo.com/',
      description:
        'Provides real-time and forecasted surface meteorology (temperature, relative humidity, wind speed, wind direction, boundary layer height, and surface pressure) and planetary atmospheric chemistry data.',
      attributionText: 'Weather and air data by Open-Meteo.com, licensed under CC BY 4.0.',
    },
    {
      title: 'Copernicus Atmosphere Monitoring Service (CAMS)',
      provider: 'European Centre for Medium-Range Weather Forecasts (ECMWF)',
      license: 'Copernicus Open Access Policy',
      url: 'https://atmosphere.copernicus.eu/',
      description:
        'Global and regional atmospheric chemistry reanalysis and near-real-time forecasting models assimilating satellite observations of aerosol optical depth, dust, particulate matter, and trace gases.',
      attributionText: 'Contains modified Copernicus Atmosphere Monitoring Service information [2026]. Generated using Copernicus Atmosphere Monitoring Service information.',
    },
    {
      title: 'OpenStreetMap & Nominatim Geocoding',
      provider: 'OpenStreetMap Foundation & Contributors',
      license: 'Open Database License (ODbL) 1.0',
      url: 'https://www.openstreetmap.org/',
      description:
        'Powers reverse geocoding, boundary resolution, landmark search, and cartographic map visualisations across Indian states, districts, and municipalities.',
      attributionText: '© OpenStreetMap contributors. Map data available under the Open Database Licence (ODbL).',
    },
    {
      title: 'Central Pollution Control Board (CPCB) NAQI',
      provider: 'Ministry of Environment, Forest and Climate Change, Government of India',
      license: 'National Open Data License (Government of India)',
      url: 'https://cpcb.nic.in/',
      description:
        'National Air Quality Index (NAQI) statutory concentration category thresholds (Good 0-30, Satisfactory 31-60, Moderate 61-90, Poor 91-120, Very Poor 121-250, Severe 250+ µg/m³ for PM2.5) and official health advisory statements.',
      attributionText: 'Based on official National Air Quality Index (NAQI) concentration categories published by the Central Pollution Control Board (CPCB), Government of India.',
    },
    {
      title: 'OpenAQ Data Platform',
      provider: 'OpenAQ Inc. (Non-Profit)',
      license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      url: 'https://openaq.org/',
      description:
        'Aggregates real-time statutory regulatory monitoring station data across Continuous Ambient Air Quality Monitoring Stations (CAAQMS) for model validation and verification.',
      attributionText: 'Historical station telemetry aggregated through OpenAQ under CC BY 4.0.',
    },
    {
      title: 'ECMWF ERA5 Atmospheric Reanalysis',
      provider: 'European Centre for Medium-Range Weather Forecasts',
      license: 'Copernicus Climate Change Service',
      url: 'https://www.ecmwf.int/en/forecasts/dataset/ecmwf-reanalysis-v5',
      description:
        'Fifth-generation atmospheric reanalysis combining model physics with global observations into a complete, consistent hourly climate dataset used for baseline atmospheric calibration.',
      attributionText: 'Contains modified Copernicus Climate Change Service information [2026].',
    },
    {
      title: 'All-India Pincode Directory',
      provider: 'Department of Posts, Ministry of Communications, Government of India',
      license: 'Government Open Data License - India (GODL)',
      url: 'https://data.gov.in/resource/all-india-pincode-directory',
      description:
        'Official 6-digit postal index number directory used for mapping citizen PIN codes to accurate district centroids and administrative delivery jurisdictions.',
      attributionText: 'Postal boundaries and PIN lookup derived from Data.gov.in Open Data portal.',
    },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider">
          <Database className="w-3.5 h-3.5" />
          <span>Transparency & Open Science</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Data Sources & Credits
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          AirIQ India synthesises satellite observations, physics-based atmospheric models, and ground station measurements. Here is every scientific data provider, licence, and citation that powers our platform.
        </p>
      </div>

      {/* Attribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {sources.map((src) => (
          <div
            key={src.title}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-cyan-500/50 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {src.title}
                </h2>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors shrink-0"
                  aria-label={`Visit ${src.title} official website`}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {src.provider}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {src.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                License & Attribution Notice:
              </div>
              <blockquote className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 font-mono text-[11px] leading-relaxed">
                {src.attributionText}
              </blockquote>
            </div>
          </div>
        ))}
      </div>

      {/* Scientific Commitment Notice */}
      <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-4 text-emerald-900 dark:text-emerald-200">
        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" />
        <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
          <h3 className="font-bold text-base text-emerald-950 dark:text-emerald-100">
            Open Data & Citizen Science Commitment
          </h3>
          <p>
            AirIQ India does not gate public environmental data behind proprietary paywalls. All mathematical formulations, verification cross-validation curves, and model attribution matrices are published openly to advance environmental transparency across India.
          </p>
        </div>
      </div>
    </div>
  );
}
