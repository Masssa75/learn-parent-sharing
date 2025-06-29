'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  telegram_id: number
  telegram_username: string
  first_name: string
  last_name: string
  photo_url: string
  is_admin: boolean
  created_at: string
}

interface AuthUser {
  isAdmin: boolean
  firstName: string
  lastName: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check')
      const data = await res.json()
      
      if (!data.authenticated || !data.user?.isAdmin) {
        setError('You must be an admin to access this page')
        setLoading(false)
        return
      }
      
      setCurrentUser({
        isAdmin: data.user.isAdmin,
        firstName: data.user.firstName,
        lastName: data.user.lastName
      })
      
      await fetchUsers()
    } catch (err) {
      setError('Failed to check authentication')
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      
      if (!res.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await res.json()
      setUsers(data.users)
      setLoading(false)
    } catch (err) {
      setError('Failed to load users')
      setLoading(false)
    }
  }

  const toggleAdmin = async (telegramId: number, currentIsAdmin: boolean) => {
    try {
      setSuccessMessage('')
      const action = currentIsAdmin ? 'remove_admin' : 'make_admin'
      
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, action })
      })
      
      if (!res.ok) {
        throw new Error('Failed to update admin status')
      }
      
      const data = await res.json()
      setSuccessMessage(data.message)
      
      // Refresh users list
      await fetchUsers()
    } catch (err) {
      setError('Failed to update admin status')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
          
          <div className="mb-6">
            <p className="text-gray-600">
              Welcome, {currentUser?.firstName} {currentUser?.lastName}
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Telegram ID</th>
                  <th className="text-left py-3 px-4">Username</th>
                  <th className="text-left py-3 px-4">Admin</th>
                  <th className="text-left py-3 px-4">Joined</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {user.photo_url && (
                          <img
                            src={user.photo_url}
                            alt=""
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {user.telegram_id}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      @{user.telegram_username || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {user.is_admin ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          Admin
                        </span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleAdmin(user.telegram_id, user.is_admin)}
                        className={`px-3 py-1 rounded text-sm ${
                          user.is_admin
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}