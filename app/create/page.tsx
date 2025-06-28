'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { YouTubePreview } from '@/components/YouTubePreview'
import { isYouTubeUrl } from '@/utils/youtube'

const categories = [
  { id: 'app', name: 'App', emoji: '📱' },
  { id: 'toy', name: 'Toy', emoji: '🧸' },
  { id: 'video', name: 'Video', emoji: '🎥' },
  { id: 'website', name: 'Website', emoji: '🌐' },
  { id: 'tip', name: 'Tip', emoji: '💡' }
]

const ageRanges = ['0-2', '3-5', '5-7', '6-8', '8+']

export default function CreatePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [selectedAges, setSelectedAges] = useState<string[]>([])
  const [link, setLink] = useState('')
  const [inputMode, setInputMode] = useState<'manual' | 'voice'>('manual')
  const [isRecording, setIsRecording] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
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
          <h2 className="text-title text-text-primary">Share what's working</h2>
          <button
            onClick={() => router.back()}
            className="text-text-muted hover:text-text-primary btn-transition"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Input Mode Toggle */}
      <div className="flex gap-2.5 px-5 py-4 bg-black border-b border-dark-border">
        <button
          onClick={() => setInputMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-input font-medium text-body transition-all ${
            inputMode === 'manual'
              ? 'bg-brand-yellow text-black'
              : 'bg-transparent text-text-secondary border border-dark-border hover:border-text-muted'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Write
        </button>
        <button
          onClick={() => setInputMode('voice')}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-input font-medium text-body transition-all ${
            inputMode === 'voice'
              ? 'bg-brand-yellow text-black'
              : 'bg-transparent text-text-secondary border border-dark-border hover:border-text-muted'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
          Speak with AI
        </button>
      </div>
      
      {/* Form */}
      {inputMode === 'manual' ? (
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Link URL - Moved to top */}
          <div className="relative">
            {link && isYouTubeUrl(link) ? (
              <YouTubePreview 
                url={link} 
                onRemove={() => setLink('')} 
              />
            ) : (
              <div className="relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Paste link to app, video, or website"
                  className="w-full bg-black border border-dark-border rounded-input pl-12 pr-4 py-3 text-text-primary text-body placeholder-text-muted outline-none focus:border-brand-yellow transition-colors"
                />
              </div>
            )}
          </div>
          
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What made parenting easier today?"
              className="w-full bg-black border border-dark-border rounded-input px-4 py-3 text-text-primary text-body placeholder-text-muted outline-none focus:border-brand-yellow transition-colors"
              required
            />
          </div>
          
          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell other parents about your experience..."
              rows={4}
              className="w-full bg-black border border-dark-border rounded-input px-4 py-3 text-text-primary text-body placeholder-text-muted outline-none focus:border-brand-yellow transition-colors resize-none"
            />
          </div>
          
          {/* Add Photo Button */}
          <div>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 px-5 py-5 rounded-input border-2 border-dashed border-dark-border text-text-muted hover:border-text-secondary hover:text-text-secondary transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              Add photo
            </button>
          </div>
          
          {/* Category and Age in one row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black border border-dark-border rounded-input px-4 py-3 text-text-primary text-body outline-none focus:border-brand-yellow transition-colors"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Age Range
              </label>
              <select
                value={selectedAges[0] || ''}
                onChange={(e) => setSelectedAges(e.target.value ? [e.target.value] : [])}
                className="w-full bg-black border border-dark-border rounded-input px-4 py-3 text-text-primary text-body outline-none focus:border-brand-yellow transition-colors"
                required
              >
                <option value="">Select age</option>
                {ageRanges.map((age) => (
                  <option key={age} value={age}>
                    Ages {age}
                  </option>
                ))}
              </select>
            </div>
          </div>
        
          {/* Form Actions */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3.5 rounded-button font-semibold text-body bg-transparent text-text-primary border border-dark-border hover:bg-white/5 btn-transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title || !category || selectedAges.length === 0}
              className="flex-1 px-6 py-3.5 rounded-button font-semibold text-body bg-brand-yellow text-black hover:bg-[#f5e147] hover:scale-[1.02] btn-transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Share
            </button>
          </div>
        </form>
      ) : (
        /* Voice Input Interface */
        <div className="p-5">
          <div className="text-center py-10">
            <div className="relative inline-block mb-5">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-brand-yellow hover:scale-105'
                }`}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className={isRecording ? 'text-white' : 'text-black'}>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2"></line>
                  <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2"></line>
                </svg>
              </button>
              {isRecording && (
                <div className="absolute inset-0 w-24 h-24 border-3 border-brand-yellow rounded-full animate-ping"></div>
              )}
            </div>
            <p className="text-text-muted text-body">
              {isRecording ? 'Listening...' : 'Tap to start speaking'}
            </p>
          </div>
          
          {/* Voice Actions */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3.5 rounded-button font-semibold text-body bg-transparent text-text-primary border border-dark-border hover:bg-white/5 btn-transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {}}
              disabled={!voiceTranscript}
              className="flex-1 px-6 py-3.5 rounded-button font-semibold text-body bg-brand-yellow text-black hover:bg-[#f5e147] hover:scale-[1.02] btn-transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  )
}