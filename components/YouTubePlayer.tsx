'use client'

import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/utils/youtube'

interface YouTubePlayerProps {
  url: string
  title?: string
}

export function YouTubePlayer({ url, title }: YouTubePlayerProps) {
  const videoId = extractYouTubeVideoId(url)
  
  if (!videoId) {
    return null
  }
  
  return (
    <div className="relative w-full aspect-video bg-dark-surface rounded-card overflow-hidden">
      <iframe
        src={getYouTubeEmbedUrl(videoId)}
        title={title || 'YouTube video player'}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}