import * as React from "react"
import { AlertCircle, RefreshCw, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ErrorMessageProps {
  /** Error title */
  title?: string
  /** Error message or description */
  message?: string | Error
  /** Error object for detailed display */
  error?: Error | unknown
  /** Callback function to retry the failed operation */
  onRetry?: () => void
  /** Whether the retry button is in a loading state */
  retrying?: boolean
  /** Variant of the error display */
  variant?: "default" | "destructive" | "minimal"
  /** Additional CSS classes */
  className?: string
  /** Whether to show error details (stack trace, etc.) */
  showDetails?: boolean
}

/**
 * Reusable error message component with retry functionality
 * Provides accessible error states with ARIA labels
 */
export function ErrorMessage({
  title = "Error",
  message,
  error,
  onRetry,
  retrying = false,
  variant = "destructive",
  className,
  showDetails = false,
}: ErrorMessageProps) {
  const [detailsExpanded, setDetailsExpanded] = React.useState(false)

  // Extract error message
  const errorMessage = React.useMemo((): string => {
    if (message) {
      return message instanceof Error ? message.message : message
    }
    if (error) {
      if (error instanceof Error) {
        return error.message
      }
      if (typeof error === "string") {
        return error
      }
      if (typeof error === "object" && error !== null && "message" in error) {
        return String((error as { message: unknown }).message)
      }
      return "An unexpected error occurred"
    }
    return "An unexpected error occurred"
  }, [message, error])

  // Extract error details/stack
  const errorDetails = React.useMemo(() => {
    const err = error instanceof Error ? error : message instanceof Error ? message : null
    if (!err) return null

    return {
      name: err.name,
      stack: err.stack,
      cause: err.cause as string | undefined,
    }
  }, [error, message])

  if (variant === "minimal") {
    return (
      <div
        className={cn("flex items-center gap-2 text-sm text-destructive", className)}
        role="alert"
        aria-live="polite"
      >
        <XCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span>{errorMessage}</span>
        {onRetry && (
          <Button
            variant="link"
            size="sm"
            onClick={onRetry}
            disabled={retrying}
            className="h-auto p-0 text-destructive hover:text-destructive/90"
          >
            {retrying ? "Retrying..." : "Retry"}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Alert
      variant={variant}
      className={className}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <div className="space-y-3">
          <p>{errorMessage}</p>

          {showDetails && errorDetails && (
            <div className="mt-3">
              <button
                onClick={() => setDetailsExpanded(!detailsExpanded)}
                className="text-xs font-medium underline hover:no-underline"
              >
                {detailsExpanded ? "Hide details" : "Show details"}
              </button>

              {detailsExpanded && (
                <div className="mt-2 p-3 bg-background/50 rounded border text-xs font-mono space-y-2">
                  {errorDetails.name && (
                    <div>
                      <strong>Error Type:</strong> {errorDetails.name}
                    </div>
                  )}
                  {errorDetails.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-[10px]">
                        {errorDetails.stack}
                      </pre>
                    </div>
                  )}
                  {errorDetails.cause && (
                    <div>
                      <strong>Cause:</strong>{" "}
                      {typeof errorDetails.cause === "object"
                        ? JSON.stringify(errorDetails.cause)
                        : String(errorDetails.cause)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={retrying}
              className="mt-2"
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", retrying && "animate-spin")}
                aria-hidden="true"
              />
              {retrying ? "Retrying..." : "Retry"}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Specialized error message for API/network errors
 */
export function ApiErrorMessage({
  error,
  onRetry,
  retrying,
  className,
}: {
  error: unknown
  onRetry?: () => void
  retrying?: boolean
  className?: string
}) {
  // Try to extract meaningful error information from API errors
  const errorInfo = React.useMemo(() => {
    if (error instanceof Error) {
      return {
        title: "Request Failed",
        message: error.message,
      }
    }

    if (typeof error === "object" && error !== null) {
      const err = error as Record<string, unknown>

      // Check for common API error shapes
      if (err.response && typeof err.response === "object") {
        const response = err.response as Record<string, unknown>
        const data = response.data as Record<string, unknown> | undefined

        return {
          title: `Error ${response.status || ""}`,
          message: data?.message || data?.error || "The server returned an error",
        }
      }

      if (err.message) {
        return {
          title: "Request Failed",
          message: String(err.message),
        }
      }
    }

    return {
      title: "Network Error",
      message: "Failed to connect to the server. Please check your connection and try again.",
    }
  }, [error])

  const isDevelopment = typeof import.meta !== "undefined" && import.meta.env?.DEV

  return (
    <ErrorMessage
      title={errorInfo.title}
      message={String(errorInfo.message)}
      error={error}
      onRetry={onRetry}
      retrying={retrying}
      className={className}
      showDetails={isDevelopment}
    />
  )
}
