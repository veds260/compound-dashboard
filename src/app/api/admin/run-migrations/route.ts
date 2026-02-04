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

    // Check if mode is specified (push or deploy)
    const body = await request.json().catch(() => ({}))
    const mode = body.mode || 'push' // Default to db push for schema sync

    console.log(`[Migrations] Starting database ${mode}...`)

    let stdout = ''
    let stderr = ''

    if (mode === 'push') {
      // Use prisma db push for schema sync (no migration history)
      const result = await execAsync('npx prisma db push --accept-data-loss --skip-generate')
      stdout = result.stdout
      stderr = result.stderr || ''
    } else {
      // Use prisma migrate deploy for migration-based updates
      const result = await execAsync('npx prisma migrate deploy')
      stdout = result.stdout
      stderr = result.stderr || ''
    }

    console.log('[Migrations] stdout:', stdout)
    if (stderr) {
      console.log('[Migrations] stderr:', stderr)
    }

    // Check if operation was successful
    const successPatterns = [
      'your database is now in sync',
      'database is now in sync',
      'migrations found',
      'migration applied',
      'migrations applied',
      'No pending migrations',
      'already applied',
      'applied successfully'
    ]

    const hasSuccess = successPatterns.some(pattern =>
      stdout.toLowerCase().includes(pattern.toLowerCase()) ||
      stderr.toLowerCase().includes(pattern.toLowerCase())
    )

    if (hasSuccess || stdout.includes('done')) {
      console.log('[Migrations] Database sync completed successfully')
      return NextResponse.json({
        success: true,
        message: mode === 'push'
          ? 'Database schema synced successfully!'
          : 'Database migrations applied successfully!',
        output: stdout
      })
    } else {
      console.error('[Migrations] Operation failed:', { stdout, stderr })
      return NextResponse.json(
        {
          error: 'Database operation completed but result unclear',
          output: stdout,
          details: stderr
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Migrations] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to run database operation',
        details: error.message,
        output: error.stdout,
        stderr: error.stderr
      },
      { status: 500 }
    )
  }
}
