'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createTerminology } from '@/terminology/actions';

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

      if (parts.length < 3) {
        results.errors.push(`Line ${i + 1}: Invalid format (need at least term, definition, category)`);
        results.failed++;
        continue;
      }

      const [term, definition, category, ...examplesParts] = parts;

      // Generate slug from term
      const slug = term
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      try {
        const result = await createTerminology({
          term,
          slug,
          definition,
          category,
          examples: examplesParts.length > 0 ? examplesParts : undefined,
        });

        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`${term}: ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${term}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setImportResults(results);
    setIsImporting(false);

    if (results.success > 0) {
      toast.success(`Imported ${results.success} terminology entries`);
      router.refresh();
    }

    if (results.failed > 0) {
      toast.error(`Failed to import ${results.failed} entries`);
    }
  };

  const sampleCsv = `Term,Definition,Category,Examples
BP,Blood Pressure,Vital Signs,BP 120/80 mmHg
HR,Heart Rate,Vital Signs,HR 72 bpm
CC,Chief Complaint,Documentation,
HPI,History of Present Illness,Documentation,
HEENT,"Head, Eyes, Ears, Nose, Throat",Physical Exam,`;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-main">Bulk Import Terminology</h1>
          <p className="text-dim mt-1">
            Import multiple medical terminology entries at once from CSV data
          </p>
        </div>

        <div className="bg-medium border border-main rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-main mb-2">CSV Format</h2>
            <p className="text-sm text-dim mb-2">
              Your CSV should have columns: Term, Definition, Category, Examples (optional)
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
              {isImporting ? 'Importing...' : 'Import Terminology'}
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
      </div>
    </div>
  );
}
