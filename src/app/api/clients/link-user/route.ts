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

    const { clientId, userEmail } = await request.json()

    if (!clientId || !userEmail) {
      return NextResponse.json(
        { error: 'Client ID and user email are required' },
        { status: 400 }
      )
    }

    // Check if client exists and belongs to this agency
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        agencyId: session.user.id
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    // Find the CLIENT role user
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'User must have CLIENT role' },
        { status: 400 }
      )
    }

    // Check if client is already linked to another user
    if (client.userId) {
      return NextResponse.json(
        { error: 'Client is already linked to another user' },
        { status: 400 }
      )
    }

    // Link the user to the client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error linking user to client:', error)
    return NextResponse.json(
      { error: 'Failed to link user to client' },
      { status: 500 }
    )
  }
}