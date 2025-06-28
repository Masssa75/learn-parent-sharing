'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { YouTubePlayer } from '@/components/YouTubePlayer'
import { isYouTubeUrl } from '@/utils/youtube'

interface Post {
  id: string
  user: {
    name: string
    username: string
    avatar: string | null
  }
  category: {
    name: string
    emoji: string
  }
  ageRange: string
  title: string
  description: string
  likes: number
  comments: number
  liked?: boolean
  saved?: boolean
  linkUrl?: string
  imageUrl?: string
  createdAt?: string
}


const categories = ['ALL', 'APPS', 'TOYS', 'TIPS']

interface User {
  id: string
  telegramId: number
  username?: string
  firstName: string
  lastName?: string
  photoUrl?: string
  displayName: string
}

export default function FeedPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // Check if user is authenticated and get user data
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        const data = await response.json()
        if (data.authenticated && data.user) {
          setUser(data.user)
        } else {
          // Redirect to home if not authenticated
          router.push('/')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/')
      }
    }
    
    checkAuth()
    fetchPosts()
  }, [])
  
  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      } else {
        console.error('Failed to fetch posts')
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.profile-menu-container')) {
        setShowProfileMenu(false)
      }
    }
    
    if (showProfileMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showProfileMenu])
  
  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1
        }
      }
      return post
    }))
  }
  
  const handleSave = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          saved: !post.saved
        }
      }
      return post
    }))
  }
  
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
  
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="sticky top-0 bg-dark-bg z-10 px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-display text-text-primary">Discover</h1>
          
          {/* Profile Button */}
          <div className="relative profile-menu-container">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-12 h-12 bg-brand-yellow rounded-avatar flex items-center justify-center overflow-hidden"
            >
              {user?.photoUrl ? (
                <>
                  <img 
                    src={user.photoUrl} 
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const span = e.currentTarget.parentElement?.querySelector('span');
                      if (span) span.classList.remove('hidden');
                    }}
                  />
                </>
              ) : null}
              <span className={`${user?.photoUrl ? 'hidden' : 'flex items-center justify-center w-full h-full'} ${user?.firstName ? 'text-black font-semibold text-2xl' : 'text-xl'}`}>
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : (user ? 'U' : '👤')}
              </span>
            </button>
            
            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-14 bg-dark-surface rounded-xl shadow-lg py-2 w-48">
                <div className="px-4 py-2 border-b border-dark-border">
                  <p className="text-text-primary font-medium">{user?.displayName}</p>
                  {user?.username && (
                    <p className="text-text-secondary text-sm">@{user.username}</p>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-text-primary hover:bg-dark-border transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
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
      
      {/* Posts */}
      <div className="px-5 pb-20 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-text-secondary">Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">No posts yet. Be the first to share!</p>
            <button
              onClick={() => router.push('/create')}
              className="px-6 py-3 bg-brand-yellow text-black rounded-button font-semibold hover:scale-[1.02] btn-transition"
            >
              Share Something
            </button>
          </div>
        ) : (
          posts.map((post) => (
          <div key={post.id} className="mb-8">
            {/* Post Header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-dark-surface rounded-avatar flex items-center justify-center overflow-hidden">
                {post.user.avatar ? (
                  <img 
                    src={post.user.avatar} 
                    alt={post.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">{post.user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-body-lg font-semibold text-text-primary">{post.user.name}</div>
                <div className="text-meta text-text-muted flex items-center gap-2">
                  <span>{post.ageRange} ·</span>
                  <span className="flex items-center gap-1">
                    <span className="text-text-secondary">{post.category?.emoji} {post.category?.name}</span>
                  </span>
                </div>
              </div>
            </div>
            
            {/* Post Content */}
            <h2 className="text-title-lg text-text-primary mb-4">{post.title}</h2>
            <p className="text-body text-gray-300 mb-4 leading-relaxed">{post.description}</p>
            
            {/* Post Media Content */}
            {post.linkUrl && isYouTubeUrl(post.linkUrl) ? (
              <div className="mb-6">
                <YouTubePlayer url={post.linkUrl} title={post.title} />
              </div>
            ) : post.linkUrl ? (
              <a 
                href={post.linkUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-dark-surface rounded-card p-4 mb-6 border border-dark-border hover:border-brand-yellow transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary flex-shrink-0">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  <span className="text-text-primary text-body truncate">{post.linkUrl}</span>
                </div>
              </a>
            ) : (
              <div className="bg-dark-surface rounded-card h-64 mb-6 flex items-center justify-center overflow-hidden">
                <span className="text-text-secondary">Content Preview</span>
              </div>
            )}
            
            {/* Post Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-button font-semibold text-body btn-transition ${
                  post.liked ? 'bg-brand-yellow text-black' : 'bg-transparent text-text-primary border border-dark-border hover:bg-white/5'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={post.liked ? '#E91E63' : 'none'} stroke={post.liked ? '#E91E63' : 'currentColor'} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>{post.likes}</span>
              </button>
              
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-button font-semibold text-body bg-transparent text-text-primary border border-dark-border hover:bg-white/5 btn-transition">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                <span>{post.comments}</span>
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
      
      {/* Floating Action Button */}
      <button
        onClick={() => router.push('/create')}
        className="fixed bottom-8 right-6 w-16 h-16 bg-brand-yellow rounded-fab flex items-center justify-center shadow-xl shadow-brand-yellow/40 text-black text-4xl font-light hover:scale-110 hover:shadow-2xl hover:shadow-brand-yellow/60 active:scale-95 btn-transition z-50"
      >
        +
      </button>
    </div>
  )
}