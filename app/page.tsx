'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Post {
  id: string
  user: {
    name: string
    avatar: string
  }
  timeAgo: string
  ageRange: string
  title: string
  description: string
  likes: number
  comments: number
  liked?: boolean
  saved?: boolean
}

const mockPosts: Post[] = [
  {
    id: '1',
    user: {
      name: 'Sarah Johnson',
      avatar: '🟢'
    },
    timeAgo: '2 hours ago',
    ageRange: 'Ages 5-7',
    title: 'Amazing Math App for Kids!',
    description: 'Just discovered Khan Academy Kids - my 6yo loves it! Free app with fun math games and rewards system.',
    likes: 42,
    comments: 18,
    liked: false,
    saved: false
  },
  {
    id: '2',
    user: {
      name: 'Mike Chen',
      avatar: '🔴'
    },
    timeAgo: '5 hours ago',
    ageRange: 'Ages 0-2',
    title: 'Best Teething Toy Ever',
    description: 'Sophie the Giraffe saved our nights! Natural rubber, safe for babies. Worth every penny.',
    likes: 28,
    comments: 12,
    liked: true,
    saved: false
  },
  {
    id: '3',
    user: {
      name: 'Lisa Park',
      avatar: '🔵'
    },
    timeAgo: '8 hours ago',
    ageRange: 'Ages 3-5',
    title: 'Mess-Free Art Activities',
    description: 'Window markers are a game changer! Kids can draw on windows and it wipes off easily.',
    likes: 67,
    comments: 23,
    liked: false,
    saved: true
  }
]

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

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [posts, setPosts] = useState(mockPosts)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        const data = await response.json()
        setIsAuthenticated(data.authenticated)
        if (data.authenticated && data.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
        setUser(null)
      }
    }
    
    checkAuth()
    
    // Check again when window gets focus (in case they logged in in another tab)
    window.addEventListener('focus', checkAuth)
    return () => window.removeEventListener('focus', checkAuth)
  }, [])
  
  const handleLike = (postId: string) => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
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
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
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
  
  const handleCreatePost = () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    router.push('/create')
  }
  
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="sticky top-0 bg-dark-bg z-10 px-5 pt-6 pb-4">
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
            <Link 
              href="/feed"
              className="w-12 h-12 bg-brand-yellow rounded-avatar flex items-center justify-center overflow-hidden relative group"
              title={user?.displayName || 'Profile'}
            >
              {user?.photoUrl ? (
                <>
                  <img 
                    src={user.photoUrl} 
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = 'none'
                      const span = e.currentTarget.parentElement?.querySelector('span');
                      if (span) span.classList.remove('hidden');
                    }}
                  />
                </>
              ) : null}
              <span className={`${user?.photoUrl ? 'hidden' : ''} ${!user?.photoUrl && user?.firstName ? 'text-black font-semibold text-2xl' : 'text-xl'}`}>
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : '👤'}
              </span>
              {/* Optional: Show name on hover */}
              {user?.displayName && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-dark-surface text-text-primary text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {user.displayName}
                </div>
              )}
            </Link>
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
      
      {/* Posts */}
      <div className="px-5 pb-20 custom-scrollbar">
        {posts.map((post) => (
          <div key={post.id} className="mb-8">
            {/* Post Header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-dark-surface rounded-avatar flex items-center justify-center text-2xl">
                {post.user.avatar}
              </div>
              <div className="flex-1">
                <div className="text-body-lg font-semibold text-text-primary">{post.user.name}</div>
                <div className="text-meta text-text-muted flex items-center gap-2">
                  <span>{post.timeAgo} · {post.ageRange} ·</span>
                  <span className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12" y2="18"></line>
                    </svg>
                    <span className="text-text-secondary">App</span>
                  </span>
                </div>
              </div>
            </div>
            
            {/* Post Content */}
            <h2 className="text-title-lg text-text-primary mb-4">{post.title}</h2>
            <p className="text-body text-gray-300 mb-4 leading-relaxed">{post.description}</p>
            
            {/* Post Image Placeholder */}
            <div className="bg-dark-surface rounded-card h-64 mb-6 flex items-center justify-center overflow-hidden">
              <span className="text-text-secondary">Content Preview</span>
            </div>
            
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
        ))}
      </div>
      
      {/* Floating Action Button or Call to Action */}
      {isAuthenticated ? (
        <button
          onClick={handleCreatePost}
          className="fixed bottom-8 right-6 w-16 h-16 bg-brand-yellow rounded-fab flex items-center justify-center shadow-xl shadow-brand-yellow/40 text-black text-4xl font-light hover:scale-110 hover:shadow-2xl hover:shadow-brand-yellow/60 active:scale-95 btn-transition z-50"
        >
          +
        </button>
      ) : (
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