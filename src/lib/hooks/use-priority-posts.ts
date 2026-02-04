'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { getCachedPosts, cachePosts } from '@/lib/cache/indexed-db'

export interface Post {
  id: string
  content: string
  tweetText?: string
  scheduledDate?: string
  typefullyUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES' | 'PUBLISHED'
  feedback?: string
  media?: string
  createdAt: string
  publishedDate?: string
  client?: {
    id: string
    name: string
    email: string
    timezone?: string
    profilePicture?: string
    twitterHandle?: string
  }
}

interface UsePriorityPostsOptions {
  clientId: string | undefined
  recentDays?: number
  enabled?: boolean
}

interface UsePriorityPostsResult {
  posts: Post[]
  recentPosts: Post[]
  olderPosts: Post[]
  isLoadingRecent: boolean
  isLoadingOlder: boolean
  isLoadingCache: boolean
  hasOlderPosts: boolean
  mutate: () => void
  updatePostLocally: (postId: string, updates: Partial<Post>) => void
}

const fetcher = async (url: string): Promise<Post[]> => {
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch')
  }
  const data = await response.json()
  return data?.posts ?? (Array.isArray(data) ? data : [])
}

export function usePriorityPosts({
  clientId,
  recentDays = 10,
  enabled = true
}: UsePriorityPostsOptions): UsePriorityPostsResult {
  const [cachedPosts, setCachedPosts] = useState<Post[]>([])
  const [cacheLoaded, setCacheLoaded] = useState(false)
  const [olderPosts, setOlderPosts] = useState<Post[]>([])
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [hasOlderPosts, setHasOlderPosts] = useState(true)

  // Calculate the date range for recent posts
  const recentCutoffDate = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - recentDays)
    return date.toISOString()
  }, [recentDays])

  // Build URL for recent posts
  const recentPostsUrl = useMemo(() => {
    if (!clientId || !enabled) return null
    return `/api/posts?clientId=${clientId}&since=${recentCutoffDate}`
  }, [clientId, recentCutoffDate, enabled])

  // Load from IndexedDB cache on mount
  useEffect(() => {
    if (!clientId || !enabled) {
      setCacheLoaded(true)
      return
    }

    const loadCache = async () => {
      const start = Date.now()
      try {
        const cached = await getCachedPosts(clientId)
        if (cached.length > 0) {
          console.log(`[CACHE] Loaded ${cached.length} posts from IndexedDB in ${Date.now() - start}ms`)
          setCachedPosts(cached as Post[])
        }
      } catch (err) {
        console.warn('Failed to load cache:', err)
      }
      setCacheLoaded(true)
    }

    loadCache()
  }, [clientId, enabled])

  // Fetch recent posts with SWR
  const {
    data: recentPostsData,
    isLoading: isLoadingRecent,
    mutate: mutateRecent
  } = useSWR<Post[]>(
    recentPostsUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      fallbackData: cachedPosts.length > 0
        ? cachedPosts.filter(p => new Date(p.createdAt) >= new Date(recentCutoffDate))
        : undefined,
      onSuccess: (data) => {
        // Cache recent posts (add updatedAt for cache compatibility)
        if (clientId && data.length > 0) {
          const postsWithUpdatedAt = data.map(p => ({
            ...p,
            updatedAt: p.createdAt // Use createdAt as fallback for updatedAt
          }))
          cachePosts(postsWithUpdatedAt as any, clientId).catch(err =>
            console.warn('Failed to cache recent posts:', err)
          )
        }
        // After recent posts load, fetch older posts in background
        if (hasOlderPosts && !isLoadingOlder) {
          fetchOlderPosts()
        }
      }
    }
  )

  // Fetch older posts in background
  const fetchOlderPosts = useCallback(async () => {
    if (!clientId || isLoadingOlder) return

    setIsLoadingOlder(true)
    const start = Date.now()

    try {
      const response = await fetch(
        `/api/posts?clientId=${clientId}&before=${recentCutoffDate}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch older posts')
      }
      const data = await response.json()
      const posts = data?.posts ?? (Array.isArray(data) ? data : [])

      console.log(`[NETWORK] Fetched ${posts.length} older posts in ${Date.now() - start}ms`)

      setOlderPosts(posts)
      setHasOlderPosts(posts.length > 0)

      // Cache older posts too (add updatedAt for cache compatibility)
      if (clientId && posts.length > 0) {
        const postsWithUpdatedAt = posts.map((p: Post) => ({
          ...p,
          updatedAt: p.createdAt
        }))
        cachePosts(postsWithUpdatedAt as any, clientId).catch(err =>
          console.warn('Failed to cache older posts:', err)
        )
      }
    } catch (err) {
      console.error('Error fetching older posts:', err)
    } finally {
      setIsLoadingOlder(false)
    }
  }, [clientId, recentCutoffDate, isLoadingOlder])

  // Merge recent and older posts, removing duplicates
  const allPosts = useMemo(() => {
    const recentPosts = recentPostsData ?? []
    const postsMap = new Map<string, Post>()

    // Add recent posts first (they take precedence)
    for (const post of recentPosts) {
      postsMap.set(post.id, post)
    }

    // Add older posts
    for (const post of olderPosts) {
      if (!postsMap.has(post.id)) {
        postsMap.set(post.id, post)
      }
    }

    // If we have no network data yet, use cached posts
    if (postsMap.size === 0 && cachedPosts.length > 0) {
      return cachedPosts
    }

    // Sort by createdAt desc
    return Array.from(postsMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [recentPostsData, olderPosts, cachedPosts])

  // Update a post locally (optimistic update)
  const updatePostLocally = useCallback((postId: string, updates: Partial<Post>) => {
    // Update in recent posts
    mutateRecent(
      (current) => {
        if (!current) return current
        return current.map(p => p.id === postId ? { ...p, ...updates } : p)
      },
      { revalidate: false }
    )

    // Update in older posts
    setOlderPosts(current =>
      current.map(p => p.id === postId ? { ...p, ...updates } : p)
    )

    // Update in cached posts
    setCachedPosts(current =>
      current.map(p => p.id === postId ? { ...p, ...updates } : p)
    )
  }, [mutateRecent])

  // Combined mutate function
  const mutate = useCallback(() => {
    mutateRecent()
    // Re-fetch older posts too
    fetchOlderPosts()
  }, [mutateRecent, fetchOlderPosts])

  return {
    posts: allPosts,
    recentPosts: recentPostsData ?? [],
    olderPosts,
    isLoadingRecent: !cacheLoaded || (isLoadingRecent && allPosts.length === 0),
    isLoadingOlder,
    isLoadingCache: !cacheLoaded,
    hasOlderPosts,
    mutate,
    updatePostLocally
  }
}
