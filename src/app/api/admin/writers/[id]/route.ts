import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const writer = await prisma.user.findUnique({
      where: { 
        id: params.id,
        role: 'AGENCY'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        clients: {
          select: {
            id: true,
            name: true,
            email: true,
            twitterHandle: true,
            posts: {
              select: {
                id: true,
                content: true,
                status: true,
                createdAt: true,
                scheduledDate: true
              },
              orderBy: {
                createdAt: 'desc'
              }
            },
            analytics: {
              select: {
                id: true,
                date: true,
                impressions: true,
                engagements: true
              },
              orderBy: {
                date: 'desc'
              }
            }
          }
        }
      }
    })

    if (!writer) {
      return NextResponse.json({ error: 'Writer not found' }, { status: 404 })
    }

    return NextResponse.json(writer)
  } catch (error) {
    console.error('Admin writer details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}