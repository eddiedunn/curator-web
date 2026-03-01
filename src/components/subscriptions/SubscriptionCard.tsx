import * as React from "react"
import { Link } from "react-router-dom"
import {
  MoreVertical,
  Copy,
  Check,
  ExternalLink,
  Edit,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "./StatusBadge"
import { formatRelativeTime, truncateUrl } from "@/lib/utils"
import type { SubscriptionResponse, SubscriptionType } from "@/api/types"
import { useUpdateSubscription, useDeleteSubscription } from "@/hooks/useSubscriptions"
import { curatorClient } from "@/api/client"

export interface SubscriptionCardProps {
  subscription: SubscriptionResponse
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

// Icon mapping for subscription types
const TYPE_ICONS: Record<SubscriptionType, string> = {
  youtube_channel: "📺",
  rss_feed: "📰",
  podcast: "🎙️",
}

export function SubscriptionCard({
  subscription,
  onEdit,
  onDelete,
}: SubscriptionCardProps) {
  const [copied, setCopied] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [showError, setShowError] = React.useState(false)
  const [isRetrying, setIsRetrying] = React.useState(false)
  const [itemCount, setItemCount] = React.useState<number | null>(null)

  const updateSubscription = useUpdateSubscription()
  const deleteSubscription = useDeleteSubscription()

  // Fetch item count for this subscription
  React.useEffect(() => {
    const fetchItemCount = async () => {
      try {
        const items = await curatorClient.listIngestedItems({
          subscription_id: subscription.id,
        })
        setItemCount(items.length)
      } catch (error) {
        console.error("Failed to fetch item count:", error)
        setItemCount(0)
      }
    }

    fetchItemCount()
  }, [subscription.id])

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(subscription.source_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy URL:", error)
    }
  }

  // Toggle pause/resume
  const handleTogglePause = async () => {
    try {
      await updateSubscription.mutateAsync({
        id: subscription.id,
        data: { enabled: !subscription.enabled },
      })
    } catch (error) {
      console.error("Failed to toggle subscription:", error)
    }
  }

  // Retry now (force immediate check)
  const handleRetryNow = async () => {
    setIsRetrying(true)
    try {
      // Trigger a fetch job for this subscription
      await curatorClient.triggerFetch({
        source_url: subscription.source_url,
        subscription_id: subscription.id,
      })
      // You might want to show a success message here
    } catch (error) {
      console.error("Failed to retry subscription:", error)
    } finally {
      setIsRetrying(false)
    }
  }

  // Delete subscription
  const handleDelete = async () => {
    try {
      await deleteSubscription.mutateAsync(subscription.id)
      setShowDeleteDialog(false)
      onDelete?.(subscription.id)
    } catch (error) {
      console.error("Failed to delete subscription:", error)
    }
  }

  const typeIcon = TYPE_ICONS[subscription.subscription_type] || "📄"

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Type Icon */}
              <span className="text-2xl sm:text-3xl flex-shrink-0" role="img" aria-label={subscription.subscription_type}>
                {typeIcon}
              </span>

              {/* Name and Status */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold truncate">
                  {subscription.name}
                </h3>
                <div className="mt-1">
                  <StatusBadge status={subscription.status} />
                </div>
              </div>
            </div>

            {/* Actions Dropdown - Touch-friendly */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0 min-h-[44px] min-w-[44px]">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    to={`/ingested?subscription=${subscription.id}`}
                    className="flex items-center cursor-pointer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Items
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEdit?.(subscription.id)}
                  disabled={!onEdit}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
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
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleRetryNow}
                  disabled={isRetrying}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
                  Retry Now
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-4 sm:p-6">
          {/* Source URL with copy button */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate" title={subscription.source_url}>
              {truncateUrl(subscription.source_url, 60)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-8 sm:w-8 flex-shrink-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              onClick={handleCopyUrl}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Copy URL</span>
            </Button>
          </div>

          {/* Metadata row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Last checked:</span>
              <br />
              <span className="font-medium">
                {formatRelativeTime(subscription.last_checked_at)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Check frequency:</span>
              <br />
              <span className="font-medium">
                Every {subscription.check_frequency_minutes} minutes
              </span>
            </div>
          </div>

          {/* Item count */}
          <div className="text-sm">
            <span className="text-muted-foreground">Items ingested:</span>
            <br />
            <span className="font-medium">
              {itemCount !== null ? `${itemCount} items` : "Loading..."}
            </span>
          </div>

          {/* Error message (collapsible) */}
          {subscription.status === "error" && subscription.last_error && (
            <div className="mt-3">
              <button
                onClick={() => setShowError(!showError)}
                className="flex items-center gap-2 text-sm font-medium text-destructive hover:underline"
              >
                {showError ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {showError ? "Hide" : "Show"} Error Message
              </button>
              {showError && (
                <div className="mt-2 p-3 bg-destructive/10 rounded-md text-sm text-destructive">
                  {subscription.last_error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{subscription.name}"? This action
              cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteSubscription.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSubscription.isPending}
            >
              {deleteSubscription.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
