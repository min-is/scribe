'use client';

import { Medication } from '@prisma/client';
import { FiAlertCircle } from 'react-icons/fi';

type MedicationsClientProps = {
  medications: Medication[];
};

export default function MedicationsClient({
  medications: initialMedications,
}: MedicationsClientProps) {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-main">Medications</h1>
          <p className="text-dim mt-1">
            View medication entries loaded from the CSV file
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
          <FiAlertCircle className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Medications are managed via CSV file
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              To add, edit, or remove medications, update the <code className="bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded text-xs font-mono">data/medications-comprehensive.csv</code> file in the repository. Changes will be automatically loaded on the next deployment.
            </p>
          </div>
        </div>

        {/* Medications List (Read-only) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {initialMedications.length === 0 ? (
            <div className="px-6 py-12 text-center text-zinc-400">
              <p>No medications found in database.</p>
              <p className="text-sm mt-1">
                Medications will be automatically loaded from the CSV file.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-900/50 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Brand Names
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Commonly Used For
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {initialMedications.slice(0, 50).map((medication) => (
                    <tr
                      key={medication.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-100">
                        {medication.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-400 leading-relaxed">
                        {medication.brandNames || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 leading-relaxed">
                        {medication.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400 leading-relaxed">
                        {medication.commonlyUsedFor || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {initialMedications.length > 50 && (
            <div className="px-6 py-4 bg-zinc-900/50 border-t border-zinc-800 text-center text-sm text-zinc-400">
              Showing first 50 of {initialMedications.length.toLocaleString()} medications. View all on the <a href="/medications" className="text-blue-400 hover:text-blue-300 underline">Medications page</a>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
