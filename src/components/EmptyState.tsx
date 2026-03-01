import * as React from "react"
import { type LucideIcon, Inbox, Search, FileX, AlertCircle, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  /** Icon to display (Lucide icon component) */
  icon?: LucideIcon
  /** Title of the empty state */
  title: string
  /** Description text */
  description?: string
  /** Action button label */
  actionLabel?: string
  /** Action button callback */
  onAction?: () => void
  /** Variant preset for common scenarios */
  variant?: "default" | "search" | "error" | "create"
  /** Additional CSS classes */
  className?: string
  /** Whether to wrap in a Card component */
  wrapped?: boolean
}

/**
 * Reusable empty state component for zero results
 * Provides accessible empty states with customizable message and icon
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
  className,
  wrapped = true,
}: EmptyStateProps) {
  // Set default icon based on variant
  const DefaultIcon = React.useMemo(() => {
    if (Icon) return Icon
    switch (variant) {
      case "search":
        return Search
      case "error":
        return AlertCircle
      case "create":
        return Plus
      default:
        return Inbox
    }
  }, [Icon, variant])

  // Set default styles based on variant
  const iconColor = React.useMemo(() => {
    switch (variant) {
      case "error":
        return "text-destructive"
      case "search":
        return "text-muted-foreground"
      case "create":
        return "text-primary"
      default:
        return "text-muted-foreground"
    }
  }, [variant])

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div
        className={cn(
          "mb-6 rounded-full p-4 bg-muted/50",
          iconColor
        )}
      >
        <DefaultIcon className="h-12 w-12" aria-hidden="true" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant={variant === "create" ? "default" : "outline"}>
          {variant === "create" && <Plus className="mr-2 h-4 w-4" />}
          {actionLabel}
        </Button>
      )}
    </div>
  )

  if (wrapped) {
    return (
      <Card>
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    )
  }

  return content
}

/**
 * Specialized empty state for "no results found" scenarios
 */
export function NoResultsFound({
  searchQuery,
  onClearFilters,
  className,
}: {
  searchQuery?: string
  onClearFilters?: () => void
  className?: string
}) {
  return (
    <EmptyState
      variant="search"
      icon={FileX}
      title="No results found"
      description={
        searchQuery
          ? `No items match "${searchQuery}". Try adjusting your search or filters.`
          : "No items match your current filters. Try adjusting your search criteria."
      }
      actionLabel={onClearFilters ? "Clear filters" : undefined}
      onAction={onClearFilters}
      className={className}
    />
  )
}

/**
 * Specialized empty state for "no items yet" scenarios
 */
export function NoItemsYet({
  itemName,
  onCreateItem,
  description,
  className,
}: {
  itemName: string
  onCreateItem?: () => void
  description?: string
  className?: string
}) {
  return (
    <EmptyState
      variant="create"
      icon={Inbox}
      title={`No ${itemName} yet`}
      description={description || `Get started by creating your first ${itemName}.`}
      actionLabel={onCreateItem ? `Add ${itemName}` : undefined}
      onAction={onCreateItem}
      className={className}
    />
  )
}

/**
 * Specialized empty state for error scenarios
 */
export function ErrorEmptyState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <EmptyState
      variant="error"
      title={title}
      description={description}
      actionLabel={onRetry ? "Try again" : undefined}
      onAction={onRetry}
      className={className}
    />
  )
}
