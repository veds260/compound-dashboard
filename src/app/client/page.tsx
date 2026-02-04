import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClientStats, getRecentClientPosts } from '@/lib/data/client-data'
import { startPerf, perfLog } from '@/lib/perf-logger'
import ClientDashboard from './client-dashboard'

const RECENT_DAYS = 10

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

  // Fetch data on the server - only recent posts for fast initial load
  const dataStart = startPerf()
  const [stats, recentPosts] = await Promise.all([
    getClientStats(clientId),
    getRecentClientPosts(clientId, RECENT_DAYS, 50)
  ])
  perfLog('/client - getClientStats + getRecentClientPosts', dataStart)

  perfLog('/client - TOTAL SERVER TIME', pageStart)

  // Pass data to client component with clientId for background loading
  return (
    <ClientDashboard
      initialStats={stats}
      initialPosts={recentPosts}
      clientId={clientId}
      recentDays={RECENT_DAYS}
    />
  )
}
