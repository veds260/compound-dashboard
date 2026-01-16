import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure for serverless with limited connections
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// Always cache in globalThis to prevent connection exhaustion in serverless environments
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown - release connections when process exits
// Prevents connection leaks on serverless cold starts/shutdowns
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

// Handle unexpected shutdowns
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})