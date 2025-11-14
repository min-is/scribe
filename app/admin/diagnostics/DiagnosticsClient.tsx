'use client';

import { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiAlertCircle, FiDatabase, FiSettings } from 'react-icons/fi';

export default function DiagnosticsClient() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/diagnostics');
      const data = await response.json();
      setDiagnostics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const getStatusIcon = (value: string) => {
    if (value.includes('✓')) return <FiCheckCircle className="text-green-400" />;
    if (value.includes('✗')) return <FiXCircle className="text-red-400" />;
    return <FiAlertCircle className="text-yellow-400" />;
  };

  const getStatusColor = (value: string) => {
    if (value.includes('✓')) return 'text-green-400';
    if (value.includes('✗')) return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-main mb-2">System Diagnostics</h1>
            <p className="text-dim text-lg">Database connectivity and table status</p>
          </div>
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && !diagnostics && (
          <div className="bg-medium border border-main rounded-lg p-8 text-center">
            <FiRefreshCw className="animate-spin text-4xl text-blue-400 mx-auto mb-4" />
            <p className="text-dim">Running diagnostics...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <FiXCircle className="text-2xl text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-1">Error</h3>
                <p className="text-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostics Results */}
        {diagnostics && (
          <div className="space-y-6">
            {/* Overall Status */}
            <div
              className={`border rounded-lg p-6 ${
                diagnostics.status === 'OK'
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              <div className="flex items-center gap-3">
                {diagnostics.status === 'OK' ? (
                  <FiCheckCircle className="text-3xl text-green-400" />
                ) : (
                  <FiXCircle className="text-3xl text-red-400" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-main">
                    {diagnostics.status === 'OK' ? 'All Systems Operational' : 'Issues Detected'}
                  </h2>
                  <p className="text-dim text-sm">Last checked: {new Date(diagnostics.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Environment Variables */}
            <div className="bg-medium border border-main rounded-lg overflow-hidden">
              <div className="p-4 border-b border-main bg-dim">
                <div className="flex items-center gap-2">
                  <FiSettings className="text-xl text-blue-400" />
                  <h3 className="text-lg font-semibold text-main">Environment Variables</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-2 font-mono text-sm">
                  {Object.entries(diagnostics.environment).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-dim">{key}:</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(value as string)}
                        <span className={getStatusColor(value as string)}>{value as string}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Database Connection */}
            <div className="bg-medium border border-main rounded-lg overflow-hidden">
              <div className="p-4 border-b border-main bg-dim">
                <div className="flex items-center gap-2">
                  <FiDatabase className="text-xl text-blue-400" />
                  <h3 className="text-lg font-semibold text-main">Database Connection</h3>
                </div>
              </div>
              <div className="p-4">
                {diagnostics.database.connection && (
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-dim">Status:</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(diagnostics.database.connection.status)}
                        <span className={getStatusColor(diagnostics.database.connection.status)}>
                          {diagnostics.database.connection.status}
                        </span>
                      </div>
                    </div>
                    {diagnostics.database.connection.timeMs && (
                      <div className="flex items-center justify-between">
                        <span className="text-dim">Connection Time:</span>
                        <span className="text-main">{diagnostics.database.connection.timeMs}ms</span>
                      </div>
                    )}
                    {diagnostics.database.connection.error && (
                      <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded">
                        <span className="text-red-400">{diagnostics.database.connection.error}</span>
                      </div>
                    )}
                  </div>
                )}
                {diagnostics.database.version && (
                  <div className="mt-3 p-3 bg-content border border-main rounded">
                    <span className="text-dim text-xs">Version: </span>
                    <span className="text-main text-xs">{diagnostics.database.version}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tables Status */}
            <div className="bg-medium border border-main rounded-lg overflow-hidden">
              <div className="p-4 border-b border-main bg-dim">
                <div className="flex items-center gap-2">
                  <FiDatabase className="text-xl text-blue-400" />
                  <h3 className="text-lg font-semibold text-main">Database Tables</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3 font-mono text-sm">
                  {['SmartPhrase', 'Scenario', 'Procedure', 'Provider'].map((tableName) => (
                    <div key={tableName} className="p-3 bg-content border border-main rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-main font-semibold">{tableName}</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(diagnostics.tables[tableName] || '✗ Unknown')}
                          <span className={getStatusColor(diagnostics.tables[tableName] || '✗ Unknown')}>
                            {diagnostics.tables[tableName] || '✗ Unknown'}
                          </span>
                        </div>
                      </div>
                      {diagnostics.tables[`${tableName}_rows`] !== undefined && (
                        <div className="text-xs text-dim">
                          Rows: {diagnostics.tables[`${tableName}_rows`]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {diagnostics.tables.indexes && diagnostics.tables.indexes.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-main mb-2">Indexes ({diagnostics.tables.indexes.length})</h4>
                    <div className="text-xs text-dim space-y-1">
                      {diagnostics.tables.indexes.map((idx: any, i: number) => (
                        <div key={i}>
                          {idx.tablename}.{idx.indexname}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Errors */}
            {diagnostics.errors && diagnostics.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <FiXCircle />
                  Errors ({diagnostics.errors.length})
                </h3>
                <div className="space-y-2">
                  {diagnostics.errors.map((err: string, i: number) => (
                    <div key={i} className="text-sm text-medium font-mono p-2 bg-red-500/5 rounded">
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {diagnostics.status !== 'OK' && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <FiAlertCircle />
                  Recommendations
                </h3>
                <ul className="list-disc list-inside text-medium text-sm space-y-1">
                  {!diagnostics.environment.DATABASE_URL.includes('✓') && (
                    <li>Set the DATABASE_URL environment variable</li>
                  )}
                  {diagnostics.tables.SmartPhrase === '✗ Missing' && (
                    <li>Run migrations to create SmartPhrase table</li>
                  )}
                  {diagnostics.tables.Scenario === '✗ Missing' && (
                    <li>Run migrations to create Scenario table</li>
                  )}
                  {diagnostics.tables.Procedure === '✗ Missing' && (
                    <li>Run migrations to create Procedure table</li>
                  )}
                  {diagnostics.database.connection?.status?.includes('✗') && (
                    <li>Check database connection settings and network access</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
