import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              clientProfile: true
            }
          })

          if (!user) {
            console.log('[Auth] Login failed - user not found:', credentials.email)
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('[Auth] Login failed - invalid password:', credentials.email)
            return null
          }

          console.log('[Auth] Login successful:', credentials.email)

          // For CLIENT role users, we need to find the client record that links to this user
          let clientId = undefined
          if (user.role === 'CLIENT') {
            let clientProfile = await prisma.client.findFirst({
              where: { userId: user.id }
            })

            // If no client profile found, create one automatically
            if (!clientProfile) {
              console.log(`[Auth] Creating Client profile for user ${user.email}`)
              try {
                clientProfile = await prisma.client.create({
                  data: {
                    name: user.name || user.email.split('@')[0],
                    email: user.email,
                    userId: user.id,
                    agencyId: null,
                    active: true
                  }
                })
              } catch (createError) {
                console.error(`[Auth] Failed to create Client profile:`, createError)
              }
            }

            // Check if client is active
            if (clientProfile && !clientProfile.active) {
              console.log(`[Auth] Client account deactivated:`, user.email)
              return null
            }

            clientId = clientProfile?.id
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            clientId: clientId
          }
        } catch (error) {
          console.error('[Auth] Authorization error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, add user data to token
      if (user) {
        token.role = user.role
        token.clientId = user.clientId
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.clientId = token.clientId as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}