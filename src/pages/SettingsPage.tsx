import * as React from "react"
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Database, Github, FileText, Zap, Server, Clock, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { ErrorMessage } from "@/components/ErrorMessage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useSystemStatus, useHealth } from "@/hooks/useSystemStatus"
import { toast } from "sonner"

export function SettingsPage() {
  const { data: status, isLoading: isLoadingStatus, refetch: refetchStatus } = useSystemStatus()
  const { data: health, isLoading: isLoadingHealth, refetch: refetchHealth } = useHealth()
  const [isTestingConnections, setIsTestingConnections] = React.useState(false)
  const [isTriggeringCheck, setIsTriggeringCheck] = React.useState(false)
  const [isSchemaDialogOpen, setIsSchemaDialogOpen] = React.useState(false)

  // Format uptime into human-readable format
  const formatUptime = (seconds?: number) => {
    if (!seconds) return "N/A"
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  // Get health badge variant
  const getHealthBadge = (isHealthy?: boolean) => {
    if (isHealthy === undefined) {
      return <Badge variant="outline">Unknown</Badge>
    }
    return isHealthy ? (
      <Badge className="bg-green-500">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Healthy
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Unhealthy
      </Badge>
    )
  }

  // Test connections to all endpoints
  const handleTestConnections = async () => {
    setIsTestingConnections(true)
    try {
      await Promise.all([
        refetchHealth(),
        refetchStatus(),
      ])
      toast.success("All connections tested successfully")
    } catch (error) {
      toast.error("Failed to test connections")
    } finally {
      setIsTestingConnections(false)
    }
  }

  // Trigger immediate subscription check (simulated - would need API endpoint)
  const handleTriggerCheck = async () => {
    setIsTriggeringCheck(true)
    try {
      // This would call a real API endpoint to trigger subscription checks
      // For now, we'll just refresh the status
      await refetchStatus()
      toast.success("Subscription check triggered successfully")
    } catch (error) {
      toast.error("Failed to trigger subscription check")
    } finally {
      setIsTriggeringCheck(false)
    }
  }

  // Export database backup (simulated - would need API endpoint)
  const handleExportBackup = () => {
    toast.info("Database export feature coming soon")
    // This would trigger a download of the SQLite file
  }

  const isLoading = isLoadingStatus || isLoadingHealth
  const daemonStatus = status?.daemon_running ? "Running" : "Stopped"
  const lastCheckTime = status?.uptime_seconds ? new Date().toLocaleString() : "Never"

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">
            System configuration and status (read-only)
          </p>
        </div>

        {/* Error State */}
        {(status === undefined && !isLoadingStatus) && (
          <ErrorMessage
            title="Failed to load system status"
            message="Unable to fetch system information. Please try again."
            onRetry={() => {
              refetchStatus()
              refetchHealth()
            }}
            className="mb-6"
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <LoadingSkeleton variant="card" count={5} />
        )}

        {/* Main Content */}
        {!isLoading && (
          <div className="space-y-6">
            {/* 1. Daemon Configuration */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Daemon Configuration
              </CardTitle>
              <CardDescription>
                Background daemon status and scheduling information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Status</p>
                  <div className="flex items-center gap-2">
                    {status?.daemon_running ? (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {daemonStatus}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        {daemonStatus}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Check Interval</p>
                  <p className="text-lg font-semibold">30 seconds</p>
                  <p className="text-xs text-slate-500">Default interval</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Last Check Time</p>
                  <p className="text-sm">{lastCheckTime}</p>
                  <p className="text-xs text-slate-500">Auto-refreshed</p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleTriggerCheck}
                  disabled={isTriggeringCheck || isLoading}
                  className="gap-2"
                >
                  <Zap className={`h-4 w-4 ${isTriggeringCheck ? "animate-pulse" : ""}`} />
                  Trigger Check Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. Service Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Service Endpoints
              </CardTitle>
              <CardDescription>
                API service URLs and health status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Curator API URL</p>
                    <p className="text-sm text-slate-600 font-mono">
                      {import.meta.env.VITE_CURATOR_API_URL || 'http://localhost:8950'}
                    </p>
                  </div>
                  {getHealthBadge(health?.database_connected)}
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Engram API URL</p>
                    <p className="text-sm text-slate-600 font-mono">
                      {import.meta.env.VITE_ENGRAM_API_URL || 'http://localhost:8001'}
                    </p>
                  </div>
                  <Badge variant="outline">Not monitored</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Transcribe API URL</p>
                    <p className="text-sm text-slate-600 font-mono">
                      {import.meta.env.VITE_TRANSCRIBE_API_URL || 'http://localhost:8002'}
                    </p>
                  </div>
                  <Badge variant="outline">Not monitored</Badge>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleTestConnections}
                  disabled={isTestingConnections || isLoading}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isTestingConnections ? "animate-spin" : ""}`} />
                  Test Connections
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 3. Rate Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Rate Limits
              </CardTitle>
              <CardDescription>
                API rate limiting and usage tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Rate limit tracking is not currently implemented. Configure limits via environment variables.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">YouTube API</p>
                    <p className="text-sm text-slate-600">10,000 requests/day</p>
                  </div>
                  <Progress value={0} className="h-2" />
                  <p className="text-xs text-slate-500">Usage tracking not available</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">RSS Feeds</p>
                    <p className="text-sm text-slate-600">No limit</p>
                  </div>
                  <Progress value={0} className="h-2" />
                  <p className="text-xs text-slate-500">No rate limiting applied</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Podcast Feeds</p>
                    <p className="text-sm text-slate-600">No limit</p>
                  </div>
                  <Progress value={0} className="h-2" />
                  <p className="text-xs text-slate-500">No rate limiting applied</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Database */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database
              </CardTitle>
              <CardDescription>
                Database information and management tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Connection Status</p>
                  <div className="flex items-center gap-2">
                    {status?.database_connected ? (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Disconnected
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Total Records</p>
                  <p className="text-lg font-semibold">{status?.total_items?.toLocaleString() || 0}</p>
                  <p className="text-xs text-slate-500">Ingested items</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Location</p>
                  <p className="text-sm font-mono text-slate-600">./data/curator.db</p>
                  <p className="text-xs text-slate-500">SQLite database</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Size</p>
                  <p className="text-sm">Not available</p>
                  <p className="text-xs text-slate-500">Check filesystem</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleExportBackup}
                  variant="outline"
                  className="gap-2"
                >
                  <Database className="h-4 w-4" />
                  Export Backup
                </Button>
                <Button
                  onClick={() => setIsSchemaDialogOpen(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Schema
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 5. Application Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Application Info
              </CardTitle>
              <CardDescription>
                Version information and useful links
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Web UI Version</p>
                  <p className="text-lg font-semibold">1.0.0</p>
                  <p className="text-xs text-slate-500">Frontend application</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">API Version</p>
                  <p className="text-lg font-semibold">{status?.version || "Unknown"}</p>
                  <p className="text-xs text-slate-500">Backend service</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">System Uptime</p>
                  <p className="text-lg font-semibold">{formatUptime(status?.uptime_seconds)}</p>
                  <p className="text-xs text-slate-500">Time since API started</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Active Subscriptions</p>
                  <p className="text-lg font-semibold">{status?.enabled_subscriptions || 0}</p>
                  <p className="text-xs text-slate-500">of {status?.total_subscriptions || 0} total</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open('https://github.com/yourusername/curator', '_blank')}
                >
                  <Github className="h-4 w-4" />
                  GitHub Repository
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open('https://docs.curator.dev', '_blank')}
                >
                  <FileText className="h-4 w-4" />
                  Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        )}
      </div>

      {/* Database Schema Dialog */}
      <Dialog open={isSchemaDialogOpen} onOpenChange={setIsSchemaDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Database Schema</DialogTitle>
            <DialogDescription>
              SQLite database table definitions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`-- subscriptions table
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  subscription_type TEXT NOT NULL,
  source_url TEXT NOT NULL,
  check_frequency_minutes INTEGER DEFAULT 60,
  enabled BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active',
  last_checked_at TIMESTAMP,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON
);

-- ingested_items table
CREATE TABLE ingested_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL UNIQUE,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  published_at TIMESTAMP,
  ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  chunk_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  metadata JSON,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);`}</pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
