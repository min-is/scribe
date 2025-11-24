'use client';

import { useState, useMemo } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';

type TermEntry = {
  term: string;
  definition: string;
  category: string;
  examples?: string[];
};

// Common medical terminology - can be expanded
const TERMINOLOGY: TermEntry[] = [
  // Vital Signs & Measurements
  { term: 'BP', definition: 'Blood Pressure', category: 'Vital Signs' },
  { term: 'HR', definition: 'Heart Rate', category: 'Vital Signs' },
  { term: 'RR', definition: 'Respiratory Rate', category: 'Vital Signs' },
  { term: 'SpO2', definition: 'Oxygen Saturation', category: 'Vital Signs' },
  { term: 'T', definition: 'Temperature', category: 'Vital Signs' },

  // Common Abbreviations
  { term: 'CC', definition: 'Chief Complaint', category: 'Documentation' },
  { term: 'HPI', definition: 'History of Present Illness', category: 'Documentation' },
  { term: 'PMH', definition: 'Past Medical History', category: 'Documentation' },
  { term: 'PSH', definition: 'Past Surgical History', category: 'Documentation' },
  { term: 'FH', definition: 'Family History', category: 'Documentation' },
  { term: 'SH', definition: 'Social History', category: 'Documentation' },
  { term: 'ROS', definition: 'Review of Systems', category: 'Documentation' },
  { term: 'PE', definition: 'Physical Exam', category: 'Documentation' },
  { term: 'A&P', definition: 'Assessment and Plan', category: 'Documentation' },
  { term: 'MDM', definition: 'Medical Decision Making', category: 'Documentation' },

  // Body Systems
  { term: 'HEENT', definition: 'Head, Eyes, Ears, Nose, Throat', category: 'Physical Exam' },
  { term: 'CV', definition: 'Cardiovascular', category: 'Physical Exam' },
  { term: 'Resp', definition: 'Respiratory', category: 'Physical Exam' },
  { term: 'Abd', definition: 'Abdomen/Abdominal', category: 'Physical Exam' },
  { term: 'MSK', definition: 'Musculoskeletal', category: 'Physical Exam' },
  { term: 'Neuro', definition: 'Neurological', category: 'Physical Exam' },
  { term: 'GU', definition: 'Genitourinary', category: 'Physical Exam' },
  { term: 'GI', definition: 'Gastrointestinal', category: 'Physical Exam' },
  { term: 'Derm', definition: 'Dermatological', category: 'Physical Exam' },

  // Cardiac Terms
  { term: 'MI', definition: 'Myocardial Infarction (Heart Attack)', category: 'Cardiac' },
  { term: 'CHF', definition: 'Congestive Heart Failure', category: 'Cardiac' },
  { term: 'A-fib', definition: 'Atrial Fibrillation', category: 'Cardiac' },
  { term: 'CAD', definition: 'Coronary Artery Disease', category: 'Cardiac' },
  { term: 'HTN', definition: 'Hypertension (High Blood Pressure)', category: 'Cardiac' },
  { term: 'STEMI', definition: 'ST-Elevation Myocardial Infarction', category: 'Cardiac' },
  { term: 'NSTEMI', definition: 'Non-ST-Elevation Myocardial Infarction', category: 'Cardiac' },

  // Respiratory
  { term: 'SOB', definition: 'Shortness of Breath', category: 'Respiratory' },
  { term: 'DOE', definition: 'Dyspnea on Exertion', category: 'Respiratory' },
  { term: 'COPD', definition: 'Chronic Obstructive Pulmonary Disease', category: 'Respiratory' },
  { term: 'PE', definition: 'Pulmonary Embolism', category: 'Respiratory' },
  { term: 'ARDS', definition: 'Acute Respiratory Distress Syndrome', category: 'Respiratory' },

  // Neurological
  { term: 'CVA', definition: 'Cerebrovascular Accident (Stroke)', category: 'Neurological' },
  { term: 'TIA', definition: 'Transient Ischemic Attack', category: 'Neurological' },
  { term: 'LOC', definition: 'Loss of Consciousness', category: 'Neurological' },
  { term: 'AMS', definition: 'Altered Mental Status', category: 'Neurological' },
  { term: 'GCS', definition: 'Glasgow Coma Scale', category: 'Neurological' },
  { term: 'CNS', definition: 'Central Nervous System', category: 'Neurological' },
  { term: 'PNS', definition: 'Peripheral Nervous System', category: 'Neurological' },

  // GI/GU
  { term: 'N/V', definition: 'Nausea and Vomiting', category: 'GI' },
  { term: 'GERD', definition: 'Gastroesophageal Reflux Disease', category: 'GI' },
  { term: 'BM', definition: 'Bowel Movement', category: 'GI' },
  { term: 'UTI', definition: 'Urinary Tract Infection', category: 'GU' },
  { term: 'ARF', definition: 'Acute Renal Failure', category: 'GU' },
  { term: 'CKD', definition: 'Chronic Kidney Disease', category: 'GU' },

  // Labs & Diagnostics
  { term: 'CBC', definition: 'Complete Blood Count', category: 'Labs' },
  { term: 'BMP', definition: 'Basic Metabolic Panel', category: 'Labs' },
  { term: 'CMP', definition: 'Comprehensive Metabolic Panel', category: 'Labs' },
  { term: 'ABG', definition: 'Arterial Blood Gas', category: 'Labs' },
  { term: 'CT', definition: 'Computed Tomography', category: 'Imaging' },
  { term: 'MRI', definition: 'Magnetic Resonance Imaging', category: 'Imaging' },
  { term: 'CXR', definition: 'Chest X-Ray', category: 'Imaging' },
  { term: 'EKG/ECG', definition: 'Electrocardiogram', category: 'Diagnostics' },
  { term: 'US', definition: 'Ultrasound', category: 'Imaging' },

  // Medications
  { term: 'NSAID', definition: 'Nonsteroidal Anti-Inflammatory Drug', category: 'Medications' },
  { term: 'ACE-I', definition: 'Angiotensin-Converting Enzyme Inhibitor', category: 'Medications' },
  { term: 'ARB', definition: 'Angiotensin Receptor Blocker', category: 'Medications' },
  { term: 'PPI', definition: 'Proton Pump Inhibitor', category: 'Medications' },
  { term: 'IV', definition: 'Intravenous', category: 'Medications' },
  { term: 'PO', definition: 'Per Os (By Mouth)', category: 'Medications' },
  { term: 'PRN', definition: 'Pro Re Nata (As Needed)', category: 'Medications' },

  // General Medical
  { term: 'Dx', definition: 'Diagnosis', category: 'General' },
  { term: 'Tx', definition: 'Treatment', category: 'General' },
  { term: 'Sx', definition: 'Symptoms', category: 'General' },
  { term: 'Hx', definition: 'History', category: 'General' },
  { term: 'Pt', definition: 'Patient', category: 'General' },
  { term: 'WNL', definition: 'Within Normal Limits', category: 'General' },
  { term: 'NAD', definition: 'No Acute Distress', category: 'General' },
  { term: 'VSS', definition: 'Vital Signs Stable', category: 'General' },
];

