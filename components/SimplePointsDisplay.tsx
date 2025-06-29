'use client'

import { useState, useEffect } from 'react'

interface SimplePointsDisplayProps {
  userId: string
}

export function SimplePointsDisplay({ userId }: SimplePointsDisplayProps) {
  const [pointsData, setPointsData] = useState<{
    points: number
    level: number
    totalXp: number
  } | null>(null)
  
  useEffect(() => {
    // Fetch points data directly
    fetch(`/api/users/${userId}/points`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPointsData(data.data)
        }
      })
      .catch(console.error)
  }, [userId])
  
  if (!pointsData) return null
  
  return (
    <div className="flex items-center gap-4 p-4 bg-dark-background rounded-card border border-dark-border mb-6">
      {/* Level Badge */}
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-black font-bold text-lg">
          {pointsData.level}
        </div>
        <span className="text-xs text-text-muted mt-1">Level</span>
      </div>
      
      {/* Points Counter */}
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">
            {pointsData.points.toLocaleString()}
          </span>
          <span className="text-sm text-text-muted">points this week</span>
        </div>
        
        {/* XP Progress Bar */}
        <div className="mt-2">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>{pointsData.totalXp.toLocaleString()} XP</span>
            <span>{((pointsData.level * 1000) - pointsData.totalXp).toLocaleString()} to level {pointsData.level + 1}</span>
          </div>
          <div className="h-2 bg-dark-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${((pointsData.totalXp % 1000) / 1000) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}