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

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [posts, setPosts] = useState(mockPosts)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        const data = await response.json()
        setIsAuthenticated(data.authenticated)
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
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
      <div className="sticky top-0 bg-dark-bg z-10 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">Learn</h1>
          {!isAuthenticated ? (
            <Link 
              href="/login"
              className="px-4 py-2 bg-brand-green text-black rounded-xl font-medium hover:opacity-90 transition"
            >
              Sign In
            </Link>
          ) : (
            <Link 
              href="/feed"
              className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center"
            >
              <span className="text-xl">👤</span>
            </Link>
          )}
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
            <div className="bg-dark-border rounded-xl h-48 mb-4 flex items-center justify-center">
              <span className="text-gray-600">Image Preview</span>
            </div>
            
            {/* Post Actions */}
            <div className="flex items-center gap-4 pt-3 border-t border-dark-border">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-2 transition-colors ${
                  post.liked ? 'text-brand-green' : 'text-gray-400'
                } hover:text-brand-green`}
              >
                <span className="text-xl">{post.liked ? '💚' : '🤍'}</span>
                <span>{post.likes}</span>
              </button>
              
              <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <span className="text-xl">💬</span>
                <span>{post.comments}</span>
              </button>
              
              <button
                onClick={() => handleSave(post.id)}
                className={`ml-auto flex items-center gap-1 transition-colors ${
                  post.saved ? 'text-brand-green' : 'text-gray-400'
                } hover:text-brand-green`}
              >
                <span className="text-xl">{post.saved ? '⭐' : '☆'}</span>
                <span>Save</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Floating Action Button or Call to Action */}
      {isAuthenticated ? (
        <button
          onClick={handleCreatePost}
          className="fixed bottom-4 right-4 w-14 h-14 bg-brand-green rounded-2xl flex items-center justify-center shadow-lg text-black text-2xl font-light hover:scale-105 transition-transform"
        >
          +
        </button>
      ) : (
        <div className="fixed bottom-4 left-4 right-4 bg-dark-surface rounded-2xl p-4 border border-brand-green/20">
          <p className="text-white font-medium mb-2">Join the community!</p>
          <p className="text-gray-400 text-sm mb-3">Sign in to share your discoveries and connect with other parents.</p>
          <Link 
            href="/login"
            className="block w-full bg-brand-green text-black rounded-xl py-3 text-center font-medium hover:opacity-90 transition"
          >
            Sign in with Telegram
          </Link>
        </div>
      )}
    </div>
  )
}