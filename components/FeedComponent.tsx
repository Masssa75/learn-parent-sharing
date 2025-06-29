'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { YouTubePlayer } from './YouTubePlayer'

interface User {
  id: string
  telegramId: number
  username?: string
  firstName: string
  lastName?: string
  photoUrl?: string
  displayName: string
  isAdmin?: boolean
}

interface Post {
  id: string
  title: string
  description?: string
  linkUrl?: string
  youtubeVideoId?: string
  category?: {
    name: string
    emoji: string
  }
  user?: {
    name?: string
    username?: string
    avatar?: string | null
  }
  ageRange?: string
  likes: number
  comments: number
  saved: boolean
  liked: boolean
  createdAt: string
}

interface FeedComponentProps {
  showAuthPrompt?: boolean
  protectedRoute?: boolean
}

const categories = ['ALL', 'APPS', 'TOYS', 'BOOKS', 'ACTIVITIES', 'TIPS']

export default function FeedComponent({ showAuthPrompt = true, protectedRoute = false }: FeedComponentProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    
    const handleFocus = () => {
      if (mounted) {
        checkAuth()
      }
    }
    
    checkAuth()
    fetchPosts()
    
    // Check auth when window gets focus
    window.addEventListener('focus', handleFocus)
    
    return () => {
      mounted = false
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check')
      if (!response.ok) {
        throw new Error(`Auth check failed: ${response.status}`)
      }
      const data = await response.json()
      setIsAuthenticated(data.authenticated === true)
      if (data.authenticated && data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
      
      if (protectedRoute && !data.authenticated) {
        router.push('/')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
      setUser(null)
      if (protectedRoute) {
        router.push('/')
      }
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`)
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setPosts(data)
      } else if (data && Array.isArray(data.posts)) {
        setPosts(data.posts)
      } else {
        console.error('Invalid posts data received:', data)
        setPosts([])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status}`)
      }
      setUser(null)
      setIsAuthenticated(false)
      setShowProfileMenu(false)
      router.push('/')
      // Small delay before reload to ensure state updates
      setTimeout(() => window.location.reload(), 100)
    } catch (error) {
      console.error('Sign out failed:', error)
      // Force logout on client side even if server fails
      setUser(null)
      setIsAuthenticated(false)
      setShowProfileMenu(false)
      router.push('/')
    }
  }

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    // TODO: Implement like functionality
    console.log('Like post:', postId)
  }

  const handleSave = async (postId: string) => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    // TODO: Implement save functionality
    console.log('Save post:', postId)
  }

  const getLinkPreview = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
    }
  }

  const filteredPosts = selectedCategory === 'ALL' 
    ? (posts || [])
    : (posts || []).filter(post => {
        const categoryName = post.category?.name
        // Map button labels to actual category names
        const categoryMap: Record<string, string> = {
          'APPS': 'Apps & Software',
          'TOYS': 'Toys & Games',
          'BOOKS': 'Books',
          'ACTIVITIES': 'Activities',
          'TIPS': 'Parenting Tips'
        }
        return categoryName && categoryName === categoryMap[selectedCategory]
      })

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="sticky top-0 bg-dark-bg z-10">
        <div className="max-w-2xl mx-auto px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-2">
          <h1 className="text-display text-text-primary">Discover</h1>
          {!isAuthenticated ? (
            <Link 
              href="/login"
              className="px-6 py-3 bg-brand-yellow text-black rounded-button font-semibold hover:scale-105 btn-transition"
            >
              SIGN IN
            </Link>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-12 h-12 bg-brand-yellow rounded-avatar flex items-center justify-center overflow-hidden relative group"
                title={user?.displayName || 'Profile'}
              >
                {user?.photoUrl ? (
                  <img 
                    src={user.photoUrl} 
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      try {
                        const img = e.currentTarget as HTMLImageElement
                        if (img) {
                          img.style.display = 'none'
                          const parent = img.parentElement
                          if (parent) {
                            const span = parent.querySelector('span')
                            if (span) span.classList.remove('hidden')
                          }
                        }
                      } catch (error) {
                        console.error('Error handling image load failure:', error)
                      }
                    }}
                  />
                ) : null}
                <span className={`${user?.photoUrl ? 'hidden' : 'flex items-center justify-center w-full h-full'} ${user?.firstName ? 'text-black font-semibold text-2xl' : 'text-xl'}`}>
                  {user?.firstName ? user.firstName.charAt(0).toUpperCase() : (user ? 'U' : '👤')}
                </span>
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-surface rounded-card shadow-lg py-2 border border-dark-border">
                  <Link
                    href="/profile"
                    className="block w-full text-left px-4 py-2 text-text-primary hover:bg-white/5"
                  >
                    View Profile
                  </Link>
                  {user?.isAdmin && (
                    <Link
                      href="/admin"
                      className="block w-full text-left px-4 py-2 text-text-primary hover:bg-white/5"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-text-primary hover:bg-white/5"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-text-secondary text-body-lg mb-6">What's working for parents today</p>
        
        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-button whitespace-nowrap transition-all font-semibold text-body ${
                selectedCategory === category
                  ? 'bg-brand-yellow text-black'
                  : 'bg-transparent text-text-primary border border-dark-border hover:bg-white/5'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-2xl mx-auto px-5 pb-20 custom-scrollbar">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-secondary text-body-lg mb-4">No posts yet</p>
            <p className="text-text-muted text-body">
              {isAuthenticated 
                ? "Be the first to share something amazing!"
                : "Sign in to start sharing your discoveries"}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="mb-8">
              {/* Post Header */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-dark-surface rounded-avatar flex items-center justify-center overflow-hidden">
                  {post.user?.avatar ? (
                    <img 
                      src={post.user.avatar} 
                      alt={post.user.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">
                      {post.user?.name ? post.user.name.charAt(0).toUpperCase() : '👤'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-body-lg font-semibold text-text-primary">
                    {post.user?.name || 'Anonymous'}
                  </div>
                  <div className="text-meta text-text-muted flex items-center gap-2">
                    <span>{new Date(post.createdAt).toLocaleDateString()} ·</span>
                    <span className="flex items-center gap-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                        <line x1="12" y1="18" x2="12" y2="18"></line>
                      </svg>
                      <span className="text-text-secondary">{post.category?.name || 'App'}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Post Content */}
              <h2 className="text-title-lg text-text-primary mb-4">{post.title}</h2>
              {post.description && (
                <p className="text-body text-gray-300 mb-4 leading-relaxed">{post.description}</p>
              )}
              
              {/* YouTube Video */}
              {post.youtubeVideoId && (
                <div className="mb-6">
                  <YouTubePlayer url={`https://www.youtube.com/watch?v=${post.youtubeVideoId}`} title={post.title} />
                </div>
              )}
              
              {/* External Link */}
              {post.linkUrl && !post.youtubeVideoId && (
                <div className="bg-dark-surface rounded-card p-4 mb-6">
                  <a
                    href={post.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-brand-yellow hover:underline"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="truncate">{getLinkPreview(post.linkUrl)}</span>
                  </a>
                </div>
              )}
              
              {/* Post Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-button font-semibold text-body bg-transparent text-text-primary border border-dark-border hover:bg-white/5 btn-transition"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span>{post.likes || 0}</span>
                </button>
                
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-button font-semibold text-body bg-transparent text-text-primary border border-dark-border hover:bg-white/5 btn-transition">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                  <span>{post.comments || 0}</span>
                </button>
                
                <button
                  onClick={() => handleSave(post.id)}
                  className="ml-auto text-text-primary hover:text-brand-yellow font-semibold text-body btn-transition"
                >
                  SHARE
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button or Auth Prompt */}
      {isAuthenticated ? (
        <Link
          href="/create"
          className="fixed bottom-8 right-6 w-16 h-16 bg-brand-yellow rounded-fab flex items-center justify-center shadow-xl shadow-brand-yellow/40 text-black text-4xl font-light hover:scale-110 hover:shadow-2xl hover:shadow-brand-yellow/60 active:scale-95 btn-transition z-50"
        >
          +
        </Link>
      ) : showAuthPrompt && (
        <div className="fixed bottom-6 left-6 right-6 bg-dark-surface rounded-card p-6 border border-dark-border shadow-xl">
          <p className="text-text-primary text-body-lg font-semibold mb-2">Join the community!</p>
          <p className="text-text-secondary text-body mb-4">Sign in to share your discoveries and connect with other parents.</p>
          <Link 
            href="/login"
            className="block w-full bg-brand-yellow text-black rounded-button py-3 text-center font-semibold hover:scale-[1.02] btn-transition"
          >
            Sign in with Telegram
          </Link>
        </div>
      )}
    </div>
  )
}