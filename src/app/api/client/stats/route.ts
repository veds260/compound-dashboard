import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'CLIENT' || !session.user.clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    const [scheduledPosts, pendingApprovals, approvedPosts] = await Promise.all([
      prisma.post.count({
        where: {
          clientId: session.user.clientId,
          scheduledDate: { gte: now }
        }
      }),
      prisma.post.count({
        where: {
          clientId: session.user.clientId,
          status: 'PENDING'
        }
      }),
      prisma.post.count({
        where: {
          clientId: session.user.clientId,
          status: 'APPROVED'
        }
      })
    ])

    return NextResponse.json({
      scheduledPosts,
      pendingApprovals,
      analyticsData: approvedPosts
    })
  } catch (error) {
    console.error('Error fetching client stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client stats' },
      { status: 500 }
    )
  }
}