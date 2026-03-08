import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format an ISO date string as a human-readable relative time (e.g. "5 minutes ago").
 * Returns "Never" for null/undefined values.
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "Never"

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)

  if (diffSeconds < 0) return "Just now"
  if (diffSeconds < 60) return "Just now"

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`
  }

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) {
    return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`
  }

  const diffYears = Math.floor(diffMonths / 12)
  return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`
}

/**
 * Truncate a URL to a maximum length, preserving the beginning and adding ellipsis.
 */
export function truncateUrl(url: string, maxLength: number): string {
  if (url.length <= maxLength) return url
  return url.slice(0, maxLength - 3) + "..."
}
