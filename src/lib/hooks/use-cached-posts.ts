'use client'

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import {
  getCachedPosts,
  cachePosts,
  updateCachedPost,
  deleteCachedPost
} from '@/lib/cache/indexed-db'

interface Post {
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

const fetcher = async (url: string) => {
  const start = Date.now()
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch')
  }
  const data = await response.json()
  const duration = Date.now() - start
  console.log(`🌐 [NETWORK] Fetched posts in ${duration}ms`)
  return data?.posts ?? (Array.isArray(data) ? data : [])
}

interface UseCachedPostsOptions {
  clientId: string
  enabled?: boolean
}

export function useCachedPosts({ clientId, enabled = true }: UseCachedPostsOptions) {
  const [cachedPosts, setCachedPosts] = useState<Post[]>([])
  const [isLoadingCache, setIsLoadingCache] = useState(true)

  // Load from IndexedDB on mount
  useEffect(() => {
    if (!clientId || !enabled) {
      setIsLoadingCache(false)
      return
    }

    const loadCache = async () => {
      const start = Date.now()
      const cached = await getCachedPosts(clientId)
      const duration = Date.now() - start

      if (cached.length > 0) {
        console.log(`⚡ [CACHE] Loaded ${cached.length} posts from IndexedDB in ${duration}ms`)
        setCachedPosts(cached as Post[])
      }
      setIsLoadingCache(false)
    }

    loadCache()
  }, [clientId, enabled])

  // SWR for fresh data
  const postsUrl = enabled && clientId ? `/api/posts?clientId=${clientId}` : null
  const {
    data: freshPosts,
    isLoading: isLoadingFresh,
    mutate
  } = useSWR<Post[]>(postsUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 10000,
    onSuccess: (data) => {
      // Update IndexedDB cache when fresh data arrives
      if (data && data.length > 0) {
        cachePosts(data as any, clientId)
        setCachedPosts(data)
      }
    }
  })

  // Use fresh data if available, otherwise use cache
  const posts = freshPosts ?? cachedPosts

  // Optimistic update helper
  const optimisticUpdate = useCallback(async (
    postId: string,
    updates: Partial<Post>,
    apiCall: () => Promise<any>
  ) => {
    // Optimistically update local state
    const previousPosts = posts
    const updatedPosts = posts.map(p =>
      p.id === postId ? { ...p, ...updates } : p
    )

    // Update local state immediately
    setCachedPosts(updatedPosts)

    try {
      // Make API call
      const result = await apiCall()

      // Update cache with server response
      if (result) {
        updateCachedPost({ ...result, clientId })
      }

      // Revalidate SWR
      mutate()

      return result
    } catch (error) {
      // Rollback on error
      setCachedPosts(previousPosts)
      throw error
    }
  }, [posts, clientId, mutate])

  // Optimistic delete helper
  const optimisticDelete = useCallback(async (
    postId: string,
    apiCall: () => Promise<any>
  ) => {
    // Optimistically remove from local state
    const previousPosts = posts
    const updatedPosts = posts.filter(p => p.id !== postId)
    setCachedPosts(updatedPosts)

    try {
      await apiCall()
      deleteCachedPost(postId)
      mutate()
    } catch (error) {
      // Rollback on error
      setCachedPosts(previousPosts)
      throw error
    }
  }, [posts, mutate])

  return {
    posts,
    isLoading: isLoadingCache && !cachedPosts.length,
    isLoadingFresh,
    isCached: cachedPosts.length > 0 && !freshPosts,
    mutate,
    optimisticUpdate,
    optimisticDelete
  }
}
