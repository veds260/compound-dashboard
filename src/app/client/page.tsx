import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClientStats, getClientPosts } from '@/lib/data/client-data'
import { startPerf, perfLog } from '@/lib/perf-logger'
import ClientDashboard from './client-dashboard'

export default async function ClientPage() {
  const pageStart = startPerf()

  // Get session on the server
  const sessionStart = startPerf()
  const session = await getServerSession(authOptions)
  perfLog('/client - getServerSession', sessionStart)

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
  const dataStart = startPerf()
  const [stats, posts] = await Promise.all([
    getClientStats(clientId),
    getClientPosts(clientId, 50)
  ])
  perfLog('/client - getClientStats + getClientPosts', dataStart)

  perfLog('/client - TOTAL SERVER TIME', pageStart)

  // Pass data to client component
  return (
    <ClientDashboard
      initialStats={stats}
      initialPosts={posts}
    />
  )
}
