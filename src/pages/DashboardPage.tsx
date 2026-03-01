import * as React from "react"
import { useNavigate } from "react-router-dom"
import { RefreshCw, Plus, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { SystemStatus } from "@/components/dashboard/SystemStatus"
import { SubscriptionStats } from "@/components/dashboard/SubscriptionStats"
import { IngestionStats } from "@/components/dashboard/IngestionStats"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { ErrorLog } from "@/components/dashboard/ErrorLog"
import { AddSubscriptionForm } from "@/components/forms/AddSubscriptionForm"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { SubscriptionResponse } from "@/api/types"

export function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)

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
    } catch (error) {
      toast.error("Failed to refresh dashboard")
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  // Handle successful subscription creation
  const handleSubscriptionSuccess = (subscription: SubscriptionResponse) => {
    setIsAddModalOpen(false)
    toast.success(`Subscription "${subscription.name}" created successfully`)
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
  }

  // Handle manual ingest navigation
  const handleManualIngest = () => {
    navigate("/manual")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Monitor your subscriptions and ingestion activity
            </p>
          </div>

          {/* Quick Actions - Touch-friendly on mobile */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Button
              variant="outline"
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
              variant="outline"
              size="sm"
              onClick={handleManualIngest}
              className="gap-2 min-h-[44px] flex-1 sm:flex-none"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden xs:inline">Manual Ingest</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2 min-h-[44px] w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Subscription
            </Button>
          </div>
        </div>

        {/* Dashboard Grid Layout */}
        <div className="space-y-6">
          {/* Top Row: System Status (full width) */}
          <div className="w-full">
            <SystemStatus refreshInterval={30000} />
          </div>

          {/* Stats Row: Subscription Stats + Ingestion Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubscriptionStats />
            <IngestionStats />
          </div>

          {/* Content Row: Recent Activity + Error Log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity - 2/3 width on desktop */}
            <div className="lg:col-span-2">
              <RecentActivity limit={10} refreshInterval={30000} />
            </div>

            {/* Error Log - 1/3 width on desktop */}
            <div className="lg:col-span-1">
              <ErrorLog limit={5} />
            </div>
          </div>
        </div>
      </div>

      {/* Add Subscription Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Subscription</DialogTitle>
            <DialogDescription>
              Create a new subscription to automatically track and ingest content
              from your favorite sources.
            </DialogDescription>
          </DialogHeader>
          <AddSubscriptionForm
            onSuccess={handleSubscriptionSuccess}
            onCancel={() => setIsAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
