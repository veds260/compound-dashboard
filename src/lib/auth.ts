import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

console.log('[Auth Config] Loading auth configuration')

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
            console.log('[Auth] Missing email or password')
            return null
          }

          console.log('[Auth] Attempting login for:', credentials.email)

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              clientProfile: true
            }
          })

          if (!user) {
            console.log('[Auth] User not found:', credentials.email)
            return null
          }

          console.log('[Auth] User found:', { email: user.email, role: user.role })

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('[Auth] Invalid password for:', credentials.email)
            return null
          }

          console.log('[Auth] Login successful for:', credentials.email)

          // For CLIENT role users, we need to find the client record that links to this user
          let clientId = undefined
          if (user.role === 'CLIENT') {
            let clientProfile = await prisma.client.findFirst({
              where: { userId: user.id }
            })

            // If no client profile found, create one automatically
            if (!clientProfile) {
              console.log(`[Auth] Creating Client profile for orphaned CLIENT user ${user.id} (${user.email})`)
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
                console.log(`[Auth] Created Client profile ${clientProfile.id} for user ${user.email}`)
              } catch (createError) {
                console.error(`[Auth] Failed to create Client profile for ${user.email}:`, createError)
              }
            }

            // Check if client is active
            if (clientProfile && !clientProfile.active) {
              console.log(`[Auth] Client account ${clientProfile.id} (${user.email}) is deactivated`)
              return null
            }

            clientId = clientProfile?.id
          }

          console.log('[Auth] Returning user object:', { id: user.id, email: user.email, role: user.role, clientId })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            clientId: clientId
            // NOTE: profilePicture removed - fetched separately to avoid JWT size issues
          }
        } catch (error) {
          console.error('[Auth] Error during authorization:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        console.log('[Auth Callback - JWT] Token:', { sub: token.sub, role: token.role })

        // On initial sign in
        if (user) {
          console.log('[Auth Callback - JWT] User logged in:', { id: user.id, role: user.role })
          token.role = user.role
          token.clientId = user.clientId
          // NOTE: We DO NOT store profilePicture in JWT to avoid token size issues
          // Profile pictures are fetched separately via API
        }

        console.log('[Auth Callback - JWT] Returning token with role:', token.role)
        return token
      } catch (error) {
        console.error('[Auth Callback - JWT] Error:', error)
        throw error
      }
    },
    async session({ session, token }) {
      try {
        console.log('[Auth Callback - Session] Creating session for token:', { sub: token.sub, role: token.role })
        if (session?.user) {
          session.user.id = token.sub!
          session.user.role = token.role as string
          session.user.clientId = token.clientId as string
          // NOTE: profilePicture removed - fetched separately via API to avoid JWT size issues
        }
        console.log('[Auth Callback - Session] Session created:', { userId: session.user.id, role: session.user.role })
        return session
      } catch (error) {
        console.error('[Auth Callback - Session] Error:', error)
        throw error
      }
    }
  },
  pages: {
    signIn: '/login'
  }
}