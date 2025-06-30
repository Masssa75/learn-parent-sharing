'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { YouTubePreview } from '@/components/YouTubePreview'
import { isYouTubeUrl } from '@/utils/youtube'

const categories = [
  { id: 'apps', name: 'Apps & Software', emoji: '📱' },
  { id: 'toys', name: 'Toys & Games', emoji: '🧸' },
  { id: 'books', name: 'Books', emoji: '📚' },
  { id: 'activities', name: 'Activities', emoji: '🎨' },
  { id: 'education', name: 'Educational Resources', emoji: '🎓' },
  { id: 'tips', name: 'Parenting Tips', emoji: '💡' }
]

const ageRanges = ['0-2', '3-5', '5-7', '6-8', '8+']

export default function CreatePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [selectedAges, setSelectedAges] = useState<string[]>([])
  const [link, setLink] = useState('')
  // Removed inputMode - recording is now integrated into the main form
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([])
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false)
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number | null>(null)
  
  const handleAgeToggle = (age: string) => {
    setSelectedAges(prev =>
      prev.includes(age)
        ? prev.filter(a => a !== age)
        : [...prev, age]
    )
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
      setImageUrl(result.url)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl('')
  }
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for webkitSpeechRecognition (Chrome) or SpeechRecognition (standard)
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = 'en-US'
        
        recognitionInstance.onresult = (event: any) => {
          let interim = ''
          let final = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              final += transcript + ' '
            } else {
              interim += transcript
            }
          }
          
          if (final) {
            // Append to description instead of separate transcript
            setDescription(prev => prev + (prev ? ' ' : '') + final)
            // Auto-resize textarea
            const textarea = document.querySelector('textarea') as HTMLTextAreaElement
            if (textarea) {
              textarea.style.height = 'auto'
              textarea.style.height = textarea.scrollHeight + 'px'
            }
          }
          setInterimTranscript(interim)
        }
        
        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          if (event.error === 'not-allowed') {
            alert('Microphone access was denied. Please allow microphone access and try again.')
            setIsRecording(false)
          } else if (event.error === 'no-speech') {
            // Ignore no-speech errors, they're common
            return
          } else if (event.error === 'network') {
            // Network errors are common, don't stop recording
            console.log('Network error, but continuing recording')
            return
          } else if (event.error === 'aborted') {
            // This is expected when we manually stop
            return
          } else {
            alert(`Speech recognition error: ${event.error}`)
            setIsRecording(false)
          }
        }
        
        recognitionInstance.onend = () => {
          // Don't automatically set isRecording to false
          // Let the toggle function handle it
          console.log('Recognition ended')
        }
        
        setRecognition(recognitionInstance)
      }
    }
  }, [])
  
  // Handle recording toggle
  const toggleRecording = async () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.')
      return
    }
    
    if (isRecording) {
      // Stop recording
      recognition.stop()
      setIsRecording(false)
      setInterimTranscript('')
    } else {
      try {
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true })
        
        setInterimTranscript('')
        recognition.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Microphone access error:', error)
        alert('Microphone access is required for voice recording. Please allow microphone access and try again.')
      }
    }
  }
  
  // Removed processWithAI and handleVoiceSubmit - no longer needed
  
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
        linkUrl: link,
        imageUrl: imageUrl
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
      router.push('/')
    } catch (error) {
      console.error('Error submitting post:', error)
      alert('Failed to create post. Please try again.')
    }
  }
  
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="sticky top-0 bg-dark-bg z-10 border-b border-dark-border">
        <div className="max-w-2xl mx-auto px-5 py-5">
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
      </div>
      
      
      {/* Form */}
        <div className="max-w-2xl mx-auto">
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
          
          {/* Description - Now the primary input with recording option */}
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                // Auto-resize textarea
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
                // Reset generated titles when description changes
                setGeneratedTitles([])
                setSelectedTitleIndex(null)
                setTitle('')
              }}
              placeholder="Describe your tip or what you learned today..."
              rows={5}
              className="w-full bg-black border border-dark-border rounded-input px-4 py-4 pr-14 text-text-primary text-lg placeholder-text-muted outline-none focus:border-brand-yellow transition-colors resize-y overflow-hidden"
              style={{ minHeight: '150px' }}
              required
            />
            {/* Recording button inside textarea */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`absolute bottom-3 right-3 p-2.5 rounded-full transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-dark-surface hover:bg-dark-border border border-dark-border'
              }`}
              title={isRecording ? 'Stop recording' : 'Record your tip'}
            >
              {isRecording ? (
                // Stop icon
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                // Microphone icon
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              )}
            </button>
            {/* Show interim transcript while recording */}
            {isRecording && interimTranscript && (
              <div className="absolute bottom-14 right-3 bg-dark-surface px-3 py-1 rounded-card text-sm text-text-muted italic max-w-xs">
                {interimTranscript}
              </div>
            )}
          </div>
          
          {/* Generate Title Button and Title Selection */}
          <div>
            {generatedTitles.length === 0 ? (
              <button
                type="button"
                onClick={async () => {
                  if (!description.trim()) {
                    alert('Please write a description first')
                    return
                  }
                  
                  setIsGeneratingTitles(true)
                  try {
                    const response = await fetch('/api/ai/generate-titles', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        description,
                        linkUrl: link,
                        category: categories.find(c => c.id === category)?.name
                      })
                    })
                    
                    if (!response.ok) {
                      throw new Error('Failed to generate titles')
                    }
                    
                    const data = await response.json()
                    setGeneratedTitles(data.titles)
                  } catch (error) {
                    console.error('Error generating titles:', error)
                    alert('Failed to generate titles. Please try again.')
                  } finally {
                    setIsGeneratingTitles(false)
                  }
                }}
                disabled={!description.trim() || isGeneratingTitles}
                className="w-full px-4 py-3 rounded-input font-medium text-body bg-dark-surface text-brand-yellow border border-brand-yellow hover:bg-brand-yellow hover:text-black btn-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGeneratingTitles ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Generating titles...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                      <path d="M2 17l10 5 10-5"></path>
                      <path d="M2 12l10 5 10-5"></path>
                    </svg>
                    Generate title for me
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-text-secondary text-sm mb-2">Select your favorite title:</p>
                {generatedTitles.map((generatedTitle, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setSelectedTitleIndex(index)
                      setTitle(generatedTitle)
                    }}
                    className={`w-full text-left px-4 py-3 rounded-input border transition-all ${
                      selectedTitleIndex === index
                        ? 'border-brand-yellow bg-brand-yellow/10 text-text-primary'
                        : 'border-dark-border bg-dark-surface text-text-secondary hover:border-text-muted hover:text-text-primary'
                    }`}
                  >
                    <span className="text-text-muted mr-2">{index + 1}.</span>
                    {generatedTitle}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedTitles([])
                    setSelectedTitleIndex(null)
                    setTitle('')
                  }}
                  className="text-text-muted hover:text-text-secondary text-sm underline"
                >
                  Generate new titles
                </button>
              </div>
            )}
          </div>
          
          {/* Image Upload Section */}
          <div>
            {imageUrl ? (
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt="Post image" 
                  className="w-full h-48 object-cover rounded-card mb-2"
                />
                <button
                  type="button"
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
                  id="imageUploadCreate"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <label 
                  htmlFor="imageUploadCreate" 
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
              disabled={!title || !description || !category || selectedAges.length === 0}
              className="flex-1 px-6 py-3.5 rounded-button font-semibold text-body bg-brand-yellow text-black hover:bg-[#f5e147] hover:scale-[1.02] btn-transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Share
            </button>
          </div>
        </form>
        </div>
    </div>
  )
}