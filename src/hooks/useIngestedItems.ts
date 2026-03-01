import { useQuery } from '@tanstack/react-query'
import { curatorClient, type ListIngestedItemsParams } from '../api/client'
import type { IngestedItemResponse } from '../api/types'

/**
 * Hook to fetch a list of ingested items with optional filtering
 * @param params - Optional query parameters (subscription_id, source_type, status, limit, offset)
 * @returns Query result with ingested items array
 */
export function useIngestedItems(params?: ListIngestedItemsParams) {
  return useQuery({
    queryKey: ['ingested', params],
    queryFn: () => curatorClient.listIngestedItems(params),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to fetch a single ingested item by ID
 * @param id - Ingested item ID
 * @returns Query result with ingested item data
 */
export function useIngestedItem(id: string) {
  return useQuery({
    queryKey: ['ingested', id],
    queryFn: () => curatorClient.getIngestedItem(id),
    enabled: !!id,
  })
}

/**
 * Derived hook that aggregates counts from ingested items
 * @returns Object with counts for total, completed, failed, pending, and in_progress items
 */
export function useIngestedStats() {
  const { data: items = [] } = useIngestedItems()

  const stats = {
    total: items.length,
    completed: items.filter((item: IngestedItemResponse) => item.status === 'completed').length,
    failed: items.filter((item: IngestedItemResponse) => item.status === 'failed').length,
    pending: items.filter((item: IngestedItemResponse) => item.status === 'pending').length,
    in_progress: items.filter((item: IngestedItemResponse) => item.status === 'in_progress').length,
  }

  return stats
}
