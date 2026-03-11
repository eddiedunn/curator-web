import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useSystemStatus } from "@/hooks/useSystemStatus"
import { useIngestedItems } from "@/hooks/useIngestedItems"
import type { IngestionStatus } from "@/api/types"

export interface IngestionStatsProps {
  /** Optional callback when a stat is clicked */
  onStatClick?: (status?: IngestionStatus) => void
}

export function IngestionStats({ onStatClick }: IngestionStatsProps) {
  const { data: status, isLoading } = useSystemStatus()
  const { data: items = [] } = useIngestedItems({ limit: 10000 })

  // Total from status API (authoritative); breakdown counted from full item list
  const totalCount = status?.total_items ?? items.length
  const completedCount = items.filter((item) => item.status === "completed").length
  const failedCount = items.filter((item) => item.status === "failed").length
  const inProgressCount = items.filter((item) => item.status === "in_progress").length
  const pendingCount = items.filter((item) => item.status === "pending").length

  // Calculate percentages
  const completedPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const failedPercent = totalCount > 0 ? (failedCount / totalCount) * 100 : 0
  const inProgressPercent = totalCount > 0 ? (inProgressCount / totalCount) * 100 : 0
  const pendingPercent = totalCount > 0 ? (pendingCount / totalCount) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Ingestion Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Count */}
        <div className="text-center pb-4 border-b">
          <div className="text-4xl font-bold">{totalCount}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Items</div>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-4">Loading...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Completed */}
              <button
                onClick={() => onStatClick?.("completed")}
                className="text-center p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                <Badge variant="default" className="mt-2 bg-green-600">
                  Completed
                </Badge>
              </button>

              {/* Failed */}
              <button
                onClick={() => onStatClick?.("failed")}
                className="text-center p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                <Badge variant="destructive" className="mt-2">
                  Failed
                </Badge>
              </button>

              {/* In Progress */}
              <button
                onClick={() => onStatClick?.("in_progress")}
                className="text-center p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
                <Badge variant="default" className="mt-2 bg-blue-600">
                  In Progress
                </Badge>
              </button>

              {/* Pending */}
              <button
                onClick={() => onStatClick?.("pending")}
                className="text-center p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="text-2xl font-bold text-muted-foreground">{pendingCount}</div>
                <Badge variant="secondary" className="mt-2">
                  Pending
                </Badge>
              </button>
            </div>

            {/* Visual Breakdown with Progress Bars */}
            <div className="space-y-3">
              <div className="text-sm font-medium mb-2">Status Breakdown</div>

              {/* Completed Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-green-600 font-medium">Completed</span>
                  <span className="text-muted-foreground">
                    {completedCount} ({completedPercent.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={completedPercent} className="h-2 bg-muted">
                  <div
                    className="h-full bg-green-600 transition-all"
                    style={{ width: `${completedPercent}%` }}
                  />
                </Progress>
              </div>

              {/* Failed Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-red-600 font-medium">Failed</span>
                  <span className="text-muted-foreground">
                    {failedCount} ({failedPercent.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={failedPercent} className="h-2 bg-muted">
                  <div
                    className="h-full bg-red-600 transition-all"
                    style={{ width: `${failedPercent}%` }}
                  />
                </Progress>
              </div>

              {/* In Progress Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600 font-medium">In Progress</span>
                  <span className="text-muted-foreground">
                    {inProgressCount} ({inProgressPercent.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={inProgressPercent} className="h-2 bg-muted">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${inProgressPercent}%` }}
                  />
                </Progress>
              </div>

              {/* Pending Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Pending</span>
                  <span className="text-muted-foreground">
                    {pendingCount} ({pendingPercent.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={pendingPercent} className="h-2 bg-muted">
                  <div
                    className="h-full bg-muted-foreground transition-all"
                    style={{ width: `${pendingPercent}%` }}
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
