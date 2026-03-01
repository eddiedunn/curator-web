import { Badge } from "@/components/ui/badge"
import type { SubscriptionStatus } from "@/api/types"

interface StatusBadgeProps {
  status: SubscriptionStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<
    SubscriptionStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    active: {
      label: "Active",
      variant: "default",
    },
    paused: {
      label: "Paused",
      variant: "secondary",
    },
    error: {
      label: "Error",
      variant: "destructive",
    },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className="font-medium">
      {config.label}
    </Badge>
  )
}
