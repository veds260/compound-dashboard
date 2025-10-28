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

    const [totalWriters, totalClients, totalPosts, pendingApprovals, totalUploads] = await Promise.all([
      prisma.user.count({
        where: { role: 'AGENCY' }
      }),
      prisma.client.count(),
      prisma.post.count(),
      prisma.post.count({
        where: { status: 'PENDING' }
      }),
      prisma.upload.count()
    ])

    return NextResponse.json({
      totalWriters,
      totalClients,
      totalPosts,
      pendingApprovals,
      totalUploads
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}