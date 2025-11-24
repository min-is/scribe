'use client';

import { useState, useMemo } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';

// Common medications list - can be expanded
const MEDICATIONS = [
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

// Simple fuzzy matching function
function fuzzyMatch(str: string, pattern: string): number {
  const strLower = str.toLowerCase();
  const patternLower = pattern.toLowerCase();

  // Exact match gets highest score
  if (strLower === patternLower) return 100;
  if (strLower.includes(patternLower)) return 80;

  // Fuzzy matching
  let score = 0;
  let patternIdx = 0;

  for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
    if (strLower[i] === patternLower[patternIdx]) {
      score += 1;
      patternIdx++;
    }
  }

  if (patternIdx === patternLower.length) {
    return (score / strLower.length) * 50;
  }

  return 0;
}

export default function MedicationsClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  const filteredMedications = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return MEDICATIONS;
    }

    const query = debouncedQuery.trim();

    // Score each medication
    const scored = MEDICATIONS.map(med => {
      const nameScore = fuzzyMatch(med.name, query);
      const brandScore = Math.max(...med.brandNames.map(brand => fuzzyMatch(brand, query)), 0);
      const classScore = fuzzyMatch(med.class, query) * 0.5;

      return {
        ...med,
        score: Math.max(nameScore, brandScore, classScore),
      };
    });

    // Filter and sort by score
    return scored
      .filter(med => med.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [debouncedQuery]);

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-main mb-2">
            Medication Reference
          </h1>
          <p className="text-zinc-400 text-base">
            Search for medications by name, brand, or class - fuzzy matching enabled
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xl" />
            <input
              type="text"
              placeholder="Search medications (e.g., 'lisnpril', 'advil', 'beta blocker')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          {debouncedQuery && (
            <p className="text-zinc-400 text-sm mt-2">
              Found {filteredMedications.length} result{filteredMedications.length !== 1 ? 's' : ''} for &quot;{debouncedQuery}&quot;
            </p>
          )}
        </div>

        {/* Results */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-zinc-800">
            {filteredMedications.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-400">
                No medications found. Try a different search term.
              </div>
            ) : (
              filteredMedications.map((med, index) => (
                <div
                  key={index}
                  className="px-6 py-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {med.name}
                      </h3>
                      {med.brandNames.length > 0 && (
                        <p className="text-sm text-zinc-400 mb-2">
                          Brand names: {med.brandNames.join(', ')}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/10 text-blue-400 border border-blue-600/20">
                          {med.class}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300">
                        {med.uses}
                      </p>
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
            💡 <strong className="text-zinc-300">Note:</strong> This is a reference tool with common medications.
            The medication database can be expanded as needed by editors.
          </p>
        </div>
      </div>
    </div>
  );
}
