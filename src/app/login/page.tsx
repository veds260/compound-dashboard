'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('[Login Page] Attempting login for:', email)

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      console.log('[Login Page] SignIn result:', {
        ok: result?.ok,
        status: result?.status,
        error: result?.error,
        url: result?.url
      })

      if (result?.error) {
        console.error('[Login Page] Login failed with error:', result.error)
        toast.error(`Login failed: ${result.error}`)
        return
      }

      if (!result?.ok) {
        console.error('[Login Page] Login not OK, status:', result?.status)
        toast.error('Login failed - please check your credentials')
        return
      }

      console.log('[Login Page] Login successful, getting session...')

      // Get session to check user role and redirect appropriately
      const session = await getSession()

      console.log('[Login Page] Session:', {
        exists: !!session,
        userId: session?.user?.id,
        role: session?.user?.role,
        email: session?.user?.email
      })

      if (!session || !session.user) {
        console.error('[Login Page] No session found after login')
        toast.error('Failed to establish session')
        return
      }

      if (session.user.role === 'ADMIN') {
        console.log('[Login Page] Redirecting ADMIN to /admin')
        router.push('/admin')
      } else if (session.user.role === 'AGENCY') {
        console.log('[Login Page] Redirecting AGENCY to /dashboard')
        router.push('/dashboard')
      } else {
        console.log('[Login Page] Redirecting CLIENT to /client')
        router.push('/client')
      }

      toast.success('Logged in successfully')
    } catch (error) {
      console.error('[Login Page] Unexpected error:', error)
      toast.error(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-10">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo width={200} height={50} forceTheme="dark" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Sign in
          </h2>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-700 bg-black text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="Email"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-700 bg-black text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 text-base font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}