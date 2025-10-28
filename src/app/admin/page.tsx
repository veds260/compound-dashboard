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
  BuildingOfficeIcon,
  EyeIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'

interface AdminStats {
  totalWriters: number
  totalClients: number
  totalPosts: number
  pendingApprovals: number
  totalUploads: number
}

interface WriterOverview {
  id: string
  name: string
  email: string
  clientCount: number
  totalPosts: number
  pendingApprovals: number
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({
    totalWriters: 0,
    totalClients: 0,
    totalPosts: 0,
    pendingApprovals: 0,
    totalUploads: 0
  })
  const [writers, setWriters] = useState<WriterOverview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchStats()
    fetchWriters()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    }
  }

  const fetchWriters = async () => {
    try {
      const response = await fetch('/api/admin/writers')
      const data = await response.json()
      setWriters(data)
    } catch (error) {
      console.error('Error fetching writers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || !session || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent"></div>
        </div>
      </Layout>
    )
  }

  const statCards = [
    {
      name: 'Total Writers',
      value: stats.totalWriters,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Clients',
      value: stats.totalClients,
      icon: UserGroupIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Posts',
      value: stats.totalPosts,
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
    },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Oversee all agencies, clients, and platform performance
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <PremiumCard
              key={card.name}
              gradient
              className="pt-6 px-6 pb-8 animate-slide-up"
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={() => router.push('/admin/clients')}
                className="inline-flex items-center px-6 py-3 border border-gray-300/60 dark:border-gray-600/60 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <UserGroupIcon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                Manage Clients & Writers
              </button>
              <button
                onClick={() => router.push('/admin/posts')}
                className="inline-flex items-center px-6 py-3 border border-gray-300/60 dark:border-gray-600/60 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                View All Posts
              </button>
              <button
                onClick={() => router.push('/admin/analytics')}
                className="inline-flex items-center px-6 py-3 border border-gray-300/60 dark:border-gray-600/60 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <ChartBarIcon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                View Analytics
              </button>
              <button
                onClick={() => router.push('/admin/uploads')}
                className="inline-flex items-center px-6 py-3 border border-gray-300/60 dark:border-gray-600/60 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <CloudArrowUpIcon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                Upload History
              </button>
            </div>
          </div>
        </PremiumCard>

        {/* Writers Overview */}
        <PremiumCard className="animate-fade-in" gradient>
          <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100">Writers Overview</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">All agency writers and their client management</p>
          </div>
          <div className="overflow-hidden">
            {writers.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No writers found in the system.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Writer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Clients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Posts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {writers.map((writer) => (
                    <tr key={writer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{writer.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{writer.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{writer.clientCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{writer.totalPosts}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          writer.pendingApprovals > 0 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {writer.pendingApprovals}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => router.push(`/admin/writer/${writer.id}`)}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 flex items-center hover:scale-105 transition-all duration-200"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </PremiumCard>
      </div>
    </Layout>
  )
}