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
    
    if (!session || session.user.role !== 'AGENCY') {
      return NextResponse.json(
        { error: 'Unauthorized. Agency access required.' },
        { status: 401 }
      )
    }

    const { id } = params
    const { name, email, twitterHandle } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Verify client belongs to this agency
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        agencyId: session.user.id
      }
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if email is taken by another client
    const emailTaken = await prisma.client.findFirst({
      where: {
        email,
        id: { not: id }
      }
    })

    if (emailTaken) {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 400 }
      )
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name,
        email,
        twitterHandle: twitterHandle || null
      },
      include: {
        _count: {
          select: {
            uploads: true,
            posts: true
          }
        }
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'AGENCY') {
      return NextResponse.json(
        { error: 'Unauthorized. Agency access required.' },
        { status: 401 }
      )
    }

    const { id } = params

    // Verify client belongs to this agency
    const client = await prisma.client.findFirst({
      where: {
        id,
        agencyId: session.user.id
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete client (cascade will handle analytics, posts, uploads)
    await prisma.client.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}