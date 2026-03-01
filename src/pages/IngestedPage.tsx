import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react"

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
import { IngestedItemCard } from "@/components/ingestion/IngestedItemCard"
import { useIngestedItems } from "@/hooks/useIngestedItems"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import type { IngestedItemResponse } from "@/api/types"

type SortOption = "newest" | "oldest" | "title-asc"
type DateRangeOption = "7" | "30" | "90" | "all"

const ITEMS_PER_PAGE = 50

export function IngestedPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get("search") || "")
  const [subscriptionFilter, setSubscriptionFilter] = React.useState<string>(
    searchParams.get("subscription") || "all"
  )
  const [statusFilter, setStatusFilter] = React.useState<string>(searchParams.get("status") || "all")
  const [sourceTypeFilter, setSourceTypeFilter] = React.useState<string>(
    searchParams.get("source_type") || "all"
  )
  const [dateRange, setDateRange] = React.useState<DateRangeOption>(
    (searchParams.get("date_range") as DateRangeOption) || "all"
  )
  const [sortBy, setSortBy] = React.useState<SortOption>("newest")
  const [currentPage, setCurrentPage] = React.useState(
    parseInt(searchParams.get("page") || "1", 10)
  )

  // Build query params for useIngestedItems hook
  const queryParams = React.useMemo(() => {
    const params: {
      subscription_id?: string
      source_type?: string
      status?: string
      limit?: number
      offset?: number
    } = {}

    if (subscriptionFilter !== "all") {
      params.subscription_id = subscriptionFilter
    }

    if (statusFilter !== "all") {
      params.status = statusFilter
    }

    if (sourceTypeFilter !== "all") {
      params.source_type = sourceTypeFilter.toUpperCase()
    }

    // Note: Backend pagination would use limit/offset
    // For now, we fetch all and paginate client-side
    return params
  }, [subscriptionFilter, statusFilter, sourceTypeFilter])

  const { data: items = [], isLoading, error, refetch } = useIngestedItems(queryParams)
  const { data: subscriptions = [] } = useSubscriptions()

  // Build subscription ID to name map
  const subscriptionMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    subscriptions.forEach((sub) => {
      map[sub.id] = sub.name
    })
    return map
  }, [subscriptions])

  // Filter items by date range
  const dateFilteredItems = React.useMemo(() => {
    if (dateRange === "all") return items

    const now = new Date()
    const daysAgo = parseInt(dateRange, 10)
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    return items.filter((item: IngestedItemResponse) => {
      const ingestedDate = new Date(item.ingested_at)
      return ingestedDate >= cutoffDate
    })
  }, [items, dateRange])

  // Filter items by search query
  const searchFilteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return dateFilteredItems

    const query = searchQuery.toLowerCase().trim()
    return dateFilteredItems.filter((item: IngestedItemResponse) =>
      item.title.toLowerCase().includes(query) ||
      item.source_url.toLowerCase().includes(query)
    )
  }, [dateFilteredItems, searchQuery])

  // Sort items
  const sortedItems = React.useMemo(() => {
    const sorted = [...searchFilteredItems]

    sorted.sort((a: IngestedItemResponse, b: IngestedItemResponse) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.ingested_at).getTime() - new Date(a.ingested_at).getTime()
        case "oldest":
          return new Date(a.ingested_at).getTime() - new Date(b.ingested_at).getTime()
        case "title-asc":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return sorted
  }, [searchFilteredItems, sortBy])

  // Calculate statistics
  const statistics = React.useMemo(() => {
    const total = items.length
    const completed = items.filter((item: IngestedItemResponse) => item.status === "completed").length
    const failed = items.filter((item: IngestedItemResponse) => item.status === "failed").length
    const inProgress = items.filter((item: IngestedItemResponse) => item.status === "in_progress").length

    return { total, completed, failed, inProgress }
  }, [items])

  // Pagination
  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE)
  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return sortedItems.slice(start, end)
  }, [sortedItems, currentPage])

  // Sync URL params with filters
  React.useEffect(() => {
    const params = new URLSearchParams()

    if (subscriptionFilter !== "all") {
      params.set("subscription", subscriptionFilter)
    }

    if (statusFilter !== "all") {
      params.set("status", statusFilter)
    }

    if (sourceTypeFilter !== "all") {
      params.set("source_type", sourceTypeFilter)
    }

    if (dateRange !== "all") {
      params.set("date_range", dateRange)
    }

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim())
    }

    if (currentPage > 1) {
      params.set("page", currentPage.toString())
    }

    setSearchParams(params, { replace: true })
  }, [subscriptionFilter, statusFilter, sourceTypeFilter, dateRange, searchQuery, currentPage, setSearchParams])

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [subscriptionFilter, statusFilter, sourceTypeFilter, dateRange, searchQuery])

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Title", "Status", "Source Type", "Subscription", "Author", "Published At", "Ingested At", "Chunk Count", "Source URL"]
    const rows = sortedItems.map((item: IngestedItemResponse) => [
      item.title,
      item.status,
      item.source_type,
      item.subscription_id ? subscriptionMap[item.subscription_id] || item.subscription_id : "",
      item.author || "",
      item.published_at || "",
      item.ingested_at,
      item.chunk_count.toString(),
      item.source_url,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const escaped = cell.replace(/"/g, '""')
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped
        }).join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `ingested-items-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Ingested Items</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">View and manage ingested content</p>
          </div>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={sortedItems.length === 0}
            className="min-h-[44px] w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Statistics Banner */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatNumber(statistics.total)}</div>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{formatNumber(statistics.completed)}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{formatNumber(statistics.failed)}</div>
              <p className="text-sm text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{formatNumber(statistics.inProgress)}</div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Subscription Filter */}
            <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All subscriptions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscriptions</SelectItem>
                {subscriptions.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            {/* Source Type Filter */}
            <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="youtube">YOUTUBE</SelectItem>
                <SelectItem value="rss">RSS</SelectItem>
                <SelectItem value="podcast">PODCAST</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateRange} onValueChange={(val) => setDateRange(val as DateRangeOption)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Results Count */}
        {!isLoading && sortedItems.length > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(currentPage * ITEMS_PER_PAGE, sortedItems.length)} of {formatNumber(sortedItems.length)} items
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorMessage
            title="Failed to load ingested items"
            message="Unable to fetch ingested items. Please try again."
            error={error}
            onRetry={() => refetch()}
            className="mb-6"
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <LoadingSkeleton variant="list" count={5} />
        )}

        {/* Empty State */}
        {!isLoading && !error && sortedItems.length === 0 && (
          <>
            {items.length > 0 ? (
              <NoResultsFound
                searchQuery={searchQuery}
                onClearFilters={() => {
                  setSearchQuery("")
                  setSubscriptionFilter("all")
                  setStatusFilter("all")
                  setSourceTypeFilter("all")
                  setDateRange("all")
                }}
              />
            ) : (
              <NoItemsYet
                itemName="ingested items"
                description="Items will appear here once content is ingested from your subscriptions."
              />
            )}
          </>
        )}

        {/* Items List */}
        {!isLoading && !error && paginatedItems.length > 0 && (
          <div className="space-y-4">
            {paginatedItems.map((item: IngestedItemResponse) => (
              <IngestedItemCard
                key={item.id}
                item={item}
                subscriptionName={item.subscription_id ? subscriptionMap[item.subscription_id] : undefined}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls - Touch-friendly on mobile */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="min-h-[44px]"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Previous</span>
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="min-h-[44px] min-w-[44px]"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="min-h-[44px]"
            >
              <span className="hidden sm:inline mr-2">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
    </div>
  )
}
