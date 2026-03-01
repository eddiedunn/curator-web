import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { curatorClient } from '../api/client'
import type { FetchJobRequest, FetchJobResponse } from '../api/types'

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

const ACTIVE_JOBS_KEY = 'curator-active-jobs'
const RECENT_JOBS_KEY = 'curator-recent-jobs'
const JOB_CLEANUP_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds

interface StoredJob {
  job_id: string
  source_url: string
  timestamp: number
  status: string
}

/**
 * Get active job IDs from localStorage
 */
function getStoredActiveJobs(): string[] {
  try {
    const stored = localStorage.getItem(ACTIVE_JOBS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Store active job IDs in localStorage
 */
function setStoredActiveJobs(jobIds: string[]): void {
  try {
    localStorage.setItem(ACTIVE_JOBS_KEY, JSON.stringify(jobIds))
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Get recent jobs from localStorage
 */
function getStoredRecentJobs(): StoredJob[] {
  try {
    const stored = localStorage.getItem(RECENT_JOBS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Store recent jobs in localStorage (keep last 10)
 */
function addRecentJob(job: StoredJob): void {
  try {
    const recent = getStoredRecentJobs()
    const updated = [job, ...recent.filter(j => j.job_id !== job.job_id)].slice(0, 10)
    localStorage.setItem(RECENT_JOBS_KEY, JSON.stringify(updated))
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Clean up old completed jobs from active jobs list
 */
function cleanupOldJobs(activeJobs: string[], recentJobs: StoredJob[]): string[] {
  const now = Date.now()
  const jobMap = new Map(recentJobs.map(j => [j.job_id, j]))

  return activeJobs.filter(jobId => {
    const job = jobMap.get(jobId)
    if (!job) return true // Keep if not in recent jobs

    // Remove if completed/failed and older than cleanup timeout
    if ((job.status === 'completed' || job.status === 'failed') &&
        now - job.timestamp > JOB_CLEANUP_TIMEOUT) {
      return false
    }

    return true
  })
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to trigger manual fetch operations
 *
 * Returns a mutation hook that:
 * - Accepts FetchJobRequest (source_url, subscription_id?)
 * - Returns job_id on success
 * - Stores active job IDs in React state for tracking
 * - Provides helper: getActiveJobs() => string[]
 *
 * @example
 * const { mutate: fetchUrl, getActiveJobs } = useManualFetch()
 *
 * fetchUrl({ source_url: 'https://example.com' }, {
 *   onSuccess: (data) => console.log('Job started:', data.job_id)
 * })
 *
 * const activeJobs = getActiveJobs()
 */
export function useManualFetch() {
  const queryClient = useQueryClient()
  const [activeJobIds, setActiveJobIds] = useState<string[]>(() => getStoredActiveJobs())

  // Sync activeJobIds with localStorage
  useEffect(() => {
    setStoredActiveJobs(activeJobIds)
  }, [activeJobIds])

  // Cleanup old jobs periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const recentJobs = getStoredRecentJobs()
      const cleaned = cleanupOldJobs(activeJobIds, recentJobs)
      if (cleaned.length !== activeJobIds.length) {
        setActiveJobIds(cleaned)
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [activeJobIds])

  const mutation = useMutation({
    mutationFn: (request: FetchJobRequest) => curatorClient.triggerFetch(request),
    onSuccess: (data: FetchJobResponse) => {
      // Add job ID to active jobs
      setActiveJobIds(prev => {
        if (!prev.includes(data.job_id)) {
          return [...prev, data.job_id]
        }
        return prev
      })

      // Add to recent jobs
      addRecentJob({
        job_id: data.job_id,
        source_url: data.source_url,
        timestamp: Date.now(),
        status: data.status,
      })

      // Invalidate recent jobs query to refetch
      queryClient.invalidateQueries({ queryKey: ['recent-jobs'] })
    },
  })

  /**
   * Get list of active job IDs
   */
  const getActiveJobs = useCallback(() => {
    return activeJobIds
  }, [activeJobIds])

  /**
   * Remove a job from active jobs (e.g., when completed)
   */
  const removeActiveJob = useCallback((jobId: string) => {
    setActiveJobIds(prev => prev.filter(id => id !== jobId))
  }, [])

  return {
    ...mutation,
    getActiveJobs,
    removeActiveJob,
    activeJobIds,
  }
}

/**
 * Hook to fetch recent manual fetch jobs
 *
 * Query hook for recent manual fetch jobs:
 * - Fetches last 10 jobs from local storage or API (if available)
 * - Query key: ['recent-jobs']
 * - Stale time: 60 seconds
 *
 * @returns Query result with recent jobs array
 *
 * @example
 * const { data: recentJobs, isLoading } = useRecentJobs()
 */
export function useRecentJobs() {
  return useQuery({
    queryKey: ['recent-jobs'],
    queryFn: async (): Promise<StoredJob[]> => {
      // For now, we only use localStorage
      // In the future, this could be enhanced to fetch from an API endpoint
      // if the backend provides a /api/jobs/recent endpoint

      const jobs = getStoredRecentJobs()

      // Optionally, you could fetch from API here:
      // try {
      //   const apiJobs = await curatorClient.getRecentJobs()
      //   return apiJobs
      // } catch {
      //   // Fall back to localStorage if API fails
      //   return jobs
      // }

      return jobs
    },
    staleTime: 60000, // 60 seconds
  })
}
