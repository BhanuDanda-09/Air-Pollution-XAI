import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ShieldCheck,
  HeartPulse,
  Wind,
  Home,
  CheckCircle2,
} from 'lucide-react';
import usePageMeta from '../hooks/usePageMeta';

export default function FAQPage() {
  usePageMeta('/faq');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const categories = ['All', 'Air Quality & AQI', 'Health & Sensitive Profiles', 'Protection & Masks', 'Data & Privacy'];

  const faqs = [
    {
      category: 'Air Quality & AQI',
      q: 'What is AQI and how does India calculate it?',
      a: 'The Air Quality Index (AQI) is a standard scale developed by the Central Pollution Control Board (CPCB) that converts concentrations of air pollutants into a simple score from 0 to 500. It evaluates six key pollutants: PM2.5, PM10, Nitrogen Dioxide (NO2), Sulfur Dioxide (SO2), Carbon Monoxide (CO), and Ozone (O3). The overall AQI is governed by whichever pollutant has the worst sub-index.',
    },
    {
      category: 'Air Quality & AQI',
      q: 'How does AirIQ India calculate air quality for villages without monitoring stations?',
      a: 'Over 95% of rural India does not have a physical ambient monitoring station within 25 km. Rather than naively guessing or drawing straight lines between distant city monitors, AirIQ India uses European Copernicus (CAMS) atmospheric numerical reanalysis assimilated with local surface weather physics. We label these results clearly as "Tier 3: Gridded Regional Estimate" so citizens and authorities always know when data is estimated rather than measured.',
    },
    {
      category: 'Air Quality & AQI',
      q: 'Why does winter air pollution spike so severely in North India?',
      a: 'During winter months (November to January), cold air near the ground gets trapped under a warm upper air layer in a phenomenon called a "thermal temperature inversion." This acts like a giant atmospheric ceiling, preventing vehicle exhaust, biomass smoke, and dust from dispersing upwards. Calm surface winds further prevent horizontal dispersion.',
    },
    {
      category: 'Health & Sensitive Profiles',
      q: 'How does my health condition change the advice I see?',
      a: 'Fine particulate matter (PM2.5) penetrates deep into the alveolar sacs of the lungs and passes into the bloodstream. People with asthma or COPD experience bronchospasms at much lower particulate levels than healthy adults. Transplacental transfer poses risks during pregnancy, and developing lung airways make children especially vulnerable. AirIQ India uses WHO 2021 clinical exposure multipliers to trigger stricter health precautions earlier for vulnerable individuals.',
    },
    {
      category: 'Health & Sensitive Profiles',
      q: 'Is it safe to exercise outdoors when the AQI is Moderate (101–200)?',
      a: 'During strenuous cardiovascular exercise (running, cycling), your breathing rate increases by 4 to 8 times, and you primarily breathe through your mouth, bypassing natural nasal filtration. For sensitive individuals or asthma patients, outdoor cardio is discouraged above AQI 100. For healthy adults, early mornings during winter often have the worst inversion layer; exercising in the mid-afternoon when the sun breaks the inversion is safer.',
    },
    {
      category: 'Protection & Masks',
      q: 'Which masks actually protect against PM2.5 particles?',
      a: 'Standard surgical masks and cloth masks only filter large dust particles and do not seal against fine PM2.5 aerosols (which are 30 times thinner than a human hair). You need a well-fitted certified N95, KN95, or FFP2 respirator mask with an airtight nose-clip seal to filter at least 95% of microscopic particulates.',
    },
    {
      category: 'Protection & Masks',
      q: 'Do HEPA air purifiers really work inside Indian homes?',
      a: 'Yes, certified True HEPA (H13) air purifiers can reduce indoor PM2.5 levels by 70% to 90% in enclosed rooms, provided windows and doors are kept shut. When buying a purifier, check the Clean Air Delivery Rate (CADR) to ensure it matches the square footage of your room. Avoid purifiers with uncertified ionizers that release harmful ozone.',
    },
    {
      category: 'Data & Privacy',
      q: 'How is my personal health information protected on AirIQ India?',
      a: 'We fully comply with India’s Digital Personal Data Protection (DPDP) Act 2023. Health attributes (such as asthma, pregnancy, or heart conditions) are processed exclusively with your explicit consent to generate safety verdicts. We never log or sell health data to third parties. You have the statutory right to export your complete data bundle or permanently delete your account and all associated records at any time from the Privacy page.',
    },
    {
      category: 'Air Quality & AQI',
      q: 'Can I use AirIQ India to plan moving to another city?',
      a: 'Yes! Our Relocation Advisor compares your current city with up to four candidate destinations. It analyzes chronic exposure, seasonal winter peaks, monsoon clean windows, and gives a clear verdict (Highly Recommended, Conditional, or Not Recommended) tailored to your health profile.',
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-10 py-6 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          Consumer Help & FAQs
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Practical answers about air pollution in India, mask safety, indoor purifiers, and how AirIQ India personalizes health guidance.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. asthma, N95 masks, winter smog, PIN codes)..."
            className="w-full px-4 py-3 pl-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion FAQ Items */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
            No questions match your search. Try different keywords or browse all categories.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = expandedIndex === idx;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white text-sm sm:text-base hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
                    <p>{faq.a}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified against CPCB & WHO 2021 air quality standards</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
