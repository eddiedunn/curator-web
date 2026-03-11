/**
 * API Type Definitions
 * TypeScript interfaces and enums matching Curator's Pydantic models
 */

// ============================================================================
// TYPES & ENUMS
// ============================================================================

/**
 * Subscription types supported by the Curator system
 */
export type SubscriptionType = 'youtube_channel' | 'rss_feed' | 'podcast'

/**
 * Status of a subscription
 */
export type SubscriptionStatus = 'active' | 'paused' | 'error'

/**
 * Status of an ingestion job
 */
export type IngestionStatus = 'pending' | 'in_progress' | 'processing' | 'completed' | 'failed'

/** Subscription type constants */
export const SUBSCRIPTION_TYPES = {
  YOUTUBE_CHANNEL: 'youtube_channel' as const,
  RSS_FEED: 'rss_feed' as const,
  PODCAST: 'podcast' as const,
}

/** Subscription status constants */
export const SUBSCRIPTION_STATUSES = {
  ACTIVE: 'active' as const,
  PAUSED: 'paused' as const,
  ERROR: 'error' as const,
}

/** Ingestion status constants */
export const INGESTION_STATUSES = {
  PENDING: 'pending' as const,
  IN_PROGRESS: 'in_progress' as const,
  PROCESSING: 'processing' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
}

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

/**
 * Request body for creating a new subscription
 */
export interface SubscriptionCreate {
  /** Name of the subscription */
  name: string

  /** Type of subscription (youtube_channel, rss_feed, or podcast) */
  subscription_type: SubscriptionType

  /** URL of the source to subscribe to */
  source_url: string

  /** Frequency in minutes to check for new content (optional, defaults to backend value) */
  check_frequency_minutes?: number

  /** Whether the subscription is enabled (optional, defaults to true) */
  enabled?: boolean

  /** Additional metadata stored as JSONB (optional) */
  metadata?: Record<string, any>
}

/**
 * Request body for updating an existing subscription
 * All fields are optional for partial updates
 */
export interface SubscriptionUpdate {
  /** Name of the subscription (optional) */
  name?: string

  /** Type of subscription (optional) */
  subscription_type?: SubscriptionType

  /** URL of the source to subscribe to (optional) */
  source_url?: string

  /** Frequency in minutes to check for new content (optional) */
  check_frequency_minutes?: number

  /** Whether the subscription is enabled (optional) */
  enabled?: boolean

  /** Additional metadata stored as JSONB (optional) */
  metadata?: Record<string, any>
}

/**
 * Request body for fetching/ingesting content from a source
 */
export interface FetchJobRequest {
  /** URL of the source to fetch content from */
  source_url: string

  /** Optional subscription ID associated with this fetch job */
  subscription_id?: string
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

/**
 * Response for a subscription record
 */
export interface SubscriptionResponse {
  /** Unique identifier of the subscription */
  id: string

  /** Name of the subscription */
  name: string

  /** Type of subscription (youtube_channel, rss_feed, or podcast) */
  subscription_type: SubscriptionType

  /** URL of the source being subscribed to */
  source_url: string

  /** Frequency in minutes to check for new content */
  check_frequency_minutes: number

  /** Whether the subscription is currently enabled */
  enabled: boolean

  /** Current status of the subscription (active, paused, or error) */
  status: SubscriptionStatus

  /** Timestamp of the last check for new content (ISO 8601 format, optional) */
  last_checked_at?: string

  /** Error message if the subscription is in error state (optional) */
  last_error?: string

  /** Timestamp when the subscription was created (ISO 8601 format) */
  created_at: string

  /** Timestamp when the subscription was last updated (ISO 8601 format) */
  updated_at: string

  /** Additional metadata stored as JSONB (optional) */
  metadata?: Record<string, any>
}

/**
 * Response for an ingested content item
 */
export interface IngestedItemResponse {
  /** Unique identifier of the ingested item */
  id: string

  /** ID of the subscription this item came from (optional) */
  subscription_id?: string

  /** Type of source (e.g., 'youtube', 'rss', 'podcast') */
  source_type: string

  /** Unique identifier from the source */
  source_id: string

  /** URL of the source content */
  source_url: string

  /** Title of the ingested content */
  title: string

  /** Author of the content (optional) */
  author?: string

  /** Timestamp when the content was published (ISO 8601 format, optional) */
  published_at?: string

  /** Timestamp when the content was ingested (ISO 8601 format) */
  ingested_at: string

  /** Number of chunks the content was split into */
  chunk_count: number

  /** Current status of ingestion (pending, in_progress, completed, or failed) */
  status: IngestionStatus

  /** Error message if ingestion failed (optional) */
  error_message?: string

  /** Additional metadata stored as JSONB (optional) */
  metadata?: Record<string, any>
}

/**
 * Response for a fetch/ingestion job
 */
export interface FetchJobResponse {
  /** Unique identifier of the fetch job */
  job_id: string

  /** URL that was fetched */
  source_url: string

  /** Current status of the fetch job */
  status: IngestionStatus

  /** Status message or description */
  message: string
}

/**
 * Response for system status information
 */
export interface StatusResponse {
  /** Overall system status (up, degraded, down, etc.) */
  status: string

  /** API version */
  version: string

  /** System uptime in seconds */
  uptime_seconds: number

  /** Whether the database connection is active */
  database_connected: boolean

  /** Whether the daemon process is running */
  daemon_running: boolean

  /** Total number of subscriptions in the system */
  total_subscriptions: number

  /** Number of currently enabled subscriptions */
  enabled_subscriptions: number

  /** Total number of ingested items */
  total_items: number

  /** Number of ingested items with 'completed' status */
  completed_items: number

  /** Number of ingested items with 'failed' status */
  failed_items: number

  /** Number of ingested items with 'pending' status */
  pending_items: number

  /** Number of ingested items with 'processing' status */
  processing_items: number

  /** Daemon check interval in seconds */
  check_interval_seconds: number
}

/**
 * Response for health check endpoint
 */
export interface HealthResponse {
  /** Overall system health status (healthy, unhealthy, degraded, etc.) */
  status: string

  /** API version */
  version: string

  /** System uptime in seconds */
  uptime_seconds: number

  /** Whether the database connection is active */
  database_connected: boolean

  /** Whether the daemon process is running */
  daemon_running: boolean
}
