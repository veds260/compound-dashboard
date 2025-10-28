import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/uploads - List all uploads (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    // Build where clause
    const whereClause: any = {}
    if (clientId) {
      whereClause.clientId = clientId
    }

    // Get uploads ordered by most recent first
    // Note: Try to include posts count, but fallback if schema not migrated yet
    let uploads
    try {
      uploads = await prisma.upload.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          },
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              posts: true
            }
          }
        },
        orderBy: {
          uploadDate: 'desc'
        },
        take: 50 // Limit to last 50 uploads
      })
    } catch (error: any) {
      // Fallback if posts relation doesn't exist yet (migration not applied)
      console.log('Posts relation not available, using fallback query')
      uploads = await prisma.upload.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          },
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          uploadDate: 'desc'
        },
        take: 50
      })

      // Add empty count for UI compatibility
      uploads = uploads.map(upload => ({
        ...upload,
        _count: { posts: 0 }
      }))
    }

    return NextResponse.json(uploads)
  } catch (error: any) {
    console.error('Error fetching uploads:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json(
      {
        error: 'Failed to fetch uploads',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}
