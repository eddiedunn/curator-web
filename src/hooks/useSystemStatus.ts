import { useQuery } from '@tanstack/react-query'
import { curatorClient } from '../api/client'
import { useSubscriptions } from './useSubscriptions'
import { useIngestedItems } from './useIngestedItems'

/**
 * Hook to fetch system status information
 * @returns Query result with system status data
 */
export function useSystemStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: () => curatorClient.getStatus(),
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds (auto-refresh)
  })
}

/**
 * Hook to fetch health check information
 * @returns Query result with health data
 */
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => curatorClient.getHealth(),
    staleTime: 10000, // 10 seconds
  })
}

/**
 * Derived hook that computes dashboard statistics
 * Combines data from useSystemStatus, useSubscriptions, and useIngestedItems
 * @returns Object with aggregated statistics for the dashboard
 */
export function useDerivedStats() {
  const { data: status } = useSystemStatus()
  const { data: subscriptions = [] } = useSubscriptions()
  const { data: items = [] } = useIngestedItems()

  // Count subscriptions by status
  const totalSubscriptions = subscriptions.length
  const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active').length
  const errorSubscriptions = subscriptions.filter((sub) => sub.status === 'error').length

  // Count items by status
  const totalItems = items.length
  const completedItems = items.filter((item) => item.status === 'completed').length
  const failedItems = items.filter((item) => item.status === 'failed').length

  // Get system status information
  const daemonRunning = status?.daemon_running ?? false
  const lastCheckTime = status ? new Date().toISOString() : undefined
  const uptime = status?.uptime_seconds

  return {
    totalSubscriptions,
    activeSubscriptions,
    errorSubscriptions,
    totalItems,
    completedItems,
    failedItems,
    daemonRunning,
    lastCheckTime,
    uptime,
  }
}
