import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'AGENCY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalClients, totalPosts, pendingApprovals, totalUploads] = await Promise.all([
      prisma.client.count({
        where: { agencyId: session.user.id }
      }),
      prisma.post.count({
        where: {
          client: {
            agencyId: session.user.id
          }
        }
      }),
      prisma.post.count({
        where: {
          client: {
            agencyId: session.user.id
          },
          status: 'PENDING'
        }
      }),
      prisma.upload.count({
        where: {
          client: {
            agencyId: session.user.id
          }
        }
      })
    ])

    return NextResponse.json({
      totalClients,
      totalPosts,
      pendingApprovals,
      totalUploads
    }, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}