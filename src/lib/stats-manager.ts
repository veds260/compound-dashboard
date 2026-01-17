import { prisma } from '@/lib/db'
import { startPerf, perfLog } from '@/lib/perf-logger'

/**
 * Updates the pre-computed stats for a client.
 * Call this after any post create/update/delete operation.
 * Silently fails if ClientStats table doesn't exist yet.
 */
export async function updateClientStats(clientId: string): Promise<void> {
  const start = startPerf()

  try {
    // Get all counts in a single query
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
      WHERE "clientId" = ${clientId}
    `

    const stats = result[0]

    // Upsert the stats record
    await prisma.clientStats.upsert({
      where: { clientId },
      create: {
        clientId,
        totalPosts: Number(stats.total),
        pendingCount: Number(stats.pending),
        approvedCount: Number(stats.approved),
        rejectedCount: Number(stats.rejected),
        publishedCount: Number(stats.published),
        scheduledCount: Number(stats.scheduled),
        lastPostAt: stats.last_post
      },
      update: {
        totalPosts: Number(stats.total),
        pendingCount: Number(stats.pending),
        approvedCount: Number(stats.approved),
        rejectedCount: Number(stats.rejected),
        publishedCount: Number(stats.published),
        scheduledCount: Number(stats.scheduled),
        lastPostAt: stats.last_post
      }
    })

    perfLog(`Stats updated for client ${clientId}`, start)
  } catch (err) {
    // Table might not exist yet - silently fail
    // Stats will be computed on-demand via fallback query
    console.log(`📊 [STATS] Could not update stats for ${clientId} - table may not exist yet`)
  }
}

/**
 * Get pre-computed stats for a client (instant, no counting)
 * Falls back to raw query if ClientStats table doesn't exist yet
 */
export async function getClientStatsFromCache(clientId: string) {
  const start = startPerf()

  try {
    // Try to get from ClientStats table first
    const stats = await prisma.clientStats.findUnique({
      where: { clientId }
    })

    if (stats) {
      perfLog('DB - getClientStatsFromCache (cached)', start)
      return {
        scheduledPosts: stats.scheduledCount,
        pendingApprovals: stats.pendingCount,
        analyticsData: stats.approvedCount,
        totalPosts: stats.totalPosts,
        publishedCount: stats.publishedCount
      }
    }
  } catch (err) {
    // Table might not exist yet, fall back to raw query
    console.log('📊 [STATS] ClientStats table not ready, using fallback query')
  }

  // Fallback: compute stats directly (slower but works without setup)
  const result = await prisma.$queryRaw<[{
    scheduled: bigint
    pending: bigint
    approved: bigint
    total: bigint
    published: bigint
  }]>`
    SELECT
      COUNT(*) FILTER (WHERE "scheduledDate" >= NOW()) as scheduled,
      COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
      COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
      COUNT(*) FILTER (WHERE status = 'PUBLISHED') as published,
      COUNT(*) as total
    FROM "Post"
    WHERE "clientId" = ${clientId}
  `

  perfLog('DB - getClientStatsFromCache (fallback query)', start)

  return {
    scheduledPosts: Number(result[0].scheduled),
    pendingApprovals: Number(result[0].pending),
    analyticsData: Number(result[0].approved),
    totalPosts: Number(result[0].total),
    publishedCount: Number(result[0].published)
  }
}

/**
 * Initialize stats for all clients (run once on deployment)
 */
export async function initializeAllClientStats(): Promise<void> {
  console.log('📊 [STATS] Initializing stats for all clients...')
  const start = startPerf()

  const clients = await prisma.client.findMany({
    select: { id: true }
  })

  for (const client of clients) {
    await updateClientStats(client.id)
  }

  perfLog(`Stats initialized for ${clients.length} clients`, start)
}
