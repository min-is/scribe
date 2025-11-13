import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
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
      output: stdout,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        output: error.stdout || error.stderr,
      },
      { status: 500 }
    );
  }
}
