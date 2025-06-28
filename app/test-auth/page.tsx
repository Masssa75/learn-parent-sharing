'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TestAuthPage() {
  const [status, setStatus] = useState('')
  const router = useRouter()
  
  const testMockLogin = async () => {
    setStatus('Logging in...')
    try {
      const response = await fetch('/api/auth/mock-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setStatus(`Success! Logged in as ${data.user.username}. Redirecting to feed...`)
        setTimeout(() => {
          router.push('/feed')
        }, 2000)
      } else {
        setStatus(`Error: ${JSON.stringify(data)}`)
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`)
    }
  }
  
  return (
    <div className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Test Authentication</h1>
        
        <div className="bg-dark-surface p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Mock Login (For Testing)</h2>
          <p className="text-gray-300 mb-4">
            This creates a mock session without needing Telegram or database access.
          </p>
          <button
            onClick={testMockLogin}
            className="bg-brand-yellow text-black px-6 py-3 rounded-button font-semibold hover:scale-[1.02] transition-transform"
          >
            Login as Test User
          </button>
          
          {status && (
            <div className="mt-4 p-4 bg-dark-bg rounded border border-dark-border">
              <pre className="text-sm text-gray-300">{status}</pre>
            </div>
          )}
        </div>
        
        <div className="bg-dark-surface p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Instructions</h2>
          <ol className="list-decimal list-inside text-gray-300 space-y-2">
            <li>Click "Login as Test User" above</li>
            <li>You'll be redirected to the feed page</li>
            <li>Navigate to /create to test post submission</li>
            <li>Fill out the form and submit</li>
            <li>The mock user will simulate a successful post creation</li>
          </ol>
        </div>
      </div>
    </div>
  )
}