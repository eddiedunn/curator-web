import * as React from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { ErrorMessage } from "@/components/ErrorMessage"
import { NoResultsFound, NoItemsYet } from "@/components/EmptyState"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SubscriptionCard } from "@/components/subscriptions/SubscriptionCard"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import { curatorClient } from "@/api/client"
import { formatRelativeTime } from "@/lib/utils"

type SortOption = "name-asc" | "name-desc" | "recently-checked" | "most-items"

export function SubscriptionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get("search") || "")
  const [typeFilter, setTypeFilter] = React.useState<string>(searchParams.get("type") || "all")
  const [statusFilter, setStatusFilter] = React.useState<string>(searchParams.get("status") || "all")
  const [sortBy, setSortBy] = React.useState<SortOption>("name-asc")
  const [daemonStatus, setDaemonStatus] = React.useState<{
    running: boolean
    lastCheck?: string
  } | null>(null)
  const [itemCounts, setItemCounts] = React.useState<Record<string, number>>({})

  // Build query params for useSubscriptions hook
  const queryParams = React.useMemo(() => {
    const params: { enabled_only?: boolean; subscription_type?: string } = {}

    if (statusFilter === "active") {
      params.enabled_only = true
    }

    if (typeFilter !== "all") {
      params.subscription_type = typeFilter
    }

    return params
  }, [typeFilter, statusFilter])

  const { data: subscriptions, isLoading, error, refetch } = useSubscriptions(queryParams)

  // Fetch daemon status
  React.useEffect(() => {
    const fetchDaemonStatus = async () => {
      try {
        const status = await curatorClient.getStatus()
        setDaemonStatus({
          running: status.daemon_running,
          lastCheck: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Failed to fetch daemon status:", error)
      }
    }

    fetchDaemonStatus()
    const interval = setInterval(fetchDaemonStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch item counts for all subscriptions
  React.useEffect(() => {
    if (!subscriptions) return

    const fetchItemCounts = async () => {
      const counts: Record<string, number> = {}

      await Promise.all(
        subscriptions.map(async (sub) => {
          try {
            const items = await curatorClient.listIngestedItems({
              subscription_id: sub.id,
              limit: 10000,
            })
            counts[sub.id] = items.length
          } catch (error) {
            console.error(`Failed to fetch item count for subscription ${sub.id}:`, error)
            counts[sub.id] = 0
          }
        })
      )

      setItemCounts(counts)
    }

    fetchItemCounts()
  }, [subscriptions])

  // Filter and sort subscriptions
  const filteredAndSortedSubscriptions = React.useMemo(() => {
    if (!subscriptions) return []

    let filtered = [...subscriptions]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (sub) =>
          sub.name.toLowerCase().includes(query) ||
          sub.source_url.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== "all" && statusFilter !== "active") {
      if (statusFilter === "paused") {
        filtered = filtered.filter((sub) => !sub.enabled)
      } else if (statusFilter === "error") {
        filtered = filtered.filter((sub) => sub.status === "error")
      }
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name)
        case "name-desc":
          return b.name.localeCompare(a.name)
        case "recently-checked":
          const aTime = a.last_checked_at ? new Date(a.last_checked_at).getTime() : 0
          const bTime = b.last_checked_at ? new Date(b.last_checked_at).getTime() : 0
          return bTime - aTime
        case "most-items":
          return (itemCounts[b.id] || 0) - (itemCounts[a.id] || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [subscriptions, searchQuery, statusFilter, sortBy, itemCounts])

  // Calculate statistics
  const statistics = React.useMemo(() => {
    if (!subscriptions) return null

    const total = subscriptions.length
    const active = subscriptions.filter((sub) => sub.enabled).length
    const errorCount = subscriptions.filter((sub) => sub.status === "error").length

    return { total, active, errorCount }
  }, [subscriptions])

  // Sync URL params with filters
  React.useEffect(() => {
    const params = new URLSearchParams()

    if (typeFilter !== "all") {
      params.set("type", typeFilter)
    }

    if (statusFilter !== "all") {
      params.set("status", statusFilter)
    }

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim())
    }

    setSearchParams(params, { replace: true })
  }, [typeFilter, statusFilter, searchQuery, setSearchParams])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your content subscriptions</p>
        </div>
        <Button asChild className="min-h-[44px] w-full sm:w-auto">
          <Link to="/subscriptions/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Link>
        </Button>
      </div>

      {/* Statistics Banner */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-sm text-muted-foreground">Total Subscriptions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{statistics.errorCount}</div>
              <p className="text-sm text-muted-foreground">Errors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium">
                {daemonStatus?.running ? (
                  <span className="text-green-600">Daemon Running</span>
                ) : (
                  <span className="text-red-600">Daemon Stopped</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {daemonStatus?.lastCheck
                  ? `Checked ${formatRelativeTime(daemonStatus.lastCheck)}`
                  : "Never"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="youtube_channel">YouTube</SelectItem>
            <SelectItem value="rss_feed">RSS</SelectItem>
            <SelectItem value="podcast">Podcast</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
            <SelectItem value="recently-checked">Recently Checked</SelectItem>
            <SelectItem value="most-items">Most Items</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorMessage
          title="Failed to load subscriptions"
          message="Unable to fetch subscriptions. Please try again."
          error={error}
          onRetry={() => refetch()}
        />
      )}

      {/* Loading State */}
      {isLoading && <LoadingSkeleton variant="card" count={6} />}

      {/* Empty State */}
      {!isLoading && !error && filteredAndSortedSubscriptions.length === 0 && (
        <>
          {subscriptions && subscriptions.length > 0 ? (
            <NoResultsFound
              searchQuery={searchQuery}
              onClearFilters={() => {
                setSearchQuery("")
                setTypeFilter("all")
                setStatusFilter("all")
              }}
            />
          ) : (
            <NoItemsYet
              itemName="subscriptions"
              onCreateItem={() => window.location.href = "/subscriptions/new"}
              description="Get started by adding your first subscription to track content from your favorite sources."
            />
          )}
        </>
      )}

      {/* Subscriptions Grid */}
      {!isLoading && !error && filteredAndSortedSubscriptions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
            />
          ))}
        </div>
      )}
    </div>
  )
}
