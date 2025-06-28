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

const categories = ['All', 'Apps', 'Toys', 'Books', 'Activities', 'Tips']

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
  const [posts, setPosts] = useState(mockPosts)
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
  }, [])
  
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
      <div className="sticky top-0 bg-dark-bg z-10 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">Discover</h1>
          
          {/* Profile Button */}
          <div className="relative profile-menu-container">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-12 h-12 bg-brand-yellow rounded-avatar flex items-center justify-center overflow-hidden"
            >
              {user?.photoUrl ? (
                <img 
                  src={user.photoUrl} 
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <span className={`text-xl ${user?.photoUrl ? 'hidden' : ''} ${!user?.photoUrl && user?.firstName ? 'text-black font-semibold' : ''}`}>
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : '👤'}
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
        
        {/* Search Bar */}
        <div className="bg-dark-surface rounded-xl px-4 py-3 mb-4">
          <input
            type="text"
            placeholder="Search tips, toys, apps..."
            className="w-full bg-transparent text-white placeholder-gray-500 outline-none"
          />
        </div>
        
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-brand-green text-black font-medium'
                  : 'bg-dark-surface text-gray-400'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Posts */}
      <div className="px-4 pb-20">
        {posts.map((post) => (
          <div key={post.id} className="bg-dark-surface rounded-2xl p-4 mb-4">
            {/* Post Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center text-2xl">
                {post.user.avatar}
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">{post.user.name}</div>
                <div className="text-sm text-gray-400">
                  {post.timeAgo} • {post.ageRange}
                </div>
              </div>
            </div>
            
            {/* Post Content */}
            <h3 className="text-lg font-medium text-white mb-2">{post.title}</h3>
            <p className="text-gray-400 mb-3">{post.description}</p>
            
            {/* Post Image Placeholder */}
            <div className="bg-dark-border rounded-xl h-48 mb-4"></div>
            
            {/* Post Actions */}
            <div className="flex items-center gap-4 pt-3 border-t border-dark-border">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-2 ${
                  post.liked ? 'text-brand-green' : 'text-gray-400'
                }`}
              >
                <span className="text-xl">{post.liked ? '💚' : '🤍'}</span>
                <span>{post.likes}</span>
              </button>
              
              <button className="flex items-center gap-2 text-gray-400">
                <span className="text-xl">💬</span>
                <span>{post.comments} comments</span>
              </button>
              
              <button
                onClick={() => handleSave(post.id)}
                className={`ml-auto ${
                  post.saved ? 'text-brand-green' : 'text-gray-400'
                }`}
              >
                <span className="text-xl">{post.saved ? '⭐' : '☆'}</span>
                <span className="ml-1">Save</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Floating Action Button */}
      <button
        onClick={() => router.push('/create')}
        className="fixed bottom-24 right-4 w-14 h-14 bg-brand-green rounded-2xl flex items-center justify-center shadow-lg text-black text-2xl font-light"
      >
        +
      </button>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border">
        <div className="flex justify-around items-center h-16 pb-safe">
          <button className="flex flex-col items-center gap-1 text-brand-green">
            <div className="w-6 h-6 bg-current rounded"></div>
            <span className="text-xs">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-6 h-6 bg-current rounded"></div>
            <span className="text-xs">Search</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-6 h-6 bg-current rounded"></div>
            <span className="text-xs">Saved</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-6 h-6 bg-current rounded"></div>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  )
}