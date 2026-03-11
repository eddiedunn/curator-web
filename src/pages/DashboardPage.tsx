import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { RefreshCw, Plus, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SystemStatus } from "@/components/dashboard/SystemStatus"
import { SubscriptionStats } from "@/components/dashboard/SubscriptionStats"
import { IngestionStats } from "@/components/dashboard/IngestionStats"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { ErrorLog } from "@/components/dashboard/ErrorLog"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Auto-refresh all data every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries()
    }, 30000)

    return () => clearInterval(interval)
  }, [queryClient])

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries()
      toast.success("Dashboard refreshed")
    } catch {
      toast.error("Failed to refresh dashboard")
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Monitor your subscriptions and ingestion activity
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2 min-h-[44px] flex-1 sm:flex-none"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden xs:inline">Refresh</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/manual")}
            className="gap-2 min-h-[44px] flex-1 sm:flex-none"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden xs:inline">Manual Ingest</span>
          </Button>
          <Button
            size="sm"
            asChild
            className="gap-2 min-h-[44px] w-full sm:w-auto"
          >
            <Link to="/subscriptions/new">
              <Plus className="h-4 w-4" />
              Add Subscription
            </Link>
          </Button>
        </div>
      </div>

      {/* Dashboard Grid Layout */}
      <div className="w-full">
        <SystemStatus refreshInterval={30000} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubscriptionStats />
        <IngestionStats />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity limit={10} refreshInterval={30000} />
        </div>
        <div className="lg:col-span-1">
          <ErrorLog limit={5} />
        </div>
      </div>
    </div>
  )
}
