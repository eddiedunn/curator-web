import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface LoadingSkeletonProps {
  /** Variant of the skeleton to display */
  variant?: "card" | "list" | "stats" | "table" | "form"
  /** Number of skeleton items to display */
  count?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Reusable loading skeleton component with multiple variants
 * Provides accessible loading states with ARIA labels
 */
export function LoadingSkeleton({
  variant = "card",
  count = 3,
  className,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (variant === "card") {
    return (
      <div
        className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}
        role="status"
        aria-label="Loading content"
      >
        {items.map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (variant === "list") {
    return (
      <div
        className={cn("space-y-4", className)}
        role="status"
        aria-label="Loading content"
      >
        {items.map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (variant === "stats") {
    return (
      <div
        className={cn("grid grid-cols-1 md:grid-cols-4 gap-4", className)}
        role="status"
        aria-label="Loading statistics"
      >
        {items.map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (variant === "table") {
    return (
      <div
        className={cn("space-y-3", className)}
        role="status"
        aria-label="Loading table"
      >
        {/* Table header */}
        <div className="flex gap-4 pb-3 border-b">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
        </div>
        {/* Table rows */}
        {items.map((i) => (
          <div key={i} className="flex gap-4 py-3">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/4" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === "form") {
    return (
      <div
        className={cn("space-y-4", className)}
        role="status"
        aria-label="Loading form"
      >
        {items.map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    )
  }

  return null
}

/**
 * Individual skeleton components for more granular control
 */
export const SkeletonCard = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </CardContent>
  </Card>
)

export const SkeletonListItem = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export const SkeletonStat = () => (
  <Card>
    <CardContent className="pt-6">
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-32" />
    </CardContent>
  </Card>
)
