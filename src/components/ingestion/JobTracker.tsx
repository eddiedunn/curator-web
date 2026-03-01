import * as React from "react"
import { X, ExternalLink } from "lucide-react"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useJobStatus } from "@/hooks/useJobStatus"
import { truncateUrl } from "@/lib/utils"
import type { FetchJobResponse, IngestionStatus } from "@/api/types"

export interface JobTrackerProps {
  /** The job ID to track */
  jobId: string

  /** Optional callback when job completes */
  onComplete?: (result: FetchJobResponse) => void

  /** Optional callback to cancel/dismiss the job tracker */
  onDismiss?: () => void
}

// Status badge variants mapping
const STATUS_VARIANTS: Record<IngestionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  in_progress: "default",
  completed: "default",
  failed: "destructive",
}

// Status display text
const STATUS_TEXT: Record<IngestionStatus, string> = {
  pending: "Pending",
  in_progress: "Processing",
  completed: "Completed",
  failed: "Failed",
}

/**
 * Truncate a UUID for display (show first 8 characters)
 */
function truncateJobId(jobId: string): string {
  return jobId.slice(0, 8)
}

/**
 * Format elapsed time in seconds to a human-readable string
 */
function formatElapsedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * JobTracker component displays active fetch job with real-time updates
 *
 * Features:
 * - Job ID (truncated UUID)
 * - Source URL (truncated)
 * - Status badge (Pending/Processing/Completed/Failed)
 * - Progress indicator (indeterminate while pending/processing)
 * - Elapsed time (e.g., "Running for 45s")
 * - Cancel button (dismiss tracker)
 * - View result button (when completed, links to ingested item)
 * - Auto-removes after 2 minutes of completion
 */
export function JobTracker({ jobId, onComplete, onDismiss }: JobTrackerProps) {
  const { data: job, isLoading, error } = useJobStatus(jobId)
  const [startTime] = React.useState(() => Date.now())
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0)
  const [shouldHide, setShouldHide] = React.useState(false)

  // Track elapsed time
  React.useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedSeconds(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  // Call onComplete when job completes
  React.useEffect(() => {
    if (job && (job.status === "completed" || job.status === "failed")) {
      onComplete?.(job)
    }
  }, [job, onComplete])

  // Auto-hide after 2 minutes of completion
  React.useEffect(() => {
    if (job && (job.status === "completed" || job.status === "failed")) {
      const timeout = setTimeout(() => {
        setShouldHide(true)
        onDismiss?.()
      }, 2 * 60 * 1000) // 2 minutes

      return () => clearTimeout(timeout)
    }
  }, [job, onDismiss])

  // Don't render if should hide
  if (shouldHide) {
    return null
  }

  // Show loading state
  if (isLoading || !job) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">
                Loading job {truncateJobId(jobId)}...
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card className="border-l-4 border-l-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-medium">Job {truncateJobId(jobId)}</div>
              <div className="text-sm text-destructive">Failed to load job status</div>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const isActive = job.status === "pending" || job.status === "in_progress"
  const isCompleted = job.status === "completed"
  const isFailed = job.status === "failed"

  // Border color based on status
  const borderColor = isFailed
    ? "border-l-destructive"
    : isCompleted
    ? "border-l-green-500"
    : "border-l-blue-500"

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="pt-6 pb-3">
        <div className="space-y-3">
          {/* Header: Job ID, URL, and Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono text-muted-foreground">
                  {truncateJobId(jobId)}
                </span>
                <Badge variant={STATUS_VARIANTS[job.status]}>
                  {STATUS_TEXT[job.status]}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {truncateUrl(job.source_url, 60)}
              </div>
            </div>

            {/* Dismiss button */}
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="h-8 w-8 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress bar (indeterminate for active jobs) */}
          {isActive && (
            <div className="space-y-1">
              <Progress value={undefined} className="h-1.5 animate-pulse" />
            </div>
          )}

          {/* Elapsed time */}
          <div className="text-xs text-muted-foreground">
            {isActive && `Running for ${formatElapsedTime(elapsedSeconds)}`}
            {isCompleted && `Completed in ${formatElapsedTime(elapsedSeconds)}`}
            {isFailed && `Failed after ${formatElapsedTime(elapsedSeconds)}`}
          </div>

          {/* Message */}
          {job.message && (
            <div className="text-sm">
              {job.message}
            </div>
          )}
        </div>
      </CardContent>

      {/* Footer: Action buttons */}
      {isCompleted && (
        <CardFooter className="pt-0">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={`/ingestion?search=${encodeURIComponent(job.source_url)}`}
              className="inline-flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Result
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
