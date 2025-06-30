'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FeedPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to main page - we don't need a separate feed page anymore
    router.push('/app')
  }, [router])
  
  return null
}