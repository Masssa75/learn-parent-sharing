'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const hasSession = document.cookie.includes('session=')
      
      if (hasSession) {
        router.push('/feed')
      } else {
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="animate-pulse">
        <h1 className="text-4xl font-bold text-white">Learn</h1>
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </main>
  )
}