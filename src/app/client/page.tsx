import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClientStats, getClientPosts } from '@/lib/data/client-data'
import ClientDashboard from './client-dashboard'

export default async function ClientPage() {
  // Get session on the server
  const session = await getServerSession(authOptions)

  // Redirect if not authenticated
  if (!session) {
    redirect('/login')
  }

  // Redirect based on role
  if (session.user.role === 'AGENCY') {
    redirect('/dashboard')
  }

  if (session.user.role === 'ADMIN') {
    redirect('/admin')
  }

  if (session.user.role !== 'CLIENT') {
    redirect('/login')
  }

  // Get clientId from session
  const clientId = session.user.clientId

  if (!clientId) {
    redirect('/login')
  }

  // Fetch data on the server (cached for 30 seconds)
  const [stats, posts] = await Promise.all([
    getClientStats(clientId),
    getClientPosts(clientId, 50)
  ])

  // Pass data to client component
  return (
    <ClientDashboard
      initialStats={stats}
      initialPosts={posts}
    />
  )
}
