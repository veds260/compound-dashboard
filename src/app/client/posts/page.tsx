import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClientPostsForApproval } from '@/lib/data/client-data'
import ClientPostsContent from './client-posts-content'

interface PageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function ClientPostsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'CLIENT') {
    redirect('/dashboard')
  }

  const clientId = session.user.clientId
  if (!clientId) {
    redirect('/login')
  }

  // Fetch posts on the server (cached for 30 seconds)
  const posts = await getClientPostsForApproval(clientId, 50)

  // Serialize dates for client component
  const serializedPosts = posts.map(post => ({
    ...post,
    scheduledDate: post.scheduledDate?.toISOString() || null,
    createdAt: post.createdAt.toISOString(),
    publishedDate: post.publishedDate?.toISOString() || null
  }))

  const params = await searchParams
  const initialFilter = params.filter || undefined

  return (
    <ClientPostsContent
      initialPosts={serializedPosts}
      clientId={clientId}
      initialStatusFilter={initialFilter}
    />
  )
}
