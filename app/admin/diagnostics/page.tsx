import DiagnosticsClient from './DiagnosticsClient';

export const metadata = {
  title: 'System Diagnostics - Admin',
  description: 'Database and system diagnostics',
};

export default async function DiagnosticsPage() {
  return <DiagnosticsClient />;
}
