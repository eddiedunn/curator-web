import { useState, useEffect } from 'react'
import { Navigation } from './Navigation'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme-provider'

type SystemHealth = 'healthy' | 'warning' | 'error'

export function Header() {
  const { theme, setTheme } = useTheme()
  const [systemHealth, setSystemHealth] = useState<SystemHealth>('healthy')

  useEffect(() => {
    // Simulate system health check
    // In a real app, this would check backend health endpoints
    const checkHealth = async () => {
      try {
        // Mock health check - replace with actual API call
        const isHealthy = true // await fetch('/api/health')
        setSystemHealth(isHealthy ? 'healthy' : 'warning')
      } catch {
        setSystemHealth('error')
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const healthColors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  const healthLabels = {
    healthy: 'System operational',
    warning: 'System degraded',
    error: 'System error',
  }

  return (
    <header className="bg-white dark:bg-slate-900 shadow border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
              Curator
            </h1>

            {/* System Health Indicator */}
            <div className="flex items-center space-x-2" title={healthLabels[systemHealth]}>
              <div
                className={cn(
                  'w-2 h-2 rounded-full animate-pulse',
                  healthColors[systemHealth]
                )}
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 hidden lg:inline">
                {healthLabels[systemHealth]}
              </span>
            </div>
          </div>

          {/* Navigation and Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Navigation />

            {/* Dark Mode Toggle - Ensure min 44x44px touch target */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="min-h-[44px] min-w-[44px]"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
