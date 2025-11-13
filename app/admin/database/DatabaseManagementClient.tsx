'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FiDatabase, FiRefreshCw, FiCheck, FiAlertCircle } from 'react-icons/fi';

export default function DatabaseManagementClient() {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runMigrations = async () => {
    setIsRunning(true);
    setOutput('Running migrations...\n');

    try {
      const response = await fetch('/api/admin/migrate', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setOutput(data.output || 'Migrations completed successfully!');
        setLastRun(new Date());
        toast.success('Migrations applied successfully!', {
          description: 'Database tables have been created/updated',
        });
      } else {
        setOutput(data.output || data.error || 'Migration failed');
        toast.error('Migration failed', {
          description: data.error || 'Check the output below for details',
        });
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      setOutput(`Error: ${error.message}`);
      toast.error('Failed to run migrations', {
        description: error.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen p-8 font-mono">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-main mb-2">
            Database Management
          </h1>
          <p className="text-dim text-lg">
            Manage database migrations and setup
          </p>
        </div>

        {/* Migration Card */}
        <div className="bg-medium border border-main rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FiDatabase className="text-2xl text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-main">
                Run Database Migrations
              </h2>
              <p className="text-dim text-sm">
                Create SmartPhrase, Scenario, and Procedure tables
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-medium text-sm mb-2">
              This will apply all pending migrations to create the required database tables:
            </p>
            <ul className="list-disc list-inside text-medium text-sm space-y-1 ml-4">
              <li>SmartPhrase table (EPIC dot phrases)</li>
              <li>Scenario table (clinical scenarios)</li>
              <li>Procedure table (medical procedures)</li>
            </ul>
          </div>

          {lastRun && (
            <div className="mb-4 flex items-center gap-2 text-sm text-medium">
              <FiCheck className="text-green-400" />
              <span>Last run: {lastRun.toLocaleString()}</span>
            </div>
          )}

          <button
            onClick={runMigrations}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <FiRefreshCw className="animate-spin" />
                Running Migrations...
              </>
            ) : (
              <>
                <FiDatabase />
                Run Migrations
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        {output && (
          <div className="bg-medium border border-main rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <FiAlertCircle className="text-lg text-blue-400" />
              <h3 className="text-lg font-semibold text-main">
                Migration Output
              </h3>
            </div>
            <pre className="bg-content border border-main rounded-lg p-4 text-sm text-medium overflow-x-auto whitespace-pre-wrap font-mono">
              {output}
            </pre>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-dim border border-main rounded-lg p-6">
          <h3 className="text-lg font-semibold text-main mb-3">
            ℹ️ When to Run Migrations
          </h3>
          <ul className="text-medium text-sm space-y-2">
            <li>
              <strong className="text-main">First Setup:</strong> Run once after initial deployment
            </li>
            <li>
              <strong className="text-main">After Code Updates:</strong> If you see "table does not exist" errors
            </li>
            <li>
              <strong className="text-main">Schema Changes:</strong> When database structure is updated
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-main">
            <p className="text-dim text-sm">
              <strong>Note:</strong> Migrations are also run automatically when you start the server
              with <code className="bg-content px-2 py-1 rounded">npm run dev</code> or{' '}
              <code className="bg-content px-2 py-1 rounded">npm start</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
