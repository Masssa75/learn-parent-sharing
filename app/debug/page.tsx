'use client'

import { useState, useEffect } from 'react'

export default function DebugPage() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [posts, setPosts] = useState<any>(null)
  const [testResult, setTestResult] = useState<string>('')
  
  useEffect(() => {
    checkAuth()
    fetchPosts()
  }, [])
  
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check')
      const data = await response.json()
      setAuthStatus(data)
    } catch (error) {
      setAuthStatus({ error: error.message })
    }
  }
  
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      setPosts({ error: error.message })
    }
  }
  
  const testPostCreation = async () => {
    setTestResult('Testing...')
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Debug Test Post',
          description: 'This is a test post from the debug page',
          category: 'Apps & Software',
          ageRanges: ['3-5'],
          linkUrl: 'https://example.com'
        }),
      })
      
      const data = await response.json()
      setTestResult(`Status: ${response.status}\n${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setTestResult(`Error: ${error.message}`)
    }
  }
  
  return (
    <div className="min-h-screen bg-dark-bg p-5">
      <h1 className="text-2xl font-bold text-white mb-6">Debug Page</h1>
      
      <div className="space-y-6">
        <div className="bg-dark-surface p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-2">Authentication Status</h2>
          <pre className="text-xs text-gray-300 overflow-auto">
            {JSON.stringify(authStatus, null, 2)}
          </pre>
        </div>
        
        <div className="bg-dark-surface p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-2">Posts API Response</h2>
          <pre className="text-xs text-gray-300 overflow-auto max-h-64">
            {JSON.stringify(posts, null, 2)}
          </pre>
        </div>
        
        <div className="bg-dark-surface p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-2">Test Post Creation</h2>
          <button
            onClick={testPostCreation}
            className="bg-brand-yellow text-black px-4 py-2 rounded font-semibold mb-4"
          >
            Test Create Post
          </button>
          <pre className="text-xs text-gray-300 overflow-auto">
            {testResult}
          </pre>
        </div>
        
        <div className="bg-dark-surface p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-2">Environment Check</h2>
          <p className="text-sm text-gray-300">
            Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}
          </p>
          <p className="text-sm text-gray-300">
            Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}
          </p>
        </div>
      </div>
    </div>
  )
}