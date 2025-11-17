import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { auth } from '@/src/auth/server';

const execAsync = promisify(exec);

export async function POST(_request: NextRequest) {
  // Authenticate the request
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Validate environment
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { success: false, error: 'Database URL not configured' },
      { status: 500 }
    );
  }

  try {
    // Run Prisma migrate deploy
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
      env: { ...process.env },
    });

    // Log detailed output server-side
    console.log('Migration output:', stdout);
    if (stderr) {
      console.error('Migration stderr:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Migrations applied successfully',
    });
  } catch (error: any) {
    // Log detailed error server-side
    console.error('Migration error:', error);
    console.error('Error stdout:', error.stdout);
    console.error('Error stderr:', error.stderr);

    // Return sanitized error to client
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed. Check server logs for details.',
      },
      { status: 500 }
    );
  }
}
