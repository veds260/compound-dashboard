import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'AGENCY') {
      return NextResponse.json(
        { error: 'Unauthorized. Agency access required.' },
        { status: 401 }
      )
    }

    // Find all CLIENT users that don't have a linked client profile
    const clientUsers = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        clientProfile: null
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    // Find all Client records that don't have a linked user
    const clientRecords = await prisma.client.findMany({
      where: {
        userId: null,
        agencyId: session.user.id  // Only for this agency
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    const links: Array<{
      userId: string
      userEmail: string
      clientId: string
      clientEmail: string
    }> = []
    const updates: Array<Promise<any>> = []

    // Try to match by email
    for (const clientUser of clientUsers) {
      const matchingClient = clientRecords.find(c => c.email === clientUser.email)
      if (matchingClient) {
        links.push({
          userId: clientUser.id,
          userEmail: clientUser.email,
          clientId: matchingClient.id,
          clientEmail: matchingClient.email
        })

        // Update the client record to link to the user
        const update = prisma.client.update({
          where: { id: matchingClient.id },
          data: { userId: clientUser.id }
        })
        updates.push(update)
      }
    }

    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates)
    }

    return NextResponse.json({
      message: `Fixed ${links.length} client-user links`,
      links: links,
      unlinkedClientUsers: clientUsers.filter(u => !links.some(l => l.userId === u.id)),
      unlinkedClientRecords: clientRecords.filter(c => !links.some(l => l.clientId === c.id))
    })
  } catch (error) {
    console.error('Error fixing client links:', error)
    return NextResponse.json(
      { error: 'Failed to fix client links' },
      { status: 500 }
    )
  }
}