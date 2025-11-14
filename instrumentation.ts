// This file runs when the Next.js server starts up
// It's the proper place to run database migrations in Next.js 15+
// Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  // Only run on the server, not in the browser or during build
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('\n🚀 Next.js Instrumentation: Server starting...');

    // Import the migration function dynamically to avoid build-time execution
    const { runMigrations } = await import('./scripts/run-migrations.js');

    try {
      await runMigrations();
    } catch (error) {
      console.error('⚠️  Failed to run migrations during server startup:', error);
      // Don't throw - allow the server to start even if migrations fail
      // This prevents the app from crashing if there's a temporary DB issue
    }

    console.log('✅ Server initialization complete\n');
  }
}