export default function TerminologyClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(TERMINOLOGY.map(t => t.category)));
    return ['All', ...cats.sort()];
  }, []);

  const filteredTerms = useMemo(() => {
    let filtered = TERMINOLOGY;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by search
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.term.toLowerCase().includes(query) ||
          t.definition.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => a.term.localeCompare(b.term));
  }, [debouncedQuery, selectedCategory]);

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-main mb-2">
            Medical Terminology
          </h1>
          <p className="text-zinc-400 text-base">
            Common medical abbreviations and terms for clinical documentation
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xl" />
            <input
              type="text"
              placeholder="Search terminology..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          {debouncedQuery && (
            <p className="text-zinc-400 text-sm mt-2">
              Found {filteredTerms.length} result{filteredTerms.length !== 1 ? 's' : ''} for &quot;{debouncedQuery}&quot;
            </p>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-zinc-800">
            {filteredTerms.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-400">
                No terminology found. Try a different search term or category.
              </div>
            ) : (
              filteredTerms.map((term, index) => (
                <div
                  key={index}
                  className="px-6 py-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white">
                          {term.term}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/10 text-blue-400 border border-blue-600/20">
                          {term.category}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300">
                        {term.definition}
                      </p>
                      {term.examples && term.examples.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-zinc-500">
                            Examples: {term.examples.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Note about expanding */}
        <div className="mt-6 bg-blue-900/10 border border-blue-800/50 rounded-xl p-4">
          <p className="text-sm text-zinc-400">
            💡 <strong className="text-zinc-300">Note:</strong> This terminology database can be expanded
            to include more terms and definitions as needed.
          </p>
        </div>
      </div>
    </div>
  );
}
