'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import PremiumCard from '@/components/PremiumCard'
import { 
  UserGroupIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalClients: number
  totalPosts: number
  pendingApprovals: number
  totalUploads: number
}

export default function AgencyDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalPosts: 0,
    pendingApprovals: 0,
    totalUploads: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role === 'CLIENT') {
      router.push('/client')
      return
    }
    
    if (session.user.role === 'ADMIN') {
      router.push('/admin')
      return
    }
    
    if (session.user.role !== 'AGENCY') {
      router.push('/login')
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || !session || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
        </div>
      </Layout>
    )
  }

  const statCards = [
    {
      name: 'Total Clients',
      value: stats.totalClients,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      href: '/dashboard/clients'
    },
    {
      name: 'Total Posts',
      value: stats.totalPosts,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      href: '/dashboard/posts'
    },
    {
      name: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
      href: '/dashboard/posts'
    },
    {
      name: 'Data Uploads',
      value: stats.totalUploads,
      icon: CloudArrowUpIcon,
      color: 'bg-purple-500',
      href: '/dashboard/upload'
    },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
              Agency Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your clients, analyze performance, and approve content
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <PremiumCard
              key={card.name}
              hover
              gradient
              className="pt-6 px-6 pb-8 cursor-pointer animate-slide-up"
              onClick={() => router.push(card.href)}
            >
              <dt>
                <div className={`absolute ${card.color} rounded-xl p-3 shadow-lg`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{card.name}</p>
              </dt>
              <dd className="ml-16 pb-2 flex items-baseline">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  {card.value}
                </p>
              </dd>
            </PremiumCard>
          ))}
        </div>

        {/* Quick Actions */}
        <PremiumCard className="animate-fade-in" gradient>
          <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => router.push('/dashboard/clients')}
                className="inline-flex items-center px-6 py-3 border border-gray-300/60 dark:border-gray-600/60 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <UserGroupIcon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                Manage Clients
              </button>
              <button
                onClick={() => router.push('/dashboard/upload')}
                className="inline-flex items-center px-6 py-3 border border-gray-300/60 dark:border-gray-600/60 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <CloudArrowUpIcon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                Upload Analytics
              </button>
              <button
                onClick={() => router.push('/dashboard/posts')}
                className="inline-flex items-center px-6 py-3 border border-gray-300/60 dark:border-gray-600/60 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                Create Post
              </button>
              <button
                onClick={() => router.push('/dashboard/analytics')}
                className="inline-flex items-center px-6 py-3 border border-gray-300/60 dark:border-gray-600/60 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <ChartBarIcon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                View Analytics
              </button>
            </div>
          </div>
        </PremiumCard>

        {/* Recent Activity */}
        <PremiumCard className="animate-fade-in" gradient>
          <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Latest updates across your clients</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Recent activity will appear here once you start managing clients and posts.</p>
          </div>
        </PremiumCard>
      </div>
    </Layout>
  )
}