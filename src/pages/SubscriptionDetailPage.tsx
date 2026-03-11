import * as React from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Trash2,
  Youtube,
  Rss,
  Podcast,
  Copy,
  Check,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/subscriptions/StatusBadge"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { ErrorMessage } from "@/components/ErrorMessage"
import { useSubscription, useUpdateSubscription, useDeleteSubscription } from "@/hooks/useSubscriptions"
import { useIngestedItems } from "@/hooks/useIngestedItems"
import { curatorClient } from "@/api/client"
import { formatRelativeTime } from "@/lib/utils"
import type { SubscriptionType } from "@/api/types"
import { cn } from "@/lib/utils"

const TYPE_CONFIG: Record<SubscriptionType, { icon: typeof Youtube; color: string; label: string }> = {
  youtube_channel: { icon: Youtube, color: "text-red-500 bg-red-500/10", label: "YouTube Channel" },
  rss_feed: { icon: Rss, color: "text-orange-500 bg-orange-500/10", label: "RSS Feed" },
  podcast: { icon: Podcast, color: "text-purple-500 bg-purple-500/10", label: "Podcast" },
}

export function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [isRetrying, setIsRetrying] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const { data: subscription, isLoading, error, refetch } = useSubscription(id!)
  const { data: items = [] } = useIngestedItems({ subscription_id: id })
  const updateSubscription = useUpdateSubscription()
  const deleteSubscription = useDeleteSubscription()

  const handleTogglePause = async () => {
    if (!subscription) return
    try {
      await updateSubscription.mutateAsync({
        id: subscription.id,
        data: { enabled: !subscription.enabled },
      })
    } catch (error) {
      console.error("Failed to toggle subscription:", error)
    }
  }

  const handleRetryNow = async () => {
    if (!subscription) return
    setIsRetrying(true)
    try {
      await curatorClient.triggerFetch({
        source_url: subscription.source_url,
        subscription_id: subscription.id,
      })
    } catch (error) {
      console.error("Failed to retry subscription:", error)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleDelete = async () => {
    if (!subscription) return
    try {
      await deleteSubscription.mutateAsync(subscription.id)
      setShowDeleteDialog(false)
      navigate("/subscriptions")
    } catch (error) {
      console.error("Failed to delete subscription:", error)
    }
  }

  const handleCopyUrl = async () => {
    if (!subscription) return
    try {
      await navigator.clipboard.writeText(subscription.source_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy URL:", error)
    }
  }

  if (isLoading) return <LoadingSkeleton variant="card" count={2} />
  if (error) {
    return (
      <ErrorMessage
        title="Failed to load subscription"
        message="Unable to fetch subscription details."
        error={error}
        onRetry={() => refetch()}
      />
    )
  }
  if (!subscription) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground">Subscription not found</h2>
        <Link to="/subscriptions" className="text-primary hover:underline mt-2 inline-block">
          Back to subscriptions
        </Link>
      </div>
    )
  }

  const typeConfig = TYPE_CONFIG[subscription.subscription_type] || { icon: Rss, color: "text-muted-foreground bg-muted", label: subscription.subscription_type }
  const TypeIcon = typeConfig.icon

  // Recent items (latest 5)
  const recentItems = [...items]
    .sort((a, b) => new Date(b.ingested_at).getTime() - new Date(a.ingested_at).getTime())
    .slice(0, 5)

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/subscriptions">Subscriptions</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{subscription.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/subscriptions">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className={cn("rounded-full p-2.5", typeConfig.color)}>
              <TypeIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{subscription.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={subscription.status} />
                <span className="text-sm text-muted-foreground">{typeConfig.label}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/subscriptions/${subscription.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePause}
              disabled={updateSubscription.isPending}
            >
              {subscription.enabled ? (
                <>
                  <PauseCircle className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Resume
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryNow}
              disabled={isRetrying}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
              Retry Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Source URL</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={subscription.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline break-all"
                    >
                      {subscription.source_url}
                    </a>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={handleCopyUrl}>
                      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Check Frequency</p>
                  <p className="text-sm font-medium">Every {subscription.check_frequency_minutes} minutes</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Checked</p>
                  <p className="text-sm font-medium">{formatRelativeTime(subscription.last_checked_at)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{formatRelativeTime(subscription.created_at)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Enabled</p>
                  <p className="text-sm font-medium">{subscription.enabled ? "Yes" : "No"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Items Ingested</p>
                  <p className="text-sm font-medium">{items.length} items</p>
                </div>
              </div>

              {/* Error message */}
              {subscription.status === "error" && subscription.last_error && (
                <div className="bg-destructive/10 rounded-md p-3">
                  <p className="text-sm font-medium text-destructive mb-1">Last Error</p>
                  <p className="text-sm text-destructive">{subscription.last_error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats sidebar */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center pb-4 border-b border-border">
                <div className="text-4xl font-bold">{items.length}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 rounded-lg bg-green-500/10">
                  <div className="text-xl font-bold text-green-600">
                    {items.filter((i) => i.status === "completed").length}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-500/10">
                  <div className="text-xl font-bold text-red-600">
                    {items.filter((i) => i.status === "failed").length}
                  </div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link to={`/ingested?subscription=${subscription.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View All Items
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Items */}
        {recentItems.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Items</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/ingested?subscription=${subscription.id}`}>View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(item.ingested_at)}</p>
                    </div>
                    <Badge
                      variant={item.status === "completed" ? "default" : item.status === "failed" ? "destructive" : "secondary"}
                      className="ml-2 text-xs"
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{subscription.name}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleteSubscription.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteSubscription.isPending}>
              {deleteSubscription.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
