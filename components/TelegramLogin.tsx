'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    onTelegramAuth: (user: any) => void
  }
}

interface TelegramLoginProps {
  botUsername?: string
  onAuth?: (user: any) => void
}

export default function TelegramLogin({ 
  botUsername = 'learn_notification_bot',
  onAuth 
}: TelegramLoginProps) {
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  useEffect(() => {
    // Define the callback function
    window.onTelegramAuth = async (user: any) => {
      try {
        // Send auth data to our API
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user),
        })
        
        const data = await response.json()
        
        if (response.ok) {
          if (onAuth) {
            onAuth(user)
          }
          // Redirect to home page
          router.push('/')
        } else {
          console.error('Authentication failed:', data.error)
        }
      } catch (error) {
        console.error('Authentication error:', error)
      }
    }
    
    // Create the Telegram login widget
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '20')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true
    
    if (ref.current) {
      ref.current.appendChild(script)
    }
    
    return () => {
      if (ref.current && script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [botUsername, onAuth, router])
  
  return <div ref={ref} />
}