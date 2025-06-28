'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const categories = [
  { id: 'app', name: 'Apps & Software', emoji: '📱' },
  { id: 'toy', name: 'Toys & Games', emoji: '🧸' },
  { id: 'book', name: 'Books', emoji: '📚' },
  { id: 'education', name: 'Educational Resources', emoji: '🎓' },
  { id: 'activity', name: 'Activities', emoji: '🎨' },
  { id: 'tip', name: 'Parenting Tips', emoji: '💡' }
]

const ageRanges = ['0-2', '3-5', '5-7', '6-8', '8+']

export default function CreatePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [selectedAges, setSelectedAges] = useState<string[]>([])
  const [link, setLink] = useState('')
  
  const handleAgeToggle = (age: string) => {
    setSelectedAges(prev =>
      prev.includes(age)
        ? prev.filter(a => a !== age)
        : [...prev, age]
    )
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const selectedCategory = categories.find(cat => cat.id === category)
      if (!selectedCategory) return
      
      const postData = {
        title,
        description,
        category: selectedCategory.name,
        ageRanges: selectedAges,
        linkUrl: link
      }
      
      console.log('Sending post data:', postData)
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        if (response.status === 401) {
          // User not authenticated, redirect to login
          router.push('/login')
          return
        }
        console.error('Error creating post:', error)
        console.error('Full error details:', JSON.stringify(error, null, 2))
        alert(`Failed to create post: ${error.error || 'Unknown error'}${error.details ? `\n\nDetails: ${error.details}` : ''}${error.hint ? `\n\nHint: ${error.hint}` : ''}`)
        return
      }
      
      const data = await response.json()
      console.log('Post created successfully:', data)
      router.push('/feed')
    } catch (error) {
      console.error('Error submitting post:', error)
      alert('Failed to create post. Please try again.')
    }
  }
  
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="sticky top-0 bg-dark-bg z-10 px-5 py-5 border-b border-dark-border">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-text-muted hover:text-text-primary btn-transition"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <h1 className="text-title text-text-primary">Share what's working</h1>
          <button
            onClick={handleSubmit}
            className="text-brand-yellow font-semibold hover:opacity-80 btn-transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!title || !category || selectedAges.length === 0}
          >
            Share
          </button>
        </div>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What made parenting easier today?"
            className="w-full bg-dark-bg border border-dark-border rounded-input px-4 py-3 text-text-primary text-body placeholder-text-secondary outline-none focus:border-brand-yellow transition-colors"
          />
        </div>
        
        {/* Description */}
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell other parents about your experience..."
            rows={4}
            className="w-full bg-dark-bg border border-dark-border rounded-input px-4 py-3 text-text-primary text-body placeholder-text-secondary outline-none focus:border-brand-yellow transition-colors resize-none"
          />
        </div>
        
        {/* Category and Age in one row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-meta font-medium text-text-secondary mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-input px-4 py-3 text-text-primary text-body outline-none focus:border-brand-yellow transition-colors"
            >
              <option value="">Select...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>
        
          <div>
            <label className="block text-meta font-medium text-text-secondary mb-2">
              Age Range
            </label>
            <select
              value={selectedAges[0] || ''}
              onChange={(e) => setSelectedAges(e.target.value ? [e.target.value] : [])}
              className="w-full bg-dark-bg border border-dark-border rounded-input px-4 py-3 text-text-primary text-body outline-none focus:border-brand-yellow transition-colors"
            >
              <option value="">Select...</option>
              {ageRanges.map((age) => (
                <option key={age} value={age}>
                  Ages {age}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Link URL */}
        <div>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link to product, app store, or website (optional)"
            className="w-full bg-dark-bg border border-dark-border rounded-input px-4 py-3 text-text-primary text-body placeholder-text-secondary outline-none focus:border-brand-yellow transition-colors"
          />
        </div>
        
        {/* Form Actions */}
        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 rounded-button font-semibold text-body bg-transparent text-text-primary border border-dark-border hover:bg-white/5 btn-transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title || !category || selectedAges.length === 0}
            className="flex-1 px-6 py-3 rounded-button font-semibold text-body bg-brand-yellow text-black hover:scale-[1.02] btn-transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Share
          </button>
        </div>
      </form>
    </div>
  )
}