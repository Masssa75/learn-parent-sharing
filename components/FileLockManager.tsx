'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface FileLock {
  id: string
  file_path: string
  locked_by: string
  locked_at: string
  expires_at: string
  status: 'locked' | 'reserved'
  description?: string
}

export default function FileLockManager() {
  const [locks, setLocks] = useState<FileLock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddLock, setShowAddLock] = useState(false)
  const [newLock, setNewLock] = useState({
    filePath: '',
    lockedBy: '',
    description: '',
    duration: 30
  })

  useEffect(() => {
    fetchLocks()
    // Refresh locks every 30 seconds
    const interval = setInterval(fetchLocks, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchLocks = async () => {
    try {
      const res = await fetch('/api/admin/file-locks')
      if (!res.ok) throw new Error('Failed to fetch locks')
      
      const data = await res.json()
      setLocks(data.locks)
      setLoading(false)
    } catch (err) {
      setError('Failed to load file locks')
      setLoading(false)
    }
  }

  const createLock = async () => {
    try {
      const res = await fetch('/api/admin/file-locks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLock)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create lock')
      }

      await fetchLocks()
      setShowAddLock(false)
      setNewLock({ filePath: '', lockedBy: '', description: '', duration: 30 })
    } catch (err: any) {
      alert(err.message)
    }
  }

  const deleteLock = async (lockId: string) => {
    if (!confirm('Are you sure you want to release this lock?')) return

    try {
      const res = await fetch(`/api/admin/file-locks?id=${lockId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete lock')
      await fetchLocks()
    } catch (err) {
      alert('Failed to release lock')
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - Date.now()
    if (remaining <= 0) return 'Expired'
    
    const minutes = Math.floor(remaining / 60000)
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60)
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  if (loading) return <div className="text-gray-600">Loading file locks...</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">File Lock Manager</h2>
        <button
          onClick={() => setShowAddLock(!showAddLock)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showAddLock ? 'Cancel' : 'Lock File'}
        </button>
      </div>

      {showAddLock && (
        <div className="mb-6 p-4 border rounded">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="File path (e.g., /app/page.tsx)"
              value={newLock.filePath}
              onChange={(e) => setNewLock({ ...newLock, filePath: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Locked by (e.g., Claude-1)"
              value={newLock.lockedBy}
              onChange={(e) => setNewLock({ ...newLock, lockedBy: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newLock.description}
              onChange={(e) => setNewLock({ ...newLock, description: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <select
              value={newLock.duration}
              onChange={(e) => setNewLock({ ...newLock, duration: parseInt(e.target.value) })}
              className="px-3 py-2 border rounded"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
          <button
            onClick={createLock}
            disabled={!newLock.filePath || !newLock.lockedBy}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Create Lock
          </button>
        </div>
      )}

      <div className="space-y-3">
        {locks.length === 0 ? (
          <p className="text-gray-500">No active file locks</p>
        ) : (
          locks.map((lock) => (
            <div key={lock.id} className="border rounded p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-mono text-sm font-semibold text-blue-600">
                    {lock.file_path}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Locked by: <span className="font-semibold">{lock.locked_by}</span>
                  </div>
                  {lock.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {lock.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    Locked at: {format(new Date(lock.locked_at), 'MMM d, HH:mm')}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-sm font-medium ${
                    getTimeRemaining(lock.expires_at) === 'Expired' 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {getTimeRemaining(lock.expires_at)}
                  </div>
                  <button
                    onClick={() => deleteLock(lock.id)}
                    className="text-xs text-red-600 hover:text-red-800 mt-2"
                  >
                    Release Lock
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>• Locks automatically expire after the set duration</p>
        <p>• Files with active locks should not be edited by other instances</p>
        <p>• Page refreshes every 30 seconds to show latest locks</p>
      </div>
    </div>
  )
}