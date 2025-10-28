import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalImpressions,
      totalEngagements,
      totalPosts,
      totalClients,
      topPerformingClients
    ] = await Promise.all([
      prisma.analytics.aggregate({
        _sum: { impressions: true }
      }),
      prisma.analytics.aggregate({
        _sum: { engagements: true }
      }),
      prisma.post.count(),
      prisma.client.count(),
      prisma.client.findMany({
        select: {
          id: true,
          name: true,
          posts: {
            select: { id: true }
          },
          analytics: {
            select: {
              engagements: true
            }
          }
        }
      })
    ])

    const processedTopClients = topPerformingClients
      .map(client => ({
        id: client.id,
        name: client.name,
        totalPosts: client.posts.length,
        totalEngagements: client.analytics.reduce((sum, a) => sum + a.engagements, 0)
      }))
      .sort((a, b) => b.totalEngagements - a.totalEngagements)
      .slice(0, 10)

    const engagementRate = totalImpressions._sum.impressions 
      ? (totalEngagements._sum.engagements || 0) / totalImpressions._sum.impressions * 100 
      : 0

    return NextResponse.json({
      totalImpressions: totalImpressions._sum.impressions || 0,
      totalEngagements: totalEngagements._sum.engagements || 0,
      totalPosts,
      totalClients,
      engagementRate,
      topPerformingClients: processedTopClients
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}