import { prisma } from '@/lib/db'
import { startPerf, perfLog } from '@/lib/perf-logger'

/**
 * Updates the pre-computed stats for a client.
 * Call this after any post create/update/delete operation.
 */
export async function updateClientStats(clientId: string): Promise<void> {
  const start = startPerf()

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
}

/**
 * Get pre-computed stats for a client (instant, no counting)
 */
export async function getClientStatsFromCache(clientId: string) {
  const start = startPerf()

  let stats = await prisma.clientStats.findUnique({
    where: { clientId }
  })

  // If no stats exist, compute and cache them
  if (!stats) {
    console.log(`📊 [STATS] No cached stats for ${clientId}, computing...`)
    await updateClientStats(clientId)
    stats = await prisma.clientStats.findUnique({
      where: { clientId }
    })
  }

  perfLog('DB - getClientStatsFromCache', start)

  return stats ? {
    scheduledPosts: stats.scheduledCount,
    pendingApprovals: stats.pendingCount,
    analyticsData: stats.approvedCount,
    totalPosts: stats.totalPosts,
    publishedCount: stats.publishedCount
  } : {
    scheduledPosts: 0,
    pendingApprovals: 0,
    analyticsData: 0,
    totalPosts: 0,
    publishedCount: 0
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
