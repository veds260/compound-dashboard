const { PrismaClient } = require('@prisma/client')

async function runMigrations() {
  const prisma = new PrismaClient()

  try {
    console.log('🔄 Running Prisma migrations...')

    // Test connection first
    await prisma.$connect()
    console.log('✅ Connected to database')

    // Apply migrations
    const { execSync } = require('child_process')

    console.log('📦 Deploying migrations...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })

    console.log('🔄 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })

    console.log('✅ Migrations deployed successfully!')

  } catch (error) {
    console.error('❌ Migration deployment failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runMigrations()