import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'AGENCY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized. Agency or Admin access required.' },
        { status: 401 }
      )
    }

    let whereClause: any = {}

    // Admins can see all clients, agencies only their own
    if (session.user.role === 'AGENCY') {
      whereClause.agencyId = session.user.id
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        twitterHandle: true,
        timezone: true,
        agencyId: true,
        createdAt: true,
        _count: {
          select: {
            uploads: true,
            posts: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'AGENCY') {
      return NextResponse.json(
        { error: 'Unauthorized. Agency access required.' },
        { status: 401 }
      )
    }

    const { name, email, twitterHandle, createUserAccount, password } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    if (createUserAccount && !password) {
      return NextResponse.json(
        { error: 'Password is required when creating user account' },
        { status: 400 }
      )
    }

    // Check if client email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email }
    })

    if (existingClient) {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 400 }
      )
    }

    let userId = null

    // Optionally create a CLIENT user account
    if (createUserAccount) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        if (existingUser.role === 'CLIENT') {
          userId = existingUser.id
        } else {
          return NextResponse.json(
            { error: 'A user with this email already exists with a different role' },
            { status: 400 }
          )
        }
      } else {
        // Create new CLIENT user
        const hashedPassword = await bcrypt.hash(password, 12)
        const user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: 'CLIENT'
          }
        })
        userId = user.id
      }
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        twitterHandle: twitterHandle || null,
        agencyId: session.user.id,
        userId: userId
      },
      include: {
        _count: {
          select: {
            uploads: true,
            posts: true
          }
        },
        user: userId ? {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        } : false
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}