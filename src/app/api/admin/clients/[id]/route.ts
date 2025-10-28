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

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        twitterHandle: true,
        createdAt: true,
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
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Admin client details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { active } = await request.json()

    if (typeof active !== 'boolean') {
      return NextResponse.json({ error: 'Invalid active status' }, { status: 400 })
    }

    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: { active },
      select: {
        id: true,
        name: true,
        active: true
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Update client active status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}