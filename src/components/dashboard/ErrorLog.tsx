import * as React from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, RefreshCw, Edit, PauseCircle, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSubscriptions, useUpdateSubscription } from "@/hooks/useSubscriptions"
import { curatorClient } from "@/api/client"
import { formatRelativeTime } from "@/lib/utils"

export interface ErrorLogProps {
  /** Maximum number of errors to show (defaults to 5) */
  limit?: number

  /** Optional callback when edit is clicked */
  onEdit?: (subscriptionId: string) => void

  /** Optional callback when retry is clicked */
  onRetry?: (subscriptionId: string) => void
}

export function ErrorLog({ limit = 5, onEdit, onRetry }: ErrorLogProps) {
  const { data: subscriptions = [], isLoading } = useSubscriptions()
  const updateSubscription = useUpdateSubscription()
  const [retryingIds, setRetryingIds] = React.useState<Set<string>>(new Set())

  // Filter subscriptions with errors and sort by last_checked_at
  const errorSubscriptions = React.useMemo(() => {
    return subscriptions
      .filter((sub) => sub.status === "error" && sub.last_error)
      .sort((a, b) => {
        const dateA = a.last_checked_at ? new Date(a.last_checked_at).getTime() : 0
        const dateB = b.last_checked_at ? new Date(b.last_checked_at).getTime() : 0
        return dateB - dateA
      })
      .slice(0, limit)
  }, [subscriptions, limit])

  // Handle retry action
  const handleRetry = async (subscriptionId: string, sourceUrl: string) => {
    setRetryingIds((prev) => new Set(prev).add(subscriptionId))

    try {
      await curatorClient.triggerFetch({
        source_url: sourceUrl,
        subscription_id: subscriptionId,
      })

      if (onRetry) {
        onRetry(subscriptionId)
      }
    } catch (error) {
      console.error("Failed to retry subscription:", error)
    } finally {
      setRetryingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(subscriptionId)
        return newSet
      })
    }
  }

  // Handle disable action
  const handleDisable = async (subscriptionId: string) => {
    try {
      await updateSubscription.mutateAsync({
        id: subscriptionId,
        data: { enabled: false },
      })
    } catch (error) {
      console.error("Failed to disable subscription:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-xl font-bold">Error Log</CardTitle>
          </div>
          {errorSubscriptions.length > 0 && (
            <Link to="/subscriptions?status=error">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                View All
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : errorSubscriptions.length === 0 ? (
          <Alert>
            <AlertDescription className="text-center">
              No errors found. All subscriptions are healthy!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {errorSubscriptions.map((subscription) => {
              const isRetrying = retryingIds.has(subscription.id)

              return (
                <div
                  key={subscription.id}
                  className="p-4 border rounded-lg space-y-3 hover:bg-accent/50 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/subscriptions?id=${subscription.id}`}
                        className="font-medium hover:underline block truncate"
                      >
                        {subscription.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="destructive" className="text-xs h-5">
                          Error
                        </Badge>
                        <span>•</span>
                        <span>
                          Last checked {formatRelativeTime(subscription.last_checked_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  <div className="bg-destructive/10 rounded-md p-3">
                    <p className="text-sm text-destructive line-clamp-2">
                      {subscription.last_error}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetry(subscription.id, subscription.source_url)}
                      disabled={isRetrying}
                    >
                      <RefreshCw
                        className={`h-3 w-3 mr-1 ${isRetrying ? "animate-spin" : ""}`}
                      />
                      {isRetrying ? "Retrying..." : "Retry"}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit?.(subscription.id)}
                      disabled={!onEdit}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDisable(subscription.id)}
                      disabled={updateSubscription.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <PauseCircle className="h-3 w-3 mr-1" />
                      Disable
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
