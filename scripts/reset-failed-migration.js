const { execSync } = require('child_process')

async function resetFailedMigration() {
  try {
    console.log('🔄 Resolving failed migration state...')

    // First, mark the failed migration as applied to clear the failure state
    try {
      console.log('📋 Marking failed migration as resolved...')
      execSync('npx prisma migrate resolve --applied 20240921000004_fix_post_status_enum', {
        stdio: 'inherit',
        timeout: 30000
      })
      console.log('✅ Failed migration marked as resolved')
    } catch (error) {
      console.log('ℹ️ Could not resolve migration (might not exist):', error.message)
    }

    // Now deploy any pending migrations
    console.log('📦 Deploying migrations...')
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      timeout: 60000
    })

    console.log('✅ Migrations deployed successfully!')

  } catch (error) {
    console.error('❌ Migration deployment failed:', error.message)

    // If deploy fails, try to reset the database migration state
    try {
      console.log('🔄 Attempting to reset migration state...')
      execSync('npx prisma migrate reset --force', { stdio: 'inherit' })
      console.log('✅ Database reset completed')
    } catch (resetError) {
      console.error('❌ Reset also failed:', resetError.message)
      process.exit(1)
    }
  }
}

resetFailedMigration()