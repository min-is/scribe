'use client';

import { useState, useMemo } from 'react';
import { FiSearch, FiPackage } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';
import { Medication } from '@prisma/client';

// Fallback medications list with enhanced data
const FALLBACK_MEDICATIONS = [
  { name: 'Acetaminophen', brandNames: ['Tylenol'], class: 'Analgesic', uses: 'Pain relief, fever reduction' },
  { name: 'Ibuprofen', brandNames: ['Advil', 'Motrin'], class: 'NSAID', uses: 'Pain relief, anti-inflammatory' },
  { name: 'Aspirin', brandNames: ['Bayer', 'Bufferin'], class: 'NSAID', uses: 'Pain relief, antiplatelet' },
  { name: 'Amoxicillin', brandNames: ['Amoxil'], class: 'Antibiotic (Penicillin)', uses: 'Bacterial infections' },
  { name: 'Lisinopril', brandNames: ['Prinivil', 'Zestril'], class: 'ACE Inhibitor', uses: 'Hypertension, heart failure' },
  { name: 'Metformin', brandNames: ['Glucophage'], class: 'Antidiabetic (Biguanide)', uses: 'Type 2 diabetes' },
  { name: 'Atorvastatin', brandNames: ['Lipitor'], class: 'Statin', uses: 'Cholesterol management' },
  { name: 'Omeprazole', brandNames: ['Prilosec'], class: 'PPI', uses: 'GERD, acid reflux' },
  { name: 'Levothyroxine', brandNames: ['Synthroid'], class: 'Thyroid hormone', uses: 'Hypothyroidism' },
  { name: 'Amlodipine', brandNames: ['Norvasc'], class: 'Calcium channel blocker', uses: 'Hypertension, angina' },
  { name: 'Metoprolol', brandNames: ['Lopressor', 'Toprol'], class: 'Beta blocker', uses: 'Hypertension, angina' },
  { name: 'Albuterol', brandNames: ['Ventolin', 'ProAir'], class: 'Bronchodilator', uses: 'Asthma, COPD' },
  { name: 'Gabapentin', brandNames: ['Neurontin'], class: 'Anticonvulsant', uses: 'Neuropathic pain, seizures' },
  { name: 'Hydrochlorothiazide', brandNames: ['HCTZ', 'Microzide'], class: 'Diuretic', uses: 'Hypertension, edema' },
  { name: 'Losartan', brandNames: ['Cozaar'], class: 'ARB', uses: 'Hypertension' },
  { name: 'Prednisone', brandNames: ['Deltasone'], class: 'Corticosteroid', uses: 'Inflammation, autoimmune conditions' },
  { name: 'Furosemide', brandNames: ['Lasix'], class: 'Loop diuretic', uses: 'Edema, heart failure' },
  { name: 'Warfarin', brandNames: ['Coumadin'], class: 'Anticoagulant', uses: 'Blood clot prevention' },
  { name: 'Clopidogrel', brandNames: ['Plavix'], class: 'Antiplatelet', uses: 'Prevent blood clots' },
  { name: 'Morphine', brandNames: ['MS Contin'], class: 'Opioid analgesic', uses: 'Severe pain' },
  { name: 'Fentanyl', brandNames: ['Sublimaze', 'Duragesic'], class: 'Opioid analgesic', uses: 'Severe pain' },
  { name: 'Epinephrine', brandNames: ['EpiPen', 'Adrenalin'], class: 'Vasopressor', uses: 'Anaphylaxis, cardiac arrest' },
  { name: 'Nitroglycerin', brandNames: ['Nitrostat'], class: 'Vasodilator', uses: 'Angina, chest pain' },
  { name: 'Insulin', brandNames: ['Humulin', 'Novolin'], class: 'Hormone', uses: 'Diabetes management' },
  { name: 'Diphenhydramine', brandNames: ['Benadryl'], class: 'Antihistamine', uses: 'Allergies, sleep aid' },
  { name: 'Ondansetron', brandNames: ['Zofran'], class: 'Antiemetic', uses: 'Nausea, vomiting' },
  { name: 'Ciprofloxacin', brandNames: ['Cipro'], class: 'Antibiotic (Fluoroquinolone)', uses: 'Bacterial infections' },
  { name: 'Azithromycin', brandNames: ['Zithromax', 'Z-Pak'], class: 'Antibiotic (Macrolide)', uses: 'Bacterial infections' },
  { name: 'Doxycycline', brandNames: ['Vibramycin'], class: 'Antibiotic (Tetracycline)', uses: 'Bacterial infections' },
  { name: 'Vancomycin', brandNames: ['Vancocin'], class: 'Antibiotic (Glycopeptide)', uses: 'MRSA, C. diff' },
];

