'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  CalendarIcon,
  FolderIcon,
  Cog6ToothIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import GradientBackground from './GradientBackground'
import Logo from './Logo'

interface LayoutProps {
  children: React.ReactNode
}

const agencyNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Clients', href: '/dashboard/clients', icon: UserGroupIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Posts', href: '/dashboard/posts', icon: DocumentTextIcon },
  { name: 'Import Posts', href: '/dashboard/import-posts', icon: DocumentTextIcon },
  { name: 'Upload Data', href: '/dashboard/upload', icon: CloudArrowUpIcon },
  { name: 'Excel Integration', href: '/dashboard/excel', icon: DocumentTextIcon },
]

const clientNavigation = [
  { name: 'Dashboard', href: '/client', icon: HomeIcon },
  { name: 'Posts', href: '/client/posts', icon: DocumentTextIcon },
  { name: 'Calendar', href: '/client/calendar', icon: CalendarIcon },
  { name: 'Content Dump', href: '/client/content-dump', icon: FolderIcon },
]

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'System Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'User Management', href: '/admin/users', icon: UsersIcon },
  { name: 'Clients & Writers', href: '/admin/clients', icon: UserGroupIcon },
  { name: 'Posts', href: '/admin/posts', icon: DocumentTextIcon },
  { name: 'Upload History', href: '/admin/uploads', icon: CloudArrowUpIcon },
  { name: 'Database', href: '/admin/database', icon: Cog6ToothIcon },
]

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [loadingPicture, setLoadingPicture] = useState(true)

  useEffect(() => {
    if (session) {
      fetchProfilePicture()
    }
  }, [session])

  const fetchProfilePicture = async () => {
    try {
      setLoadingPicture(true)
      const response = await fetch('/api/user/profile-picture-get')
      if (response.ok) {
        const data = await response.json()
        setProfilePicture(data.profilePicture || null)
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error)
      setProfilePicture(null)
    } finally {
      setLoadingPicture(false)
    }
  }

  if (!session) {
    return <div>{children}</div>
  }

  const getNavigation = () => {
    switch (session.user.role) {
      case 'ADMIN':
        return adminNavigation
      case 'AGENCY':
        return agencyNavigation
      case 'CLIENT':
        return clientNavigation
      default:
        return []
    }
  }
  
  const navigation = getNavigation()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="h-screen flex relative bg-theme-bg">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-theme-card/95 backdrop-blur-sm border-r border-theme-border">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-shrink-0 flex items-center px-4">
            <Logo width={100} height={25} className="h-6" />
          </div>
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-theme-accent text-white'
                        : 'text-gray-400 hover:bg-theme-card hover:text-gray-200'
                    }`}
                  >
                    <item.icon className={`mr-3 h-6 w-6 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar - Minimal with hover expand */}
      <div className="hidden md:flex md:flex-shrink-0 group">
        <div className="flex flex-col w-16 group-hover:w-64 transition-all duration-300 ease-in-out h-full">
          <div className="flex flex-col flex-1 bg-theme-card/90 backdrop-blur-md border-r border-theme-border shadow-medium">
            {/* Logo */}
            <div className="flex items-center justify-center group-hover:justify-start flex-shrink-0 px-4 pt-5 transition-all duration-300">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Logo width={110} height={28} className="h-7" />
              </div>
            </div>

            {/* Navigation */}
            <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto overflow-x-hidden pb-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group/item flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-theme-accent text-white shadow-lg'
                        : 'text-gray-400 hover:bg-theme-bg/60 hover:text-gray-200 hover:shadow-sm'
                    }`}
                    title={item.name}
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover/item:text-theme-accent'} transition-colors duration-200`} />
                    <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Profile Section */}
            <div className="flex-shrink-0 border-t border-theme-border px-2 py-3 space-y-1">
              <Link
                href="/profile"
                className="group/item flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-400 hover:bg-theme-bg/60 hover:text-gray-200 hover:shadow-sm"
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={session.user.name || 'Profile'}
                    className="h-8 w-8 rounded-full object-cover flex-shrink-0 border border-theme-border"
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-gray-500 flex-shrink-0" />
                )}
                <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">{session.user.name}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="group/item flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-400 hover:bg-reject-bg/30 hover:text-reject-text hover:shadow-sm"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover/item:text-reject-text transition-colors duration-200" />
                <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-theme-card/80 backdrop-blur-md border-b border-theme-border">
          <button
            className="px-4 border-r border-theme-border text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-theme-accent md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex"></div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <Link href="/profile" className="flex items-center space-x-2">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={session.user.name || 'Profile'}
                    className="w-8 h-8 rounded-full object-cover border-2 border-theme-border"
                  />
                ) : (
                  <UserCircleIcon className="w-8 h-8 text-gray-500" />
                )}
                <span className="text-sm text-gray-300 hidden sm:inline">
                  Welcome back, {session.user.name}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-theme-bg">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}