import { PrismaClient } from '@prisma/client'

console.log('[DB] Initializing Prisma client')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  console.log('[DB] Prisma client initialized (development mode)')
} else {
  console.log('[DB] Prisma client initialized (production mode)')
}