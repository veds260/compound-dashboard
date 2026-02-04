import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { startPerf, perfLog } from '@/lib/perf-logger'
import ClientDashboard from './client-dashboard'

export default async function ClientPage() {
  const pageStart = startPerf()

  // Get session on the server - this is fast (~4ms)
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

  perfLog('/client - TOTAL SERVER TIME', pageStart)

  // Render immediately - data is fetched client-side from IndexedDB cache + API
  return <ClientDashboard clientId={clientId} />
}
