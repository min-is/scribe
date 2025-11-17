'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createMedication } from '@/medication/actions';

export default function BulkImportClient() {
  const router = useRouter();
  const [csvText, setCsvText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleImport = async () => {
    if (!csvText.trim()) {
      toast.error('Please paste CSV data first');
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    const lines = csvText.trim().split('\n');
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV (simple comma split - for production use a CSV library)
      const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));

      if (parts.length < 2) {
        results.errors.push(`Line ${i + 1}: Invalid format`);
        results.failed++;
        continue;
      }

      const [name, type, commonlyUsedFor] = parts;

      // Generate slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      try {
        const result = await createMedication({
          name,
          slug,
          type: type || 'Unknown',
          commonlyUsedFor: commonlyUsedFor || undefined,
        });

        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`${name}: ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setImportResults(results);
    setIsImporting(false);

    if (results.success > 0) {
      toast.success(`Imported ${results.success} medications`);
      router.refresh();
    }

    if (results.failed > 0) {
      toast.error(`Failed to import ${results.failed} medications`);
    }
  };

  const sampleCsv = `Name,Type,Commonly Used For
Acetaminophen,Analgesic,Pain relief and fever reduction
Ibuprofen,NSAID,Pain and inflammation relief
Amoxicillin,Antibiotic,Bacterial infections
Lisinopril,ACE Inhibitor,High blood pressure and heart failure
Metformin,Antidiabetic,Type 2 diabetes management`;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-main">Bulk Import Medications</h1>
          <p className="text-dim mt-1">
            Import multiple medications at once from CSV data
          </p>
        </div>

        <div className="bg-medium border border-main rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-main mb-2">CSV Format</h2>
            <p className="text-sm text-dim mb-2">
              Your CSV should have three columns: Name, Type, Commonly Used For
            </p>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm font-mono overflow-x-auto">
              <pre>{sampleCsv}</pre>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-main mb-2">
              Paste CSV Data
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder={sampleCsv}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || !csvText.trim()}
              className="font-admin px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : 'Import Medications'}
            </button>
            <button
              type="button"
              onClick={() => setCsvText(sampleCsv)}
              disabled={isImporting}
              className="font-admin px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load Sample Data
            </button>
            <button
              type="button"
              onClick={() => {
                setCsvText('');
                setImportResults(null);
              }}
              disabled={isImporting}
              className="font-admin px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>

          {importResults && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <h3 className="font-semibold text-main mb-2">Import Results</h3>
              <div className="space-y-1 text-sm">
                <p className="text-green-600 dark:text-green-400">
                  ✓ Successfully imported: {importResults.success}
                </p>
                {importResults.failed > 0 && (
                  <>
                    <p className="text-red-600 dark:text-red-400">
                      ✗ Failed: {importResults.failed}
                    </p>
                    {importResults.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-dim">Errors:</p>
                        <ul className="list-disc list-inside text-dim">
                          {importResults.errors.slice(0, 10).map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                          {importResults.errors.length > 10 && (
                            <li>... and {importResults.errors.length - 10} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            📚 Medication Data Sources
          </h3>
          <div className="text-sm text-yellow-800 dark:text-yellow-300 space-y-2">
            <p>You can obtain medication data from these sources:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>FDA Drug Database:</strong> Download from{' '}
                <a
                  href="https://www.fda.gov/drugs/drug-approvals-and-databases/drugsfda-data-files"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-900 dark:hover:text-yellow-100"
                >
                  FDA.gov
                </a>
              </li>
              <li>
                <strong>RxNorm (NIH):</strong> Browse at{' '}
                <a
                  href="https://www.nlm.nih.gov/research/umls/rxnorm/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-900 dark:hover:text-yellow-100"
                >
                  NLM.NIH.gov
                </a>
              </li>
              <li>
                <strong>OpenFDA API:</strong> Access programmatically at{' '}
                <a
                  href="https://open.fda.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-900 dark:hover:text-yellow-100"
                >
                  OpenFDA.gov
                </a>
              </li>
              <li>
                <strong>Hospital Formulary:</strong> Export from your hospital's medication list
              </li>
            </ul>
            <p className="mt-3">
              <strong>Note:</strong> This import tool creates generic entries. For detailed medication information,
              consider integrating with a professional drug database API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
