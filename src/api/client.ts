/**
 * Curator API Client
 * Type-safe HTTP client wrapper for the Curator API
 */

import type {
  SubscriptionResponse,
  SubscriptionCreate,
  SubscriptionUpdate,
  IngestedItemResponse,
  FetchJobRequest,
  FetchJobResponse,
  StatusResponse,
  HealthResponse,
} from './types'

/**
 * Custom error class for API errors
 */
export class CuratorAPIError extends Error {
  status?: number
  response?: any

  constructor(message: string, status?: number, response?: any) {
    super(message)
    this.name = 'CuratorAPIError'
    this.status = status
    this.response = response
  }
}

/**
 * Query parameters for listing subscriptions
 */
export interface ListSubscriptionsParams {
  enabled_only?: boolean
  subscription_type?: string
}

/**
 * Query parameters for listing ingested items
 */
export interface ListIngestedItemsParams {
  subscription_id?: string
  source_type?: string
  status?: string
  limit?: number
  offset?: number
}

/**
 * Configuration options for the CuratorClient
 */
export interface CuratorClientConfig {
  baseUrl?: string
  apiKey?: string
}

/**
 * Type-safe HTTP client for the Curator API
 */
export class CuratorClient {
  private baseUrl: string
  private apiKey?: string

  constructor(config: CuratorClientConfig = {}) {
    this.baseUrl =
      config.baseUrl ||
      import.meta.env.VITE_CURATOR_API_URL ||
      'http://localhost:8950'
    this.apiKey = config.apiKey || import.meta.env.VITE_CURATOR_API_KEY
  }

  /**
   * Internal method to build headers for requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey
    }

    return headers
  }

  /**
   * Internal method to handle API requests
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers = this.getHeaders()

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`
        let errorData: any

        try {
          errorData = await response.json()
          if (errorData.detail) {
            errorMessage = errorData.detail
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch {
          // Response is not JSON, use statusText
        }

        throw new CuratorAPIError(errorMessage, response.status, errorData)
      }

      // For DELETE requests that return 204 No Content
      if (response.status === 204) {
        return undefined as T
      }

      return await response.json()
    } catch (error) {
      if (error instanceof CuratorAPIError) {
        throw error
      }
      throw new CuratorAPIError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: Record<string, any>): string {
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })

    const queryString = queryParams.toString()
    return queryString ? `?${queryString}` : ''
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  /**
   * List all subscriptions with optional filtering
   */
  async listSubscriptions(
    params?: ListSubscriptionsParams
  ): Promise<SubscriptionResponse[]> {
    const queryString = params ? this.buildQueryString(params) : ''
    return this.request<SubscriptionResponse[]>(`/api/v1/subscriptions${queryString}`)
  }

  /**
   * Get a specific subscription by ID
   */
  async getSubscription(id: string): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>(`/api/v1/subscriptions/${id}`)
  }

  /**
   * Create a new subscription
   */
  async createSubscription(
    data: SubscriptionCreate
  ): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>('/api/v1/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Update an existing subscription
   */
  async updateSubscription(
    id: string,
    data: SubscriptionUpdate
  ): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>(`/api/v1/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete a subscription
   */
  async deleteSubscription(id: string): Promise<void> {
    return this.request<void>(`/api/v1/subscriptions/${id}`, {
      method: 'DELETE',
    })
  }

  // ============================================================================
  // INGESTED ITEMS
  // ============================================================================

  /**
   * List ingested items with optional filtering
   */
  async listIngestedItems(
    params?: ListIngestedItemsParams
  ): Promise<IngestedItemResponse[]> {
    const queryString = params ? this.buildQueryString(params) : ''
    return this.request<IngestedItemResponse[]>(`/api/v1/ingested${queryString}`)
  }

  /**
   * Get a specific ingested item by ID
   */
  async getIngestedItem(id: string): Promise<IngestedItemResponse> {
    return this.request<IngestedItemResponse>(`/api/v1/ingested/${id}`)
  }

  // ============================================================================
  // MANUAL FETCH
  // ============================================================================

  /**
   * Trigger a manual fetch/ingestion job
   */
  async triggerFetch(request: FetchJobRequest): Promise<FetchJobResponse> {
    return this.request<FetchJobResponse>('/api/v1/fetch', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Get the status of a fetch job
   */
  async getJobStatus(jobId: string): Promise<FetchJobResponse> {
    return this.request<FetchJobResponse>(`/api/v1/fetch/${jobId}`)
  }

  // ============================================================================
  // SYSTEM
  // ============================================================================

  /**
   * Get system status information
   */
  async getStatus(): Promise<StatusResponse> {
    return this.request<StatusResponse>('/api/v1/status')
  }

  /**
   * Get health check information
   */
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health')
  }
}

/**
 * Singleton instance of the CuratorClient
 */
export const curatorClient = new CuratorClient()

/**
 * Legacy API client for backward compatibility
 * This is a simple HTTP client that provides get, post, put, delete methods
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const apiClient = {
  baseURL: API_URL,

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    return response.json()
  },

  async post<T>(path: string, data?: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    return response.json()
  },

  async put<T>(path: string, data?: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    return response.json()
  },

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    return response.json()
  },
}
