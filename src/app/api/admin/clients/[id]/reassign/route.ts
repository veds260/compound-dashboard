import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { newWriterId } = await request.json()

    if (!newWriterId) {
      return NextResponse.json(
        { error: 'New writer ID is required' },
        { status: 400 }
      )
    }

    // Verify the new writer exists and has AGENCY role
    const newWriter = await prisma.user.findUnique({
      where: { id: newWriterId }
    })

    if (!newWriter || newWriter.role !== 'AGENCY') {
      return NextResponse.json(
        { error: 'Invalid writer. Must be an agency user.' },
        { status: 400 }
      )
    }

    // Verify the client exists
    const client = await prisma.client.findUnique({
      where: { id }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Update the client's agency
    const updatedClient = await prisma.client.update({
      where: { id },
      data: { agencyId: newWriterId },
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
    console.error('Error reassigning client:', error)
    return NextResponse.json(
      { error: 'Failed to reassign client' },
      { status: 500 }
    )
  }
}
