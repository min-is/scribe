import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { auth } from '@/auth/server';

const execAsync = promisify(exec);

export async function POST(_request: NextRequest) {
  // Check authentication
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

    console.log('Migration output:', stdout);
    if (stderr) {
      console.error('Migration stderr:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Migrations applied successfully',
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed. Check server logs for details.',
      },
      { status: 500 }
    );
  }
}
