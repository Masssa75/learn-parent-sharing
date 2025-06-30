'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { YouTubePlayer } from './YouTubePlayer'
import { PointsDisplay } from './PointsDisplay'

interface User {
  id: string
  telegramId: number
  username?: string
  firstName: string
  lastName?: string
  photoUrl?: string
  displayName: string
  isAdmin?: boolean
  points?: number
  totalXp?: number
  level?: number
  actionsRemaining?: number
}

interface Post {
  id: string
  title: string
  description?: string
  linkUrl?: string
  imageUrl?: string
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
  userId?: string
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
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<{ title: string; description: string; linkUrl: string; imageUrl: string }>({ title: '', description: '', linkUrl: '', imageUrl: '' })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null)
  const [floatingPoints, setFloatingPoints] = useState<{ [postId: string]: { points: number, key: number } }>({})
  const animationKeyRef = useRef(0)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    
    const handleFocus = () => {
      if (mounted) {
        checkAuth().then(() => {
          // Refetch posts after auth check on focus
          fetchPosts()
        })
      }
    }
    
    // First check auth, then fetch posts
    checkAuth().then(() => {
      if (mounted) {
        fetchPosts()
      }
    })
    
    // Check auth when window gets focus
    window.addEventListener('focus', handleFocus)
    
    return () => {
      mounted = false
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Refetch posts when authentication status changes
  useEffect(() => {
    // Only fetch if we have determined auth status (not still loading)
    if (!loading && user?.id) {
      console.log('Auth status changed, refetching posts with user:', user.id)
      fetchPosts()
    }
  }, [user?.id, loading])

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.post-menu')) {
        setOpenMenuPostId(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    // Auto-resize textarea when entering edit mode
    if (editingPostId) {
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder="Description"]') as HTMLTextAreaElement
        if (textarea) {
          textarea.style.height = 'auto'
          textarea.style.height = textarea.scrollHeight + 'px'
        }
      }, 100)
    }
  }, [editingPostId])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check-with-points', {
        credentials: 'include'
      })
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
      console.log('Fetching posts, authenticated:', isAuthenticated, 'user:', user?.id)
      const response = await fetch('/api/posts', {
        credentials: 'include' // Ensure cookies are sent
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`)
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setPosts(data)
      } else if (data && Array.isArray(data.posts)) {
        console.log(`Received ${data.posts.length} posts, first post liked status:`, data.posts[0]?.liked)
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
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
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
    
    // Check if already liked
    const post = posts.find(p => p.id === postId)
    if (post?.liked) {
      return // Already liked, do nothing
    }
    
    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          actionType: 'add_to_profile',
          targetType: 'post',
          targetId: postId
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        if (response.status === 429) {
          alert(`Rate limit exceeded. Please wait before taking more actions.`)
        } else if (response.status === 409) {
          // Post already liked - update UI to reflect this
          setPosts(posts.map(post => 
            post.id === postId ? { ...post, liked: true } : post
          ))
          return
        } else {
          throw new Error(error.message || 'Failed to like post')
        }
        return
      }
      
      const result = await response.json()
      
      // Add floating animation
      const key = animationKeyRef.current++
      setFloatingPoints(prev => ({
        ...prev,
        [postId]: { points: 5, key }
      }))
      
      // Remove animation after 2 seconds
      setTimeout(() => {
        setFloatingPoints(prev => {
          const newState = { ...prev }
          if (newState[postId]?.key === key) {
            delete newState[postId]
          }
          return newState
        })
      }, 2000)
      
      // Update user points in state
      if (result.user && user) {
        setUser({
          ...user,
          points: result.user.points,
          totalXp: result.user.total_xp,
          level: result.user.level,
          actionsRemaining: result.remaining_actions
        })
      }
      
      // Update the post's liked state
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, liked: true, likes: post.likes + 1 } : post
      ))
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleSave = async (postId: string) => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    // Check if already saved
    const post = posts.find(p => p.id === postId)
    if (post?.saved) {
      return // Already saved, do nothing
    }
    
    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'add_to_watchlist',
          targetType: 'post',
          targetId: postId
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        if (response.status === 429) {
          alert(`Rate limit exceeded. Please wait before taking more actions.`)
        } else if (response.status === 409) {
          // Post already saved - update UI to reflect this
          setPosts(posts.map(post => 
            post.id === postId ? { ...post, saved: true } : post
          ))
          return
        } else {
          throw new Error(error.message || 'Failed to save post')
        }
        return
      }
      
      const result = await response.json()
      
      // Add floating animation for save
      const key = animationKeyRef.current++
      setFloatingPoints(prev => ({
        ...prev,
        [`${postId}-save`]: { points: 3, key }
      }))
      
      // Remove animation after 2 seconds
      setTimeout(() => {
        setFloatingPoints(prev => {
          const newState = { ...prev }
          if (newState[`${postId}-save`]?.key === key) {
            delete newState[`${postId}-save`]
          }
          return newState
        })
      }, 2000)
      
      // Update user points in state
      if (result.user && user) {
        setUser({
          ...user,
          points: result.user.points,
          totalXp: result.user.total_xp,
          level: result.user.level,
          actionsRemaining: result.remaining_actions
        })
      }
      
      // Update the post's saved state
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, saved: true } : post
      ))
    } catch (error) {
      console.error('Error saving post:', error)
    }
  }

  const handleReport = async (postId: string) => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    if (!confirm('Are you sure you want to report this post? This will cost you 2 points.')) {
      return
    }
    
    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          actionType: 'flag',
          targetType: 'post',
          targetId: postId
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        if (response.status === 429) {
          alert(`Rate limit exceeded. Please wait before taking more actions.`)
        } else {
          throw new Error(error.message || 'Failed to report post')
        }
        return
      }
      
      const result = await response.json()
      
      // Update user points in state (will lose 2 points)
      if (result.user && user) {
        setUser({
          ...user,
          points: result.user.points,
          totalXp: result.user.total_xp,
          level: result.user.level,
          actionsRemaining: result.remaining_actions
        })
      }
      
      alert('Post reported. Thank you for helping keep the community safe.')
    } catch (error) {
      console.error('Error reporting post:', error)
      alert('Failed to report post. Please try again.')
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      // Remove the post from the local state
      setPosts(posts.filter(post => post.id !== postId))
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post. Please try again.')
    }
  }

  const handleEdit = (post: Post) => {
    setEditingPostId(post.id)
    setEditFormData({
      title: post.title,
      description: post.description || '',
      linkUrl: post.linkUrl || '',
      imageUrl: post.imageUrl || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingPostId(null)
    setEditFormData({ title: '', description: '', linkUrl: '', imageUrl: '' })
    setUploadingImage(false)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB')
      return
    }

    setUploadingImage(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }
      
      const result = await response.json()
      setEditFormData({ ...editFormData, imageUrl: result.url })
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setEditFormData({ ...editFormData, imageUrl: '' })
  }


  const handleSaveEdit = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update post')
      }

      // Update the post in local state
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            title: editFormData.title,
            description: editFormData.description,
            linkUrl: editFormData.linkUrl,
            imageUrl: editFormData.imageUrl
          }
        }
        return post
      }))

      // Clear edit mode
      setEditingPostId(null)
      setEditFormData({ title: '', description: '', linkUrl: '', imageUrl: '' })
      setUploadingImage(false)
    } catch (error) {
      console.error('Error updating post:', error)
      alert(error instanceof Error ? error.message : 'Failed to update post. Please try again.')
    }
  }

  const getLinkPreview = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
    }
  }

  const togglePostExpansion = (postId: string) => {
    const newExpanded = new Set(expandedPosts)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedPosts(newExpanded)
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/login')}
                className="bg-brand-yellow/20 border border-brand-yellow text-brand-yellow rounded-button px-4 py-2 text-sm font-semibold uppercase tracking-wider hover:bg-brand-yellow/30 transition-all cursor-pointer"
              >
                CLAIM +100
              </button>
              <Link 
                href="/login"
                className="px-6 py-3 bg-brand-yellow text-black rounded-button font-semibold hover:scale-105 btn-transition"
              >
                SIGN IN
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-12 h-12 bg-brand-yellow rounded-avatar flex items-center justify-center overflow-hidden relative group"
                title={user?.displayName || 'Profile'}
              >
                {user?.photoUrl && (
                  <img 
                    src={user.photoUrl} 
                    alt={user.displayName}
                    className="w-full h-full object-cover absolute inset-0"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement
                      img.style.display = 'none'
                    }}
                    onLoad={(e) => {
                      const img = e.currentTarget as HTMLImageElement
                      // Hide image if it didn't load properly
                      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                        img.style.display = 'none'
                      }
                    }}
                  />
                )}
                <span 
                  className={`${user?.firstName ? 'text-black font-semibold text-2xl' : 'text-xl'} flex items-center justify-center w-full h-full`}
                >
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

      {/* Points Display */}
      {isAuthenticated && user && (
        <div className="max-w-2xl mx-auto px-5">
          <PointsDisplay 
            points={user.points || 0}
            xp={user.totalXp || 0}
            level={user.level || 1}
            actionsRemaining={user.actionsRemaining || 0}
          />
        </div>
      )}

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
              {/* Post Content */}
              {editingPostId === post.id ? (
                <div className="mb-4">
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-input text-text-primary mb-3 focus:outline-none focus:border-brand-yellow"
                    placeholder="Title"
                  />
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, description: e.target.value })
                      // Auto-resize textarea
                      e.target.style.height = 'auto'
                      e.target.style.height = e.target.scrollHeight + 'px'
                    }}
                    className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-input text-text-primary mb-3 focus:outline-none focus:border-brand-yellow resize-y overflow-hidden"
                    placeholder="Description"
                    rows={3}
                    style={{ minHeight: '100px' }}
                  />
                  <input
                    type="text"
                    value={editFormData.linkUrl}
                    onChange={(e) => setEditFormData({ ...editFormData, linkUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-input text-text-primary mb-3 focus:outline-none focus:border-brand-yellow"
                    placeholder="Link URL (optional)"
                  />

                  {/* Image Upload Section */}
                  <div className="mb-3">
                    {editFormData.imageUrl ? (
                      <div className="relative">
                        <img 
                          src={editFormData.imageUrl} 
                          alt="Post image" 
                          className="w-full h-48 object-cover rounded-card mb-2"
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-dark-border rounded-card p-4 text-center">
                        <input
                          type="file"
                          id="imageUpload"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        <label 
                          htmlFor="imageUpload" 
                          className={`cursor-pointer ${uploadingImage ? 'opacity-50' : ''}`}
                        >
                          {uploadingImage ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-yellow"></div>
                              <span className="text-text-muted">Uploading...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span className="text-text-muted text-sm">Click to add image</span>
                              <span className="text-text-muted text-xs">JPEG, PNG, GIF, WebP up to 5MB</span>
                            </div>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                  
                </div>
              ) : (
                <>
                  <h2 className="text-4xl text-text-primary mb-4 font-semibold">{post.title}</h2>
                  {post.description && (
                    <div className="mb-4">
                      <p className={`text-body text-gray-300 leading-relaxed ${
                        !expandedPosts.has(post.id) ? 'line-clamp-2' : ''
                      }`}>
                        {post.description}
                      </p>
                      {post.description.length > 150 && (
                        <button
                          onClick={() => togglePostExpansion(post.id)}
                          className="text-text-muted hover:text-text-secondary text-sm mt-1"
                        >
                          {expandedPosts.has(post.id) ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
              
              {/* Post Image */}
              {post.imageUrl && (
                <div className="mb-6">
                  <img 
                    src={post.imageUrl} 
                    alt={post.title}
                    className="w-full h-auto rounded-card"
                  />
                </div>
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
              
              {/* Single line with user and actions */}
              <div className="flex items-center justify-between text-sm text-text-muted mb-4">
                <span className="text-text-secondary">{post.user?.name || 'Anonymous'}</span>
                
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`relative flex items-center gap-1.5 transition-colors ${
                      post.liked ? 'text-brand-yellow' : 'text-text-muted hover:text-text-secondary'
                    }`}
                    disabled={post.liked}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span>{post.likes > 0 ? post.likes : 'Like'}</span>
                    
                    {/* Floating +5 animation */}
                    {floatingPoints[post.id] && (
                      <span
                        className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-brand-yellow animate-float-up pointer-events-none"
                        style={{
                          animationDuration: '2s',
                          animationFillMode: 'forwards'
                        }}
                      >
                        +{floatingPoints[post.id].points}
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {/* TODO: Implement comment */}}
                    className="flex items-center gap-1.5 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    <span>{post.comments > 0 ? post.comments : 'Comment'}</span>
                  </button>
                  
                  <button
                    onClick={() => handleSave(post.id)}
                    className={`relative flex items-center gap-1.5 transition-colors ${
                      post.saved ? 'text-brand-yellow' : 'text-text-muted hover:text-text-secondary'
                    }`}
                    disabled={post.saved}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                      <polyline points="16 6 12 2 8 6"/>
                      <line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                    <span>Share</span>
                    
                    {/* Floating +3 animation */}
                    {floatingPoints[`${post.id}-save`] && (
                      <span
                        className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-brand-yellow animate-float-up pointer-events-none"
                        style={{
                          animationDuration: '2s',
                          animationFillMode: 'forwards'
                        }}
                      >
                        +{floatingPoints[`${post.id}-save`].points}
                      </span>
                    )}
                  </button>
                  
                  {/* 3-dot menu */}
                  <div className="relative post-menu">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)
                      }}
                      className="p-1 -m-1 hover:bg-white/5 rounded-full transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                      </svg>
                    </button>
                    
                    {openMenuPostId === post.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-dark-surface rounded-card shadow-lg py-2 border border-dark-border z-10">
                        {user && (post.userId === user.id || user.isAdmin) && (
                          <button
                            onClick={() => {
                              handleEdit(post)
                              setOpenMenuPostId(null)
                            }}
                            className="w-full text-left px-4 py-2 text-text-primary hover:bg-white/5 flex items-center gap-3"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit post
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // TODO: Copy link functionality
                            alert('Link copied!')
                            setOpenMenuPostId(null)
                          }}
                          className="w-full text-left px-4 py-2 text-text-primary hover:bg-white/5 flex items-center gap-3"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                          Copy link
                        </button>
                        <button
                          onClick={() => {
                            handleReport(post.id)
                            setOpenMenuPostId(null)
                          }}
                          className="w-full text-left px-4 py-2 text-text-primary hover:bg-white/5 flex items-center gap-3"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                            <line x1="4" y1="22" x2="4" y2="15"></line>
                          </svg>
                          Report
                        </button>
                        {user?.isAdmin && (
                          <>
                            <div className="border-t border-dark-border my-2"></div>
                            <button
                              onClick={() => {
                                handleDelete(post.id)
                                setOpenMenuPostId(null)
                              }}
                              className="w-full text-left px-4 py-2 text-red-500 hover:bg-white/5 flex items-center gap-3"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                              Delete post
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Edit mode actions */}
              {editingPostId === post.id && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleSaveEdit(post.id)}
                    className="px-5 py-2.5 bg-brand-yellow text-black rounded-button font-semibold hover:scale-105 btn-transition"
                  >
                    SAVE
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-5 py-2.5 bg-transparent text-text-primary border border-dark-border rounded-button font-semibold hover:bg-white/5 btn-transition"
                  >
                    CANCEL
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      {isAuthenticated && (
        <Link
          href="/create"
          className="fixed bottom-8 right-6 w-16 h-16 bg-brand-yellow rounded-fab flex items-center justify-center shadow-xl shadow-brand-yellow/40 text-black text-4xl font-light hover:scale-110 hover:shadow-2xl hover:shadow-brand-yellow/60 active:scale-95 btn-transition z-50"
        >
          +
        </Link>
      )}
    </div>
  )
}