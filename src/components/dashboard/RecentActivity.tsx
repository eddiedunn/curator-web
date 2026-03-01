import * as React from "react"
import { Link } from "react-router-dom"
import { Clock, CheckCircle, AlertTriangle, Circle, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useIngestedItems } from "@/hooks/useIngestedItems"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import { formatRelativeTime } from "@/lib/utils"
import type { IngestionStatus, IngestedItemResponse } from "@/api/types"

export interface RecentActivityProps {
  /** Number of recent items to show (defaults to 10) */
  limit?: number

  /** Auto-refresh interval in milliseconds (defaults to 30000) */
  refreshInterval?: number

  /** Optional callback when an item is clicked */
  onItemClick?: (itemId: string) => void
}

// Status icon mapping
const STATUS_ICONS: Record<IngestionStatus, React.ReactNode> = {
  completed: <CheckCircle className="h-4 w-4 text-green-600" />,
  failed: <AlertTriangle className="h-4 w-4 text-red-600" />,
  in_progress: <Clock className="h-4 w-4 text-blue-600" />,
  pending: <Circle className="h-4 w-4 text-gray-400" />,
}

// Status badge variant mapping
const STATUS_VARIANTS: Record<IngestionStatus, "default" | "destructive" | "secondary"> = {
  completed: "default",
  failed: "destructive",
  in_progress: "default",
  pending: "secondary",
}

export function RecentActivity({
  limit = 10,
  onItemClick
}: RecentActivityProps) {
  const { data: items = [], isLoading } = useIngestedItems()
  const { data: subscriptions = [] } = useSubscriptions()

  // Create a map of subscription IDs to names for quick lookup
  const subscriptionMap = React.useMemo(() => {
    return subscriptions.reduce((acc, sub) => {
      acc[sub.id] = sub.name
      return acc
    }, {} as Record<string, string>)
  }, [subscriptions])

  // Sort items by ingested_at (most recent first) and take the limit
  const recentItems = React.useMemo(() => {
    return [...items]
      .sort((a, b) => {
        const dateA = new Date(a.ingested_at).getTime()
        const dateB = new Date(b.ingested_at).getTime()
        return dateB - dateA
      })
      .slice(0, limit)
  }, [items, limit])

  // Handle item click
  const handleItemClick = (item: IngestedItemResponse) => {
    if (onItemClick) {
      onItemClick(item.id)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
          <span className="text-xs text-muted-foreground">
            Last {limit} events • Auto-refresh 30s
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : recentItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {recentItems.map((item) => {
              const subscriptionName = item.subscription_id
                ? subscriptionMap[item.subscription_id] || "Unknown"
                : "Manual Fetch"

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-b-0 last:pb-0"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {STATUS_ICONS[item.status]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Title */}
                    <Link
                      to={`/ingested?item=${item.id}`}
                      className="font-medium text-sm hover:underline block truncate"
                      onClick={() => handleItemClick(item)}
                    >
                      {item.title}
                    </Link>

                    {/* Metadata row */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      {/* Status Badge */}
                      <Badge
                        variant={STATUS_VARIANTS[item.status]}
                        className="text-xs h-5"
                      >
                        {item.status.replace("_", " ")}
                      </Badge>

                      {/* Subscription Name */}
                      {item.subscription_id ? (
                        <Link
                          to={`/subscriptions?id=${item.subscription_id}`}
                          className="hover:underline"
                        >
                          {subscriptionName}
                        </Link>
                      ) : (
                        <span>{subscriptionName}</span>
                      )}

                      {/* Timestamp */}
                      <span>•</span>
                      <span>{formatRelativeTime(item.ingested_at)}</span>
                    </div>
                  </div>

                  {/* View Link */}
                  <Link
                    to={`/ingested?item=${item.id}`}
                    className="flex-shrink-0"
                    title="View in ingested items"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
