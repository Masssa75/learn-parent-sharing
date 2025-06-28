'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TestAuthPage() {
  const [status, setStatus] = useState('')
  const [instructions, setInstructions] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const router = useRouter()
  
  const testDevLogin = async () => {
    if (!password) {
      setStatus('Error: Password is required')
      return
    }
    
    setStatus('Logging in...')
    setInstructions([])
    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setStatus(`Success! Logged in as ${data.user.username}. Redirecting to home...`)
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setStatus(`Error: ${data.error}`)
        if (data.instructions) {
          setInstructions(data.instructions)
        }
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  return (
    <div className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Test Authentication</h1>
        
        <div className="bg-dark-surface p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Dev Login (For Testing)</h2>
          <p className="text-gray-300 mb-4">
            This uses a real test user from the database. The test user must be created in Supabase first.
          </p>
          
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter dev password"
              className="w-full bg-dark-bg border border-dark-border rounded-input px-4 py-3 text-text-primary placeholder-text-secondary outline-none focus:border-brand-yellow transition-colors"
              onKeyPress={(e) => e.key === 'Enter' && testDevLogin()}
            />
            <p className="text-sm text-text-secondary mt-2">
              Default: test-learn-2025 (or set DEV_LOGIN_PASSWORD env var)
            </p>
          </div>
          
          <button
            onClick={testDevLogin}
            className="bg-brand-yellow text-black px-6 py-3 rounded-button font-semibold hover:scale-[1.02] transition-transform"
          >
            Login as Dev Test User
          </button>
          
          {status && (
            <div className="mt-4 p-4 bg-dark-bg rounded border border-dark-border">
              <pre className="text-sm text-gray-300">{status}</pre>
            </div>
          )}
          
          {instructions.length > 0 && (
            <div className="mt-4 p-4 bg-red-900/20 rounded border border-red-500/50">
              <h3 className="text-red-400 font-semibold mb-2">Setup Instructions:</h3>
              <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
                {instructions.map((instruction, i) => (
                  <li key={i}>{instruction}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
        
        <div className="bg-dark-surface p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Instructions</h2>
          <ol className="list-decimal list-inside text-gray-300 space-y-2">
            <li>First time: Create test user in Supabase (see instructions if login fails)</li>
            <li>Click "Login as Dev Test User" above</li>
            <li>You'll be redirected to the feed page</li>
            <li>Navigate to /create to test post submission</li>
            <li>Fill out the form and submit</li>
            <li>Posts will be created in the real database</li>
          </ol>
        </div>
      </div>
    </div>
  )
}