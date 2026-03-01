import { useQuery } from '@tanstack/react-query'
import { curatorClient } from '../api/client'
import type { FetchJobResponse } from '../api/types'

/**
 * Options for the useJobStatus hook
 */
export interface UseJobStatusOptions {
  /** Whether the query is enabled (default: true when jobId is not null) */
  enabled?: boolean
}

/**
 * Hook to track the status of a fetch/ingestion job with automatic polling
 * @param jobId - The job ID to track (null to disable the query)
 * @param options - Optional configuration (enabled)
 * @returns Query result with job status data
 *
 * The hook automatically polls every 5 seconds while the job is pending or in_progress.
 * Polling stops when the job reaches completed or failed status.
 */
export function useJobStatus(
  jobId: string | null,
  options?: UseJobStatusOptions
) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => {
      if (!jobId) {
        throw new Error('Job ID is required')
      }
      return curatorClient.getJobStatus(jobId)
    },
    enabled: jobId !== null && (options?.enabled !== false),
    refetchInterval: (query) => {
      // Get the latest data from the query
      const data = query.state.data as FetchJobResponse | undefined

      // Continue polling if status is pending or in_progress
      if (data?.status === 'pending' || data?.status === 'in_progress') {
        return 5000 // 5 seconds
      }

      // Stop polling for completed or failed status
      return false
    },
  })
}
