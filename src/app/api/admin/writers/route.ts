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

    const writers = await prisma.user.findMany({
      where: { role: 'AGENCY' },
      select: {
        id: true,
        name: true,
        email: true,
        clients: {
          select: {
            id: true,
            posts: {
              select: {
                id: true,
                status: true
              }
            }
          }
        }
      }
    })

    const writersOverview = writers.map(writer => {
      const clientCount = writer.clients.length
      const allPosts = writer.clients.flatMap(client => client.posts)
      const totalPosts = allPosts.length
      const pendingApprovals = allPosts.filter(post => post.status === 'PENDING').length

      return {
        id: writer.id,
        name: writer.name || 'Unknown',
        email: writer.email,
        clientCount,
        totalPosts,
        pendingApprovals
      }
    })

    return NextResponse.json(writersOverview)
  } catch (error) {
    console.error('Admin writers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}