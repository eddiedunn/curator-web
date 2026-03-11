import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import type { SubscriptionStatus } from "@/api/types"

export interface SubscriptionStatsProps {
  /** Optional callback when a stat is clicked */
  onStatClick?: (status?: SubscriptionStatus) => void
}

export function SubscriptionStats({ onStatClick }: SubscriptionStatsProps) {
  const { data: subscriptions = [], isLoading } = useSubscriptions()

  // Calculate stats
  const totalCount = subscriptions.length
  const activeCount = subscriptions.filter((sub) => sub.status === "active").length
  const pausedCount = subscriptions.filter((sub) => sub.status === "paused").length
  const errorCount = subscriptions.filter((sub) => sub.status === "error").length

  // Calculate percentages
  const activePercent = totalCount > 0 ? (activeCount / totalCount) * 100 : 0
  const pausedPercent = totalCount > 0 ? (pausedCount / totalCount) * 100 : 0
  const errorPercent = totalCount > 0 ? (errorCount / totalCount) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Subscription Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Count */}
        <div className="text-center pb-4 border-b">
          <div className="text-4xl font-bold">{totalCount}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Subscriptions</div>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-4">Loading...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              {/* Active */}
              <button
                onClick={() => onStatClick?.("active")}
                className="text-center p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                <Badge variant="default" className="mt-2 bg-green-600">
                  Active
                </Badge>
              </button>

              {/* Paused */}
              <button
                onClick={() => onStatClick?.()}
                className="text-center p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="text-2xl font-bold text-muted-foreground">{pausedCount}</div>
                <Badge variant="secondary" className="mt-2">
                  Paused
                </Badge>
              </button>

              {/* Error */}
              <button
                onClick={() => onStatClick?.("error")}
                className="text-center p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <Badge variant="destructive" className="mt-2">
                  Error
                </Badge>
              </button>
            </div>

            {/* Visual Breakdown with Progress Bars */}
            <div className="space-y-3">
              <div className="text-sm font-medium mb-2">Status Breakdown</div>

              {/* Active Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-green-600 font-medium">Active</span>
                  <span className="text-muted-foreground">
                    {activeCount} ({activePercent.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={activePercent} className="h-2 bg-muted">
                  <div
                    className="h-full bg-green-600 transition-all"
                    style={{ width: `${activePercent}%` }}
                  />
                </Progress>
              </div>

              {/* Paused Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Paused</span>
                  <span className="text-muted-foreground">
                    {pausedCount} ({pausedPercent.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={pausedPercent} className="h-2 bg-muted">
                  <div
                    className="h-full bg-muted-foreground transition-all"
                    style={{ width: `${pausedPercent}%` }}
                  />
                </Progress>
              </div>

              {/* Error Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-red-600 font-medium">Error</span>
                  <span className="text-muted-foreground">
                    {errorCount} ({errorPercent.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={errorPercent} className="h-2 bg-muted">
                  <div
                    className="h-full bg-red-600 transition-all"
                    style={{ width: `${errorPercent}%` }}
                  />
                </Progress>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
