'use client';

import { useState } from 'react';
import { Lock, RefreshCw, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ADMIN_PASSCODE = '5150'; // Same as calendar passcode

interface SyncResult {
  success: boolean;
  shiftsScraped: number;
  shiftsCreated: number;
  shiftsUpdated: number;
  errors: string[];
  timestamp: string;
}

export default function AdminShiftsPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handlePasscodeChange = (value: string) => {
    setPasscode(value);

    if (value === ADMIN_PASSCODE) {
      setIsUnlocked(true);
      setError(false);
    } else if (value.length === 4) {
      setError(true);
      setPasscode('');
      setTimeout(() => setError(false), 500);
    }
  };

  const handleScrape = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const apiKey = prompt('Enter ShiftGen API Key:');
      if (!apiKey) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/shifts/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        shiftsScraped: 0,
        shiftsCreated: 0,
        shiftsUpdated: 0,
        errors: [err instanceof Error ? err.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4">
                <Lock className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Admin Portal
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Shift Management & Scraper Control
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Passcode
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => handlePasscodeChange(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  className={`
                    w-full px-4 py-3 text-center text-xl tracking-widest font-medium
                    bg-zinc-100 dark:bg-zinc-800 border-2 rounded-lg
                    text-zinc-900 dark:text-zinc-100
                    placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all
                    ${error ? 'border-red-500 animate-shake' : 'border-zinc-200 dark:border-zinc-700'}
                  `}
                />
                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">
                    Incorrect passcode
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Shift Admin Portal
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Manage shift data and trigger scraping operations
              </p>
            </div>
          </div>
        </div>

        {/* Scraper Control */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Data Scraper
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                How It Works
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Logs into legacy.shiftgen.com</li>
                <li>• Fetches schedules from 3 sites (Scribe, Physician, MLP)</li>
                <li>• Parses calendar data and extracts shifts</li>
                <li>• Syncs to database with provider matching</li>
              </ul>
            </div>

            <button
              onClick={handleScrape}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400
                       text-white font-medium rounded-lg transition-colors
                       flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Scraping...' : 'Trigger Manual Scrape'}
            </button>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Note: You'll be prompted for the API key. Set <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">SHIFTGEN_API_KEY</code> in Vercel environment variables.
            </p>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Scrape Results
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {result.shiftsScraped}
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">Scraped</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {result.shiftsCreated}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Created</div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {result.shiftsUpdated}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">Updated</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                      Errors ({result.errors.length})
                    </h3>
                    <ul className="text-xs text-red-800 dark:text-red-200 space-y-1">
                      {result.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="text-red-600 dark:text-red-400">
                          ... and {result.errors.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Completed at {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Required Environment Variables
          </h2>

          <div className="space-y-3">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <code className="text-sm text-zinc-900 dark:text-zinc-100">
                SHIFTGEN_USERNAME
              </code>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Your ShiftGen account email
              </p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <code className="text-sm text-zinc-900 dark:text-zinc-100">
                SHIFTGEN_PASSWORD
              </code>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Your ShiftGen account password
              </p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <code className="text-sm text-zinc-900 dark:text-zinc-100">
                SHIFTGEN_API_KEY
              </code>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Secure API key for scraper endpoint (generate with: <code>openssl rand -base64 32</code>)
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> Set these in Vercel Dashboard → Settings → Environment Variables
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
