# Marketing Agency Dashboard

A comprehensive dashboard for marketing agencies to manage Twitter analytics, client posts, and approval workflows.

## Features

### For Marketing Agencies:
- **Client Management**: Add, edit, and manage multiple clients
- **Analytics Upload**: Upload Twitter CSV analytics data and visualize with interactive charts
- **Post Management**: Create posts with Typefully links and manage approval workflow
- **Excel Integration**: Export posts to Excel and import approval updates
- **Dashboard Overview**: Quick stats and insights across all clients

### For Clients:
- **Post Approval**: Review and approve/reject posts with feedback
- **Analytics Viewing**: View your Twitter performance data and charts
- **Client Dashboard**: Overview of posts and analytics

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js for authentication
- **Database**: PostgreSQL with Prisma ORM
- **Charts**: Recharts for interactive analytics visualization
- **File Processing**: PapaParse for CSV processing, XLSX for Excel operations
- **UI Components**: Headless UI, Heroicons, React Hot Toast

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (requires PostgreSQL connection)
npx prisma migrate deploy

# (Optional) View your database in Prisma Studio
npx prisma studio
```

### 3. Environment Variables

Update the `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-secret-key-here"
NODE_ENV="development"
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Getting Started

### For Agency Users:

1. **Register** as an Agency user
2. **Create Clients** in the Clients section
3. **Upload Analytics Data** using Twitter CSV exports
4. **Create Posts** with Typefully links for client approval
5. **View Analytics** with interactive charts and metrics
6. **Use Excel Integration** to bulk update post statuses

### For Client Users:

1. **Register** as a Client user (or have your agency create your account)
2. **Review Posts** in the Posts section
3. **Approve/Reject** posts with feedback
4. **View Analytics** to track your Twitter performance

## CSV Upload Format

The system expects Twitter Analytics CSV files with the following columns:

- Date
- Impressions
- Engagements
- Engagement Rate
- Retweets
- Replies
- Likes
- User Profile Clicks
- URL Clicks
- Hashtag Clicks
- Detail Expands
- Permalink Clicks
- App Opens
- App Installs
- Follows
- Email Tweet
- Dial Phone
- Media Views
- Media Engagements

## Excel Integration Workflow

1. **Export Posts**: Download current posts data as Excel
2. **Update Status**: Modify the Status column (PENDING, APPROVED, REJECTED, SCHEDULED, PUBLISHED)
3. **Add Feedback**: Include client feedback in the Feedback column
4. **Import Updates**: Upload the modified Excel file to sync changes

## Database Schema

- **Users**: Agency users and clients with role-based access
- **Clients**: Client profiles managed by agencies
- **Posts**: Content posts with approval workflow
- **Analytics**: Twitter analytics data with metrics
- **Uploads**: File upload tracking

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Client Management
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Posts
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `PUT /api/posts/[id]` - Update post status/feedback

### Analytics
- `POST /api/upload` - Upload CSV analytics
- `GET /api/analytics/[clientId]` - Get analytics data

### Excel Operations
- `GET /api/excel/export` - Export all posts
- `POST /api/excel/import` - Import post updates
- `GET /api/excel/client/[clientId]` - Export client report

## Security Features

- Role-based access control (Agency vs Client)
- Data isolation between clients
- Session-based authentication
- File type validation for uploads
- Input sanitization and validation

## Performance Features

- Optimized database queries with Prisma
- Client-side data caching
- Responsive design for mobile/desktop
- Efficient CSV processing
- Interactive charts with proper loading states

## Deployment

### Railway Deployment

1. Create a new project on [Railway](https://railway.app)
2. Add PostgreSQL database service
3. Connect your GitHub repository
4. Add environment variables:
   - `DATABASE_URL` - Automatically provided by Railway PostgreSQL
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your deployed Railway URL
5. Railway will automatically:
   - Install dependencies
   - Run Prisma migrations (`npx prisma migrate deploy`)
   - Build and deploy the application

### Manual Production Build

```bash
npm run build
npm start
```

### Environment Setup

Ensure production environment variables are properly configured:
- Set a secure `NEXTAUTH_SECRET`
- Update `NEXTAUTH_URL` to your production domain
- Configure `DATABASE_URL` for your PostgreSQL instance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and demonstration purposes.