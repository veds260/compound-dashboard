import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only ADMIN role can reassign clients
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { clientId, newAgencyId } = await request.json()

    if (!clientId || !newAgencyId) {
      return NextResponse.json(
        { error: 'Client ID and new agency ID are required' },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Verify new agency exists and has AGENCY role
    const newAgency = await prisma.user.findUnique({
      where: { id: newAgencyId }
    })

    if (!newAgency || newAgency.role !== 'AGENCY') {
      return NextResponse.json(
        { error: 'Invalid agency. User must have AGENCY role.' },
        { status: 400 }
      )
    }

    // Store old agency info for logging
    const oldAgencyId = client.agencyId
    const oldAgencyName = client.agency?.name || 'Unassigned'

    // Reassign client to new agency
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        agencyId: newAgencyId
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            posts: true,
            uploads: true,
            analytics: true
          }
        }
      }
    })

    console.log(`[ADMIN] Client "${client.name}" (${clientId}) reassigned from agency "${oldAgencyName}" (${oldAgencyId}) to "${newAgency.name}" (${newAgencyId}) by admin ${session.user.email}`)

    return NextResponse.json({
      success: true,
      message: `Client successfully reassigned from ${oldAgencyName} to ${newAgency.name}`,
      client: updatedClient
    })
  } catch (error) {
    console.error('Error reassigning client:', error)
    return NextResponse.json(
      {
        error: 'Failed to reassign client',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
