import * as React from "react"
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Database, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useHealth } from "@/hooks/useSystemStatus"
import { formatRelativeTime } from "@/lib/utils"

export interface SystemStatusProps {
  /** Optional refresh interval in milliseconds (defaults to 30000) */
  refreshInterval?: number
}

/**
 * Formats uptime in seconds to a human-readable string
 */
function formatUptime(seconds?: number): string {
  if (!seconds) return "Unknown"

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export function SystemStatus({}: SystemStatusProps) {
  const { data: health, isLoading, error, refetch } = useHealth()
  const [lastChecked, setLastChecked] = React.useState<string>(new Date().toISOString())
  const [isCheckingNow, setIsCheckingNow] = React.useState(false)

  // Update last checked time when health data changes
  React.useEffect(() => {
    if (health) {
      setLastChecked(new Date().toISOString())
    }
  }, [health])

  // Handle manual daemon check trigger
  const handleTriggerCheck = async () => {
    setIsCheckingNow(true)
    try {
      // Refetch health status after a moment
      await refetch()
    } catch (error) {
      console.error("Failed to trigger check:", error)
    } finally {
      setIsCheckingNow(false)
    }
  }

  // Determine overall health status
  const getHealthStatus = () => {
    if (isLoading) return { label: "Loading...", variant: "default" as const, icon: Activity }
    if (error) return { label: "Down", variant: "destructive" as const, icon: XCircle }
    if (!health) return { label: "Unknown", variant: "secondary" as const, icon: AlertTriangle }

    const allHealthy = health.database_connected && health.daemon_running
    if (allHealthy) {
      return { label: "Healthy", variant: "default" as const, icon: CheckCircle }
    }

    const partiallyHealthy = health.database_connected || health.daemon_running
    if (partiallyHealthy) {
      return { label: "Degraded", variant: "secondary" as const, icon: AlertTriangle }
    }

    return { label: "Down", variant: "destructive" as const, icon: XCircle }
  }

  const healthStatus = getHealthStatus()
  const StatusIcon = healthStatus.icon

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">System Status</CardTitle>
          <Badge
            variant={healthStatus.variant}
            className="flex items-center gap-1"
          >
            <StatusIcon className="h-3 w-3" />
            {healthStatus.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to fetch system status. Please check your connection.
            </AlertDescription>
          </Alert>
        )}

        {health && (
          <>
            {/* Database Connection */}
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Database Connection</span>
              </div>
              <Badge variant={health.database_connected ? "default" : "destructive"}>
                {health.database_connected ? "✓ Connected" : "✗ Disconnected"}
              </Badge>
            </div>

            {/* Daemon Status */}
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Daemon Running</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={health.daemon_running ? "default" : "destructive"}>
                  {health.daemon_running ? "✓ Running" : "✗ Stopped"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTriggerCheck}
                  disabled={isCheckingNow}
                >
                  {isCheckingNow ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Check Now
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* API Version */}
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-medium text-muted-foreground">API Version</span>
              <span className="text-sm font-mono">{health.version}</span>
            </div>

            {/* System Uptime */}
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-medium text-muted-foreground">System Uptime</span>
              <span className="text-sm">{formatUptime(health.uptime_seconds)}</span>
            </div>

            {/* Last Subscription Check */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-muted-foreground">Last Status Check</span>
              <span className="text-sm">{formatRelativeTime(lastChecked)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
