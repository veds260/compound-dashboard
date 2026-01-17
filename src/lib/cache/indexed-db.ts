'use client'

const DB_NAME = 'compound-dashboard-cache'
const DB_VERSION = 1
const POSTS_STORE = 'posts'
const META_STORE = 'meta'

interface CachedPost {
  id: string
  content: string
  tweetText?: string
  scheduledDate?: string
  typefullyUrl: string
  status: string
  feedback?: string
  media?: string
  createdAt: string
  publishedDate?: string
  updatedAt: string
  client?: {
    id: string
    name: string
    email: string
    timezone?: string
    profilePicture?: string
    twitterHandle?: string
  }
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Posts store with clientId index
      if (!db.objectStoreNames.contains(POSTS_STORE)) {
        const postsStore = db.createObjectStore(POSTS_STORE, { keyPath: 'id' })
        postsStore.createIndex('clientId', 'clientId', { unique: false })
        postsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      // Metadata store for sync timestamps
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' })
      }
    }
  })

  return dbPromise
}

/**
 * Get cached posts for a client
 */
export async function getCachedPosts(clientId: string): Promise<CachedPost[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(POSTS_STORE, 'readonly')
      const store = tx.objectStore(POSTS_STORE)
      const index = store.index('clientId')
      const request = index.getAll(clientId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const posts = request.result || []
        // Sort by createdAt desc
        posts.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        resolve(posts)
      }
    })
  } catch (error) {
    console.warn('IndexedDB not available:', error)
    return []
  }
}

/**
 * Cache posts from server
 */
export async function cachePosts(posts: CachedPost[], clientId: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([POSTS_STORE, META_STORE], 'readwrite')
    const postsStore = tx.objectStore(POSTS_STORE)
    const metaStore = tx.objectStore(META_STORE)

    // Add clientId to each post for indexing
    for (const post of posts) {
      await new Promise<void>((resolve, reject) => {
        const request = postsStore.put({ ...post, clientId })
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    }

    // Update last sync timestamp
    await new Promise<void>((resolve, reject) => {
      const request = metaStore.put({
        key: `lastSync_${clientId}`,
        timestamp: new Date().toISOString()
      })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })

    console.log(`📦 [CACHE] Cached ${posts.length} posts for client ${clientId}`)
  } catch (error) {
    console.warn('Failed to cache posts:', error)
  }
}

/**
 * Get last sync timestamp for a client
 */
export async function getLastSyncTime(clientId: string): Promise<string | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readonly')
      const store = tx.objectStore(META_STORE)
      const request = store.get(`lastSync_${clientId}`)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result?.timestamp || null)
    })
  } catch (error) {
    console.warn('IndexedDB not available:', error)
    return null
  }
}

/**
 * Clear all cached data for a client
 */
export async function clearClientCache(clientId: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction([POSTS_STORE, META_STORE], 'readwrite')
    const postsStore = tx.objectStore(POSTS_STORE)
    const metaStore = tx.objectStore(META_STORE)
    const index = postsStore.index('clientId')

    // Get all post keys for this client
    const keysRequest = index.getAllKeys(clientId)
    keysRequest.onsuccess = () => {
      const keys = keysRequest.result
      for (const key of keys) {
        postsStore.delete(key)
      }
    }

    // Clear meta
    metaStore.delete(`lastSync_${clientId}`)

    console.log(`🗑️ [CACHE] Cleared cache for client ${clientId}`)
  } catch (error) {
    console.warn('Failed to clear cache:', error)
  }
}

/**
 * Update a single cached post
 */
export async function updateCachedPost(post: CachedPost & { clientId: string }): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(POSTS_STORE, 'readwrite')
    const store = tx.objectStore(POSTS_STORE)

    await new Promise<void>((resolve, reject) => {
      const request = store.put(post)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })

    console.log(`📦 [CACHE] Updated post ${post.id}`)
  } catch (error) {
    console.warn('Failed to update cached post:', error)
  }
}

/**
 * Delete a cached post
 */
export async function deleteCachedPost(postId: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(POSTS_STORE, 'readwrite')
    const store = tx.objectStore(POSTS_STORE)

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(postId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })

    console.log(`🗑️ [CACHE] Deleted post ${postId}`)
  } catch (error) {
    console.warn('Failed to delete cached post:', error)
  }
}
