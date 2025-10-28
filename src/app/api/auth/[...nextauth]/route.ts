import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

console.log('[Auth Route] Initializing NextAuth handler')

const handler = NextAuth(authOptions)

console.log('[Auth Route] Handler initialized successfully')

export { handler as GET, handler as POST }