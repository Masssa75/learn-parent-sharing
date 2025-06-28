'use client'

import { useState, useEffect } from 'react'
import { getYouTubeThumbnail, extractYouTubeVideoId } from '@/utils/youtube'

interface YouTubePreviewProps {
  url: string
  onRemove?: () => void
}

interface VideoData {
  title: string
  author_name: string
  thumbnail_url: string
}

export function YouTubePreview({ url, onRemove }: YouTubePreviewProps) {
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const videoId = extractYouTubeVideoId(url)
  
  useEffect(() => {
    if (!videoId) {
      setError('Invalid YouTube URL')
      setLoading(false)
      return
    }
    
    // Fetch video data using YouTube oEmbed API
    const fetchVideoData = async () => {
      try {
        const response = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch video data')
        }
        
        const data = await response.json()
        setVideoData(data)
      } catch (err) {
        console.error('Error fetching video data:', err)
        // Fallback to just showing thumbnail
        setVideoData({
          title: 'YouTube Video',
          author_name: 'YouTube',
          thumbnail_url: getYouTubeThumbnail(videoId)
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchVideoData()
  }, [url, videoId])
  
  if (loading) {
    return (
      <div className="relative bg-dark-surface rounded-card p-4 animate-pulse">
        <div className="w-full h-48 bg-dark-border rounded-input mb-3"></div>
        <div className="h-4 bg-dark-border rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-dark-border rounded w-1/2"></div>
      </div>
    )
  }
  
  if (error || !videoData || !videoId) {
    return null
  }
  
  return (
    <div className="relative bg-dark-surface rounded-card overflow-hidden border border-dark-border">
      <div className="relative">
        <img
          src={videoData.thumbnail_url || getYouTubeThumbnail(videoId)}
          alt={videoData.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            // Fallback to standard quality if maxres fails
            e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          }}
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-text-primary text-body font-semibold line-clamp-2 mb-1">
          {videoData.title}
        </h3>
        <p className="text-text-secondary text-meta">
          {videoData.author_name}
        </p>
      </div>
      
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-8 h-8 bg-dark-bg/80 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-dark-bg transition-all"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  )
}