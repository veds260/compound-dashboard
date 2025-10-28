'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import PremiumCard from '@/components/PremiumCard'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [twitterHandle, setTwitterHandle] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Fetch profile picture for all users
    fetchProfilePicture()
  }, [session, status, router])

  const fetchProfilePicture = async () => {
    try {
      const response = await fetch('/api/user/profile-picture-get')
      const data = await response.json()
      setProfilePicture(data.profilePicture || null)

      // For clients, also fetch Twitter handle from client profile
      if (session?.user.role === 'CLIENT') {
        const clientResponse = await fetch('/api/client/profile')
        if (clientResponse.ok) {
          const clientData = await clientResponse.json()
          setTwitterHandle(clientData.twitterHandle || '')
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error)
    }
  }

  const handleTwitterHandleSave = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ twitterHandle })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update Twitter handle')
      }

      toast.success('Twitter username saved successfully!')
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save Twitter username')
    } finally {
      setSaving(false)
    }
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          // Max dimensions
          const MAX_WIDTH = 400
          const MAX_HEIGHT = 400

          let width = img.width
          let height = img.height

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height

          ctx?.drawImage(img, 0, 0, width, height)

          // Compress to JPEG with 0.7 quality
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 2MB.')
      return
    }

    setUploading(true)

    try {
      // Compress image
      const compressedDataUrl = await compressImage(file)

      // Check compressed size before uploading
      if (compressedDataUrl.length > 200000) {
        toast.error('Image is too large even after compression. Please use a smaller image.')
        setUploading(false)
        return
      }

      // Convert compressed data URL to blob
      const response = await fetch(compressedDataUrl)
      const blob = await response.blob()

      // Create file from blob
      const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now()
      })

      const formData = new FormData()
      formData.append('file', compressedFile)

      const uploadResponse = await fetch('/api/user/profile-picture', {
        method: 'POST',
        body: formData
      })

      const data = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(data.error || 'Failed to upload profile picture')
      }

      setProfilePicture(data.profilePicture)

      // Update session
      await update()

      toast.success('Profile picture updated successfully!')

      // Refresh the page to ensure UI updates
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload profile picture')
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePicture = async () => {
    setUploading(true)

    try {
      const response = await fetch('/api/user/profile-picture', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove profile picture')
      }

      setProfilePicture(null)

      // Update session
      await update()

      toast.success('Profile picture removed successfully!')
    } catch (error) {
      console.error('Remove error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove profile picture')
    } finally {
      setUploading(false)
    }
  }

  if (status === 'loading' || !session) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
            Profile Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your profile information
          </p>
        </div>

        <PremiumCard gradient>
          <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100">
              Profile Picture
            </h3>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center space-x-6">
              <div className="relative">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                  />
                ) : (
                  <UserCircleIcon className="w-24 h-24 text-gray-400 dark:text-gray-600" />
                )}
                {!uploading && (
                  <label
                    htmlFor="profile-picture"
                    className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-2 cursor-pointer hover:bg-primary-700 transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                )}
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Upload a profile picture to personalize your account
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  JPG, PNG, WebP or GIF. Max size 2MB.
                </p>
                {profilePicture && (
                  <button
                    onClick={handleRemovePicture}
                    disabled={uploading}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove picture
                  </button>
                )}
              </div>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard gradient>
          <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100">
              Account Information
            </h3>
          </div>
          <div className="px-6 py-5">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{session.user.name || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{session.user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {session.user.role === 'AGENCY' ? 'Marketing Agency' :
                   session.user.role === 'CLIENT' ? 'Client' :
                   session.user.role === 'ADMIN' ? 'Admin' : session.user.role}
                </dd>
              </div>
            </dl>
          </div>
        </PremiumCard>

        {/* Twitter Username - Only for Clients */}
        {session.user.role === 'CLIENT' && (
          <PremiumCard gradient>
            <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100">
                Twitter Profile
              </h3>
            </div>
            <div className="px-6 py-5">
              <div>
                <label htmlFor="twitter-handle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Twitter Username
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  This will be displayed in your tweet mockup previews (without the @ symbol)
                </p>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">@</span>
                    <input
                      id="twitter-handle"
                      type="text"
                      value={twitterHandle}
                      onChange={(e) => setTwitterHandle(e.target.value)}
                      placeholder="username"
                      disabled={saving}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <button
                    onClick={handleTwitterHandleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </PremiumCard>
        )}
      </div>
    </Layout>
  )
}
