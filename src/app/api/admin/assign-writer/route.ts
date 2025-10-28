import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId, writerId } = await request.json()

    if (!clientId || !writerId) {
      return NextResponse.json(
        { error: 'Client ID and Writer ID are required' },
        { status: 400 }
      )
    }

    // Verify writer exists and has AGENCY role
    const writer = await prisma.user.findUnique({
      where: { id: writerId }
    })

    if (!writer || writer.role !== 'AGENCY') {
      return NextResponse.json(
        { error: 'Invalid writer ID' },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Update client's agency assignment
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: { agencyId: writerId },
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

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Assign writer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
