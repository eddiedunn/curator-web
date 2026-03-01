import * as React from "react"
import { toast } from "sonner"
import { Loader2, Send, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { JobTracker } from "@/components/ingestion/JobTracker"
import { useManualFetch, useRecentJobs } from "@/hooks/useManualFetch"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import type { FetchJobResponse } from "@/api/types"

/**
 * ManualIngestPage component
 *
 * Provides a UI for manually triggering content ingestion from URLs.
 * Features:
 * - URL input with validation
 * - Optional subscription linking
 * - Active jobs tracking with auto-refresh
 * - Recent jobs history
 * - Toast notifications for success/failure
 */
export function ManualIngestPage() {
  // Form state
  const [url, setUrl] = React.useState("")
  const [subscriptionId, setSubscriptionId] = React.useState<string>("none")
  const [urlError, setUrlError] = React.useState<string>("")

  // Hooks
  const { mutate: triggerFetch, isPending, activeJobIds, removeActiveJob } = useManualFetch()
  const { data: subscriptions = [] } = useSubscriptions()
  const { data: recentJobs = [] } = useRecentJobs()

  // Ref for auto-scrolling to new jobs
  const activeJobsRef = React.useRef<HTMLDivElement>(null)
  const lastJobCountRef = React.useRef(activeJobIds.length)

  // Auto-scroll to new job when created
  React.useEffect(() => {
    if (activeJobIds.length > lastJobCountRef.current && activeJobsRef.current) {
      activeJobsRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
    lastJobCountRef.current = activeJobIds.length
  }, [activeJobIds.length])

  /**
   * Validate URL format
   */
  const validateUrl = (urlString: string): boolean => {
    if (!urlString.trim()) {
      setUrlError("URL is required")
      return false
    }

    try {
      const urlObj = new URL(urlString.trim())
      if (!urlObj.protocol.startsWith("http")) {
        setUrlError("URL must start with http:// or https://")
        return false
      }
      setUrlError("")
      return true
    } catch {
      setUrlError("Please enter a valid URL")
      return false
    }
  }

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateUrl(url)) {
      return
    }

    const requestData: { source_url: string; subscription_id?: string } = {
      source_url: url.trim(),
    }

    // Add subscription_id if selected
    if (subscriptionId !== "none") {
      requestData.subscription_id = subscriptionId
    }

    triggerFetch(requestData, {
      onSuccess: () => {
        toast.success("Job started successfully", {
          description: `Ingesting content from ${new URL(url.trim()).hostname}`,
        })
        // Clear form
        setUrl("")
        setSubscriptionId("none")
        setUrlError("")
      },
      onError: (error: any) => {
        toast.error("Failed to start job", {
          description: error?.message || "An unexpected error occurred",
        })
      },
    })
  }

  /**
   * Handle job completion
   */
  const handleJobComplete = (job: FetchJobResponse) => {
    if (job.status === "completed") {
      toast.success("Job completed", {
        description: `Successfully ingested content from ${new URL(job.source_url).hostname}`,
      })
    } else if (job.status === "failed") {
      toast.error("Job failed", {
        description: job.message || "Failed to ingest content",
      })
    }

    // Remove from active jobs after a delay to let user see the completion
    setTimeout(() => {
      removeActiveJob(job.job_id)
    }, 2000)
  }

  /**
   * Handle job dismissal
   */
  const handleJobDismiss = (jobId: string) => {
    removeActiveJob(jobId)
  }

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Manual Ingest</h1>
          <p className="text-slate-600 mt-1">Manually ingest content from URLs</p>
        </div>

        {/* Form Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ingest Content</CardTitle>
            <CardDescription>
              Enter a URL to ingest content. Supports YouTube videos, RSS articles, and podcasts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="text"
                  placeholder="https://example.com/content"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    if (urlError) {
                      setUrlError("")
                    }
                  }}
                  className={urlError ? "border-red-500" : ""}
                  disabled={isPending}
                />
                {urlError && (
                  <p className="text-sm text-red-500">{urlError}</p>
                )}
              </div>

              {/* Subscription Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="subscription">Link to Subscription (Optional)</Label>
                <Select
                  value={subscriptionId}
                  onValueChange={setSubscriptionId}
                  disabled={isPending}
                >
                  <SelectTrigger id="subscription">
                    <SelectValue placeholder="No subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No subscription</SelectItem>
                    {subscriptions.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Help Text */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Supports YouTube videos, RSS articles, podcasts, and other web content.
                  The system will automatically detect the content type and process it accordingly.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Job...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Ingest Content
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Jobs Section */}
        <div className="mb-8" ref={activeJobsRef}>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Active Jobs</h2>
          {activeJobIds.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No active jobs
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeJobIds.map((jobId) => (
                <JobTracker
                  key={jobId}
                  jobId={jobId}
                  onComplete={handleJobComplete}
                  onDismiss={() => handleJobDismiss(jobId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Jobs Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Jobs</h2>
          {recentJobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No recent jobs
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentJobs.slice(0, 10).map((job) => (
                    <div
                      key={job.job_id}
                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (job.status === "completed") {
                          window.location.href = `/ingestion?search=${encodeURIComponent(job.source_url)}`
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {job.source_url}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                job.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : job.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : job.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {job.status.replace("_", " ")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(job.timestamp)}
                            </span>
                          </div>
                        </div>
                        {job.status === "completed" && (
                          <div className="text-xs text-blue-600 hover:text-blue-800">
                            View →
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
    </div>
  )
}
