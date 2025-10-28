import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET client's own profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized. Client access required.' },
        { status: 401 }
      )
    }

    if (!session.user.clientId) {
      return NextResponse.json(
        { error: 'Client ID not found in session' },
        { status: 400 }
      )
    }

    const client = await prisma.client.findUnique({
      where: { id: session.user.clientId },
      select: {
        id: true,
        name: true,
        email: true,
        twitterHandle: true,
        profilePicture: true,
        timezone: true
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT update client's own profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized. Client access required.' },
        { status: 401 }
      )
    }

    if (!session.user.clientId) {
      return NextResponse.json(
        { error: 'Client ID not found in session' },
        { status: 400 }
      )
    }

    const { twitterHandle, profilePicture } = await request.json()

    const updateData: any = {}

    if (twitterHandle !== undefined) {
      // Remove @ if user includes it
      const cleanHandle = twitterHandle?.trim().replace(/^@/, '') || null
      updateData.twitterHandle = cleanHandle
    }

    if (profilePicture !== undefined) {
      updateData.profilePicture = profilePicture
    }

    const updatedClient = await prisma.client.update({
      where: { id: session.user.clientId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        twitterHandle: true,
        profilePicture: true,
        timezone: true
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error updating client profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
