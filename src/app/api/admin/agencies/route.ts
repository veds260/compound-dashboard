import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Only ADMIN role can access this endpoint
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    // Get all users with AGENCY role
    const agencies = await prisma.user.findMany({
      where: {
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
            createdAt: true,
            _count: {
              select: {
                posts: true,
                uploads: true,
                analytics: true
              }
            }
          },
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(agencies)
  } catch (error) {
    console.error('Error fetching agencies:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch agencies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
