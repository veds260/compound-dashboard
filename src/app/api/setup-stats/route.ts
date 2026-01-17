import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Self-contained setup endpoint - creates table and initializes stats
// No manual migration needed - just call this endpoint once after deployment
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    // Only admins can run setup
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    console.log('🔧 [SETUP] Starting ClientStats setup...')

    // Step 1: Create the table if it doesn't exist using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ClientStats" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "clientId" TEXT NOT NULL UNIQUE,
        "totalPosts" INTEGER NOT NULL DEFAULT 0,
        "pendingCount" INTEGER NOT NULL DEFAULT 0,
        "approvedCount" INTEGER NOT NULL DEFAULT 0,
        "rejectedCount" INTEGER NOT NULL DEFAULT 0,
        "publishedCount" INTEGER NOT NULL DEFAULT 0,
        "scheduledCount" INTEGER NOT NULL DEFAULT 0,
        "lastPostAt" TIMESTAMP(3),
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ClientStats_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `
    console.log('🔧 [SETUP] ClientStats table created/verified')

    // Step 2: Get all clients
    const clients = await prisma.client.findMany({
      select: { id: true, name: true }
    })
    console.log(`🔧 [SETUP] Found ${clients.length} clients to initialize`)

    // Step 3: Initialize stats for each client
    let initialized = 0
    for (const client of clients) {
      try {
        // Get counts in a single query
        const result = await prisma.$queryRaw<[{
          total: bigint
          pending: bigint
          approved: bigint
          rejected: bigint
          published: bigint
          scheduled: bigint
          last_post: Date | null
        }]>`
          SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
            COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
            COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected,
            COUNT(*) FILTER (WHERE status = 'PUBLISHED') as published,
            COUNT(*) FILTER (WHERE "scheduledDate" >= NOW()) as scheduled,
            MAX("createdAt") as last_post
          FROM "Post"
          WHERE "clientId" = ${client.id}
        `

        const stats = result[0]
        const id = `stats_${client.id}`

        // Upsert using raw SQL to avoid Prisma client issues with new table
        await prisma.$executeRaw`
          INSERT INTO "ClientStats" ("id", "clientId", "totalPosts", "pendingCount", "approvedCount", "rejectedCount", "publishedCount", "scheduledCount", "lastPostAt", "updatedAt")
          VALUES (${id}, ${client.id}, ${Number(stats.total)}, ${Number(stats.pending)}, ${Number(stats.approved)}, ${Number(stats.rejected)}, ${Number(stats.published)}, ${Number(stats.scheduled)}, ${stats.last_post}, NOW())
          ON CONFLICT ("clientId") DO UPDATE SET
            "totalPosts" = ${Number(stats.total)},
            "pendingCount" = ${Number(stats.pending)},
            "approvedCount" = ${Number(stats.approved)},
            "rejectedCount" = ${Number(stats.rejected)},
            "publishedCount" = ${Number(stats.published)},
            "scheduledCount" = ${Number(stats.scheduled)},
            "lastPostAt" = ${stats.last_post},
            "updatedAt" = NOW()
        `

        initialized++
        console.log(`🔧 [SETUP] Initialized stats for ${client.name}`)
      } catch (err) {
        console.error(`🔧 [SETUP] Failed to initialize stats for ${client.name}:`, err)
      }
    }

    console.log(`🔧 [SETUP] Complete! Initialized ${initialized}/${clients.length} clients`)

    return NextResponse.json({
      success: true,
      message: `Stats initialized for ${initialized}/${clients.length} clients`
    })
  } catch (error) {
    console.error('🔧 [SETUP] Error:', error)
    return NextResponse.json({ error: 'Setup failed', details: String(error) }, { status: 500 })
  }
}

// GET endpoint to check status
export async function GET() {
  try {
    // Check if table exists
    const tableExists = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'ClientStats'
      )
    `

    if (!tableExists[0].exists) {
      return NextResponse.json({
        status: 'not_setup',
        message: 'ClientStats table does not exist. POST to this endpoint to set up.'
      })
    }

    // Count stats records
    const count = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "ClientStats"
    `

    return NextResponse.json({
      status: 'ready',
      statsRecords: Number(count[0].count)
    })
  } catch (error) {
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 })
  }
}
