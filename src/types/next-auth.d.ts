import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      clientId?: string
      // NOTE: profilePicture removed from session to avoid JWT size issues
      // Profile pictures are fetched separately via API
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    clientId?: string
    // NOTE: profilePicture removed from user object
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    clientId?: string
    // NOTE: profilePicture removed from JWT token
  }
}