type MedicationEntry = {
  name: string;
  type: string;
  commonlyUsedFor?: string;
  tags?: string[];
};

interface MedicationsClientProps {
  medications: Medication[];
}

// Enhanced fuzzy matching with Levenshtein-like scoring
function fuzzyMatch(str: string, pattern: string): number {
  const strLower = str.toLowerCase();
  const patternLower = pattern.toLowerCase();

  // Exact match gets highest score
  if (strLower === patternLower) return 100;

  // Starts with pattern gets very high score
  if (strLower.startsWith(patternLower)) return 90;

  // Contains pattern gets high score
  if (strLower.includes(patternLower)) return 80;

  // Fuzzy character-by-character matching
  let score = 0;
  let patternIdx = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
    if (strLower[i] === patternLower[patternIdx]) {
      score += 2;
      consecutiveMatches++;
      // Bonus for consecutive matches
      if (consecutiveMatches > 1) {
        score += consecutiveMatches;
      }
      patternIdx++;
    } else {
      consecutiveMatches = 0;
    }
  }

  // All characters found
  if (patternIdx === patternLower.length) {
    return Math.min((score / strLower.length) * 60, 60);
  }

  return 0;
}

export default function MedicationsClient({ medications }: MedicationsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  // Convert database medications or use fallback
  const medicationsList: MedicationEntry[] = useMemo(() => {
    if (medications && medications.length > 0) {
      return medications.map(med => ({
        name: med.name,
        type: med.type,
        commonlyUsedFor: med.commonlyUsedFor || undefined,
        tags: med.tags,
      }));
    }
    // Use fallback data
    return FALLBACK_MEDICATIONS.map(med => ({
      name: med.name,
      type: med.class,
      commonlyUsedFor: `${med.uses}${med.brandNames.length > 0 ? ` (Brand names: ${med.brandNames.join(', ')})` : ''}`,
    }));
  }, [medications]);

  const filteredMedications = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return medicationsList;
    }

    const query = debouncedQuery.trim();

    // Score each medication
    const scored = medicationsList.map(med => {
      const nameScore = fuzzyMatch(med.name, query);
      const typeScore = fuzzyMatch(med.type, query) * 0.7;
      const tagsScore = med.tags
        ? Math.max(...med.tags.map(tag => fuzzyMatch(tag, query)), 0) * 0.8
        : 0;

      return {
        ...med,
        score: Math.max(nameScore, typeScore, tagsScore),
      };
    });

    // Filter and sort by score
    return scored
      .filter(med => med.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [debouncedQuery, medicationsList]);

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <FiPackage className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Medications
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-light ml-14">
            Quick reference for common medications - fuzzy search enabled for misspellings
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xl pointer-events-none" />
            <input
              type="text"
              placeholder="Search medications (e.g., 'lisnpril', 'beta blocker', 'pain')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl pl-14 pr-6 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-transparent transition-all shadow-sm hover:shadow-md font-light text-base"
            />
          </div>
          {debouncedQuery && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 ml-1 font-light">
              Found <span className="font-medium text-gray-700 dark:text-gray-300">{filteredMedications.length}</span> result{filteredMedications.length !== 1 ? 's' : ''} for &quot;{debouncedQuery}&quot;
            </p>
          )}
        </div>

        {/* Results Count */}
        {!debouncedQuery && (
          <div className="mb-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-light ml-1">
              Showing {medicationsList.length} medication{medicationsList.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Medications List */}
        {filteredMedications.length === 0 ? (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-16 text-center shadow-sm">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch className="text-gray-400 dark:text-gray-500 text-2xl" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-light mb-2">
                No medications found
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Try a different search term or check your spelling
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {filteredMedications.map((med, index) => (
                <div
                  key={index}
                  className="group px-6 py-5 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Medication Name */}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5 tracking-tight">
                        {med.name}
                      </h3>

                      {/* Type Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {med.type}
                        </span>
                      </div>

                      {/* Description */}
                      {med.commonlyUsedFor && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                          {med.commonlyUsedFor}
                        </p>
                      )}

                      {/* Tags */}
                      {med.tags && med.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {med.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-500/10 text-gray-600 dark:text-gray-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="mt-8 bg-blue-50/50 dark:bg-blue-900/10 backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
            <span className="font-medium text-gray-900 dark:text-gray-200">💡 Tip:</span> The search supports fuzzy matching, so you can find medications even with slight misspellings. Try searching for &quot;lisnpril&quot; to find Lisinopril.
          </p>
        </div>
      </div>
    </div>
  );
}
