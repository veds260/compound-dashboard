import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// POST /api/admin/run-migrations - Run database migrations (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    console.log('[Migrations] Starting database migration...')

    // Run prisma migrate deploy
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy')

    console.log('[Migrations] stdout:', stdout)
    if (stderr) {
      console.log('[Migrations] stderr:', stderr)
    }

    // Check if migrations were applied
    const successPatterns = [
      'migrations found',
      'migration applied',
      'migrations applied',
      'No pending migrations',
      'already applied'
    ]

    const hasSuccess = successPatterns.some(pattern =>
      stdout.toLowerCase().includes(pattern.toLowerCase()) ||
      stderr.toLowerCase().includes(pattern.toLowerCase())
    )

    if (hasSuccess) {
      console.log('[Migrations] Migrations completed successfully')
      return NextResponse.json({
        success: true,
        message: 'Database migrations applied successfully!',
        output: stdout
      })
    } else {
      console.error('[Migrations] Migration failed:', { stdout, stderr })
      return NextResponse.json(
        {
          error: 'Migration process completed but no migrations were applied',
          output: stdout,
          details: stderr
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Migrations] Error running migrations:', error)
    return NextResponse.json(
      {
        error: 'Failed to run migrations',
        details: error.message,
        output: error.stdout,
        stderr: error.stderr
      },
      { status: 500 }
    )
  }
}
