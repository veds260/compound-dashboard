import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/admin/run-migrations - Apply schema changes via raw SQL (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    console.log('[Schema] Starting schema sync...')

    const results: string[] = []

    // Create index on Post(clientId, createdAt DESC) if it doesn't exist
    try {
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS "Post_clientId_createdAt_idx"
        ON "Post" ("clientId", "createdAt" DESC)
      `
      results.push('Created index: Post_clientId_createdAt_idx')
    } catch (e: any) {
      // Index might already exist or CONCURRENTLY not supported in transaction
      if (e.message?.includes('already exists')) {
        results.push('Index Post_clientId_createdAt_idx already exists')
      } else {
        // Try without CONCURRENTLY
        try {
          await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "Post_clientId_createdAt_idx"
            ON "Post" ("clientId", "createdAt" DESC)
          `
          results.push('Created index: Post_clientId_createdAt_idx')
        } catch (e2: any) {
          if (e2.message?.includes('already exists')) {
            results.push('Index Post_clientId_createdAt_idx already exists')
          } else {
            results.push(`Index creation note: ${e2.message}`)
          }
        }
      }
    }

    console.log('[Schema] Results:', results)

    return NextResponse.json({
      success: true,
      message: 'Schema sync completed!',
      results
    })
  } catch (error: any) {
    console.error('[Schema] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync schema',
        details: error.message
      },
      { status: 500 }
    )
  }
}
