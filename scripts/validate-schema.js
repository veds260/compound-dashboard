// Validate Prisma schema without requiring database connection
const fs = require('fs')
const path = require('path')

function validateSchema() {
  try {
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
    const schemaContent = fs.readFileSync(schemaPath, 'utf8')

    console.log('✅ Prisma schema file exists and is readable')

    // Check for required enums
    if (schemaContent.includes('enum PostStatus')) {
      console.log('✅ PostStatus enum found')
    } else {
      console.log('❌ PostStatus enum missing')
      return false
    }

    // Check for Post model with enum status
    if (schemaContent.includes('status        PostStatus')) {
      console.log('✅ Post.status uses PostStatus enum')
    } else {
      console.log('❌ Post.status not using PostStatus enum')
      return false
    }

    // Check migration file
    const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20240921000004_fix_post_status_enum', 'migration.sql')
    if (fs.existsSync(migrationPath)) {
      console.log('✅ Migration file exists')
    } else {
      console.log('❌ Migration file missing')
      return false
    }

    console.log('✅ Schema validation passed!')
    return true

  } catch (error) {
    console.error('❌ Schema validation failed:', error)
    return false
  }
}

validateSchema()