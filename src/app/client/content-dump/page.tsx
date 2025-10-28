'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import ContentDump from '@/components/ContentDump'

export default function ClientContentDumpPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'CLIENT') {
      router.push('/login')
      return
    }
  }, [session, status, router])

  if (status === 'loading' || !session) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-white sm:text-3xl">
              Content Dump
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              View all your content in a consolidated list
            </p>
          </div>
        </div>

        <ContentDump
          clientId={session.user.clientId || ''}
          userRole="CLIENT"
        />
      </div>
    </Layout>
  )
}
