'use client'

import { useState, useEffect, useRef } from 'react'
import type { PointsAnimation } from '@/types/points'

interface PointsDisplayProps {
  points: number
  xp: number
  level: number
  actionsRemaining?: number
}

export function PointsDisplay({ points, xp, level, actionsRemaining }: PointsDisplayProps) {
  const [animations, setAnimations] = useState<PointsAnimation[]>([])
  const [displayPoints, setDisplayPoints] = useState(points)
  const [isTokenRain, setIsTokenRain] = useState(false)
  const animationCounter = useRef(0)
  const pointsRef = useRef(points)
  
  // Update points with animation
  useEffect(() => {
    if (points !== pointsRef.current) {
      const diff = points - pointsRef.current
      pointsRef.current = points
      
      // Add animation
      const id = `anim-${animationCounter.current++}`
      const newAnimation: PointsAnimation = {
        id,
        points: diff,
        x: Math.random() * 40 - 20,
        y: -20,
        timestamp: Date.now()
      }
      
      setAnimations(prev => [...prev, newAnimation])
      
      // Animate the points counter
      const steps = 20
      const increment = diff / steps
      let currentStep = 0
      
      const interval = setInterval(() => {
        currentStep++
        if (currentStep >= steps) {
          setDisplayPoints(points)
          clearInterval(interval)
        } else {
          setDisplayPoints(prev => Math.round(prev + increment))
        }
      }, 30)
      
      // Check for token rain (every 10th positive action)
      if (diff > 0 && animationCounter.current % 10 === 0) {
        triggerTokenRain()
      }
      
      // Remove animation after 2 seconds
      setTimeout(() => {
        setAnimations(prev => prev.filter(a => a.id !== id))
      }, 2000)
    }
  }, [points])
  
  const triggerTokenRain = () => {
    setIsTokenRain(true)
    setTimeout(() => setIsTokenRain(false), 3000)
  }
  
  const getXpToNextLevel = () => {
    const currentLevelXp = (level - 1) * 1000
    const nextLevelXp = level * 1000
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    return { progress, remaining: nextLevelXp - xp }
  }
  
  const { progress, remaining } = getXpToNextLevel()
  
  return (
    <div className="relative">
      {/* Token Rain */}
      {isTokenRain && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              <span className="text-2xl">🪙</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Points Display */}
      <div className="flex items-center gap-4 p-4 bg-dark-background rounded-card border border-dark-border">
        {/* Level Badge */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-black font-bold text-lg">
            {level}
          </div>
          <span className="text-xs text-text-muted mt-1">Level</span>
        </div>
        
        {/* Points Counter */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary relative">
              {displayPoints.toLocaleString()}
              
              {/* Point Animations */}
              {animations.map(anim => (
                <span
                  key={anim.id}
                  className="absolute text-sm font-bold animate-float-up"
                  style={{
                    left: `${anim.x}px`,
                    top: `${anim.y}px`,
                    color: anim.points > 0 ? '#F5D547' : '#ef4444'
                  }}
                >
                  {anim.points > 0 ? '+' : ''}{anim.points}
                </span>
              ))}
            </span>
            <span className="text-sm text-text-muted">points this week</span>
          </div>
          
          {/* XP Progress Bar */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>{xp.toLocaleString()} XP</span>
              <span>{remaining.toLocaleString()} to level {level + 1}</span>
            </div>
            <div className="h-2 bg-dark-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Actions Remaining */}
        {actionsRemaining !== undefined && (
          <div className="text-right">
            <div className="text-2xl font-bold text-text-secondary">{actionsRemaining}</div>
            <div className="text-xs text-text-muted">actions left</div>
          </div>
        )}
      </div>
    </div>
  )
}