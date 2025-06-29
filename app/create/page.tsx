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
  const [inputMode, setInputMode] = useState<'manual' | 'voice'>('manual') // Default to manual
  const [isRecording, setIsRecording] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [selectedImageStyle, setSelectedImageStyle] = useState<string>('photorealistic')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isManualStop, setIsManualStop] = useState(false)
  const [aiProcessedData, setAiProcessedData] = useState<{
    title: string
    description: string
    category: string
    ageRange: string
  } | null>(null)
  
  const handleAgeToggle = (age: string) => {
    setSelectedAges(prev =>
      prev.includes(age)
        ? prev.filter(a => a !== age)
        : [...prev, age]
    )
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
            setVoiceTranscript(prev => prev + final)
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
      setIsManualStop(true)
      recognition.stop()
      setIsRecording(false)
      
      // Process after a short delay to ensure transcript is finalized
      setTimeout(() => {
        setIsManualStop(false)
        if (voiceTranscript) {
          processWithAI()
        }
      }, 100)
    } else {
      try {
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true })
        
        setVoiceTranscript('')
        setInterimTranscript('')
        setIsManualStop(false)
        recognition.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Microphone access error:', error)
        alert('Microphone access is required for voice recording. Please allow microphone access and try again.')
      }
    }
  }
  
  // Process with Gemini AI
  const processWithAI = async () => {
    if (!voiceTranscript.trim()) {
      alert('No speech detected. Please try recording again.')
      return
    }
    
    setIsProcessing(true)
    setAiProcessedData(null) // Clear previous data
    
    try {
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: voiceTranscript,
          linkUrl: link || ''
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to process with AI')
      }
      
      const data = await response.json()
      
      // Ensure we have all required fields
      if (!data.title || !data.description || !data.category || !data.ageRange) {
        throw new Error('AI response missing required fields')
      }
      
      setAiProcessedData({
        title: data.title,
        description: data.description,
        category: data.category,
        ageRange: data.ageRange
      })
      
      // Set the form fields
      setTitle(data.title)
      setDescription(data.description)
      setCategory(data.category)
      setSelectedAges([data.ageRange])
      
    } catch (error) {
      console.error('AI processing error:', error)
      alert(`Failed to process with AI: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
      setVoiceTranscript('') // Clear transcript so user can try again
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Generate AI image
  const generateImage = async () => {
    if (!title || !description) {
      alert('Please add a title and description before generating an image')
      return
    }
    
    setIsGeneratingImage(true)
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          prompt: description,
          style: selectedImageStyle
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate image')
      }
      
      const data = await response.json()
      setImageUrl(data.imageUrl)
      
      if (data.temporary) {
        alert('Note: Generated image will expire in ~1 hour. Submit your post to save it permanently.')
      }
    } catch (error) {
      console.error('Image generation error:', error)
      alert(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGeneratingImage(false)
    }
  }
  
  // Handle voice submit
  const handleVoiceSubmit = async () => {
    if (!aiProcessedData || !link) return
    
    // Use the same submit logic as manual form
    handleSubmit(new Event('submit') as any)
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
        linkUrl: link,
        imageUrl: imageUrl || undefined
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
      
      {/* Input Mode Toggle */}
      <div className="bg-black border-b border-dark-border">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex gap-2.5">
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
        </div>
      </div>
      
      {/* Form */}
      {inputMode === 'manual' ? (
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
          
          {/* AI Image Generation */}
          <div className="space-y-3">
            {!imageUrl && (
              <>
                {/* Image Style Selector */}
                <div className="space-y-2">
                  <label className="text-text-secondary text-sm">Choose image style:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedImageStyle('photorealistic')}
                      className={`px-3 py-2 rounded-input text-sm font-medium transition-all ${
                        selectedImageStyle === 'photorealistic'
                          ? 'bg-brand-yellow text-black border-brand-yellow'
                          : 'bg-dark-surface border border-dark-border text-text-secondary hover:border-text-muted'
                      }`}
                    >
                      📷 Photorealistic
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageStyle('watercolor')}
                      className={`px-3 py-2 rounded-input text-sm font-medium transition-all ${
                        selectedImageStyle === 'watercolor'
                          ? 'bg-brand-yellow text-black border-brand-yellow'
                          : 'bg-dark-surface border border-dark-border text-text-secondary hover:border-text-muted'
                      }`}
                    >
                      🎨 Watercolor
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageStyle('minimalist')}
                      className={`px-3 py-2 rounded-input text-sm font-medium transition-all ${
                        selectedImageStyle === 'minimalist'
                          ? 'bg-brand-yellow text-black border-brand-yellow'
                          : 'bg-dark-surface border border-dark-border text-text-secondary hover:border-text-muted'
                      }`}
                    >
                      ⚪ Minimalist
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageStyle('sketch')}
                      className={`px-3 py-2 rounded-input text-sm font-medium transition-all ${
                        selectedImageStyle === 'sketch'
                          ? 'bg-brand-yellow text-black border-brand-yellow'
                          : 'bg-dark-surface border border-dark-border text-text-secondary hover:border-text-muted'
                      }`}
                    >
                      ✏️ Pencil Sketch
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageStyle('cartoon')}
                      className={`px-3 py-2 rounded-input text-sm font-medium transition-all ${
                        selectedImageStyle === 'cartoon'
                          ? 'bg-brand-yellow text-black border-brand-yellow'
                          : 'bg-dark-surface border border-dark-border text-text-secondary hover:border-text-muted'
                      }`}
                    >
                      🎭 Cartoon
                    </button>
                  </div>
                </div>

                {/* Generate Button */}
              <button
                type="button"
                onClick={generateImage}
                disabled={isGeneratingImage || !title || !description}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-dark-surface border border-dashed border-dark-border rounded-input text-text-secondary hover:border-brand-yellow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingImage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating image...</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span>Generate AI image (optional)</span>
                  </>
                )}
              </button>
              </>
            )}
            
            {imageUrl && (
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt="Generated image" 
                  className="w-full rounded-input border border-dark-border"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full hover:bg-black transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}
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
        </div>
      ) : (
        /* Voice Input Interface */
        <div className="max-w-2xl mx-auto">
          <div className="p-5 space-y-5">
          {/* Link URL Input for Voice Mode */}
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
          
          {/* Voice Recording Interface */}
          <div className="text-center py-10">
            <div className="relative inline-block mb-5">
              <button
                onClick={toggleRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-brand-yellow hover:scale-105'
                }`}
              >
                {isRecording ? (
                  // Stop icon
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  // Microphone icon
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-black">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2"></line>
                    <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2"></line>
                  </svg>
                )}
              </button>
              {isRecording && (
                <div className="absolute inset-0 w-24 h-24 border-3 border-brand-yellow rounded-full animate-ping pointer-events-none"></div>
              )}
            </div>
            <p className="text-text-muted text-body mb-2">
              {isProcessing ? 'AI is processing your recording...' : isRecording ? 'Tap to stop recording' : 'Tap to start speaking'}
            </p>
            {isRecording && (
              <p className="text-text-secondary text-sm">
                Speak naturally about your experience with this product
              </p>
            )}
            {(voiceTranscript || interimTranscript) && !isProcessing && (
              <div className="mt-4 p-3 bg-dark-surface rounded-card">
                <p className="text-text-secondary text-sm">
                  {voiceTranscript}
                  <span className="text-text-muted italic">{interimTranscript}</span>
                </p>
              </div>
            )}
          </div>
          
          {/* AI Processing Animation */}
          {isProcessing && (
            <div className="flex justify-center gap-2 py-4">
              <div className="w-3 h-3 bg-brand-yellow rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-brand-yellow rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-brand-yellow rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
          
          {/* Voice Transcript Display */}
          {aiProcessedData && !isProcessing && (
            <div className="bg-dark-surface rounded-card p-4 space-y-3">
              <div>
                <h3 className="text-brand-yellow text-body font-semibold mb-1">Title:</h3>
                <p className="text-text-primary text-body">{aiProcessedData.title}</p>
              </div>
              <div>
                <h3 className="text-brand-yellow text-body font-semibold mb-1">Description:</h3>
                <p className="text-text-secondary text-body">{aiProcessedData.description}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-text-muted">Category: <span className="text-text-secondary">{categories.find(c => c.id === aiProcessedData.category)?.name}</span></span>
                <span className="text-text-muted">Age: <span className="text-text-secondary">{aiProcessedData.ageRange}</span></span>
              </div>
            </div>
          )}
          
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
              onClick={handleVoiceSubmit}
              disabled={!aiProcessedData || !link}
              className="flex-1 px-6 py-3.5 rounded-button font-semibold text-body bg-brand-yellow text-black hover:bg-[#f5e147] hover:scale-[1.02] btn-transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Share
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}