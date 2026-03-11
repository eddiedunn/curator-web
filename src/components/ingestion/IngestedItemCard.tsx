import * as React from "react"
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Circle,
  ExternalLink,
  RotateCw,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatRelativeTime } from "@/lib/utils"
import type { IngestedItemResponse, IngestionStatus } from "@/api/types"

export interface IngestedItemCardProps {
  /** The ingested item data */
  item: IngestedItemResponse

  /** Base URL for Engram web UI (defaults to env var) */
  engramWebUrl?: string

  /** Optional callback when subscription name is clicked */
  onSubscriptionClick?: (subscriptionId: string) => void

  /** Optional callback when retry is requested */
  onRetry?: (itemId: string) => void

  /** Optional callback when reprocess is requested */
  onReprocess?: (itemId: string) => void

  /** Optional callback when delete is requested */
  onDelete?: (itemId: string) => void

  /** Optional subscription name (if linked to a subscription) */
  subscriptionName?: string
}

// Status icon mapping
const STATUS_ICONS: Record<IngestionStatus, React.ReactNode> = {
  completed: <CheckCircle className="h-5 w-5 text-green-600" />,
  failed: <AlertTriangle className="h-5 w-5 text-destructive" />,
  in_progress: <Clock className="h-5 w-5 text-blue-600 animate-pulse" />,
  processing: <Clock className="h-5 w-5 text-blue-600 animate-pulse" />,
  pending: <Circle className="h-5 w-5 text-muted-foreground" />,
}

// Status text mapping
const STATUS_TEXT: Record<IngestionStatus, string> = {
  completed: "✓ Completed",
  failed: "⚠ Failed",
  in_progress: "⏳ In Progress",
  processing: "⏳ Processing",
  pending: "○ Pending",
}

// Source type badge variants
const SOURCE_TYPE_LABELS: Record<string, string> = {
  youtube: "YOUTUBE",
  rss: "RSS",
  podcast: "PODCAST",
}

export function IngestedItemCard({
  item,
  engramWebUrl,
  onSubscriptionClick,
  onRetry,
  onReprocess,
  onDelete,
  subscriptionName,
}: IngestedItemCardProps) {
  const [showError, setShowError] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [showReprocessDialog, setShowReprocessDialog] = React.useState(false)

  // Get Engram web URL from env or prop
  const engramUrl = engramWebUrl || import.meta.env.VITE_ENGRAM_WEB_URL || "http://localhost:8800"
  const engramContentUrl = `${engramUrl}/content/${item.source_id}`

  // Format source type for display
  const sourceTypeLabel = SOURCE_TYPE_LABELS[item.source_type.toLowerCase()] || item.source_type.toUpperCase()

  // Handle retry action
  const handleRetry = () => {
    onRetry?.(item.id)
  }

  // Handle reprocess action
  const handleReprocess = () => {
    setShowReprocessDialog(false)
    onReprocess?.(item.id)
  }

  // Handle delete action
  const handleDelete = () => {
    setShowDeleteDialog(false)
    onDelete?.(item.id)
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-1">
              {STATUS_ICONS[item.status]}
            </div>

            {/* Title and Badges */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold mb-2 break-words">
                {item.title}
              </h3>

              <div className="flex flex-wrap gap-2 items-center">
                {/* Source Type Badge */}
                <Badge variant="default">{sourceTypeLabel}</Badge>

                {/* Status Text */}
                <span className="text-sm text-muted-foreground">
                  {STATUS_TEXT[item.status]}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-4 sm:p-6">
          {/* Subscription Name (if linked) */}
          {item.subscription_id && subscriptionName && (
            <div className="text-sm">
              <span className="text-muted-foreground">Subscription: </span>
              {onSubscriptionClick ? (
                <button
                  onClick={() => onSubscriptionClick(item.subscription_id!)}
                  className="font-medium text-primary hover:underline"
                >
                  {subscriptionName}
                </button>
              ) : (
                <span className="font-medium">{subscriptionName}</span>
              )}
            </div>
          )}

          {/* Author (if available) */}
          {item.author && (
            <div className="text-sm">
              <span className="text-muted-foreground">Author: </span>
              <span className="font-medium">{item.author}</span>
            </div>
          )}

          {/* Published Date (if available) */}
          {item.published_at && (
            <div className="text-sm">
              <span className="text-muted-foreground">Published: </span>
              <span className="font-medium">
                {new Date(item.published_at).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Ingested Timestamp */}
          <div className="text-sm">
            <span className="text-muted-foreground">Ingested: </span>
            <span className="font-medium">
              {formatRelativeTime(item.ingested_at)}
            </span>
          </div>

          {/* Chunk Count */}
          <div className="text-sm">
            <span className="text-muted-foreground">Chunks: </span>
            <span className="font-medium">{item.chunk_count} chunks</span>
          </div>

          {/* Error Message (if status=failed) */}
          {item.status === "failed" && item.error_message && (
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
                {showError ? "Hide" : "Show"} Error Details
              </button>
              {showError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Ingestion Error</AlertTitle>
                  <AlertDescription className="mt-2">
                    <pre className="whitespace-pre-wrap text-xs font-mono">
                      {item.error_message}
                    </pre>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2 pt-3 p-4 sm:p-6">
          {/* View in Engram */}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="min-h-[44px] flex-1 sm:flex-none"
          >
            <a
              href={engramContentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View in Engram
            </a>
          </Button>

          {/* Retry (for failed items) */}
          {item.status === "failed" && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}

          {/* Reprocess */}
          {onReprocess && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReprocessDialog(true)}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reprocess
            </Button>
          )}

          {/* Delete */}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive min-h-[44px] flex-1 sm:flex-none"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Reprocess Confirmation Dialog */}
      <Dialog open={showReprocessDialog} onOpenChange={setShowReprocessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprocess Item</DialogTitle>
            <DialogDescription>
              This will delete the item from Engram and re-ingest it. The content will be
              re-fetched and re-chunked. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReprocessDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleReprocess}
            >
              Reprocess
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{item.title}"? This will remove the item
              from tracking. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
