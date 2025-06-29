'use client'

export function HardcodedPointsDisplay() {
  // For now, just show a hardcoded display to verify the UI works
  return (
    <div className="flex items-center gap-4 p-4 bg-dark-background rounded-card border border-dark-border mb-6">
      {/* Level Badge */}
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-black font-bold text-lg">
          1
        </div>
        <span className="text-xs text-text-muted mt-1">Level</span>
      </div>
      
      {/* Points Counter */}
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">
            0
          </span>
          <span className="text-sm text-text-muted">points this week</span>
        </div>
        
        {/* XP Progress Bar */}
        <div className="mt-2">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>0 XP</span>
            <span>1,000 to level 2</span>
          </div>
          <div className="h-2 bg-dark-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: '0%' }}
            />
          </div>
        </div>
      </div>
      
      {/* Actions Remaining */}
      <div className="text-right">
        <div className="text-2xl font-bold text-text-secondary">5</div>
        <div className="text-xs text-text-muted">actions left</div>
      </div>
    </div>
  )
}