import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { curatorClient, type ListSubscriptionsParams } from '../api/client'
import type { SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse } from '../api/types'
import { toast } from 'sonner'

/**
 * Hook to fetch a list of subscriptions with optional filtering
 * @param params - Optional query parameters (enabled_only, subscription_type)
 * @returns Query result with subscriptions array
 */
export function useSubscriptions(params?: ListSubscriptionsParams) {
  return useQuery({
    queryKey: ['subscriptions', params],
    queryFn: () => curatorClient.listSubscriptions(params),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to fetch a single subscription by ID
 * @param id - Subscription ID
 * @returns Query result with subscription data
 */
export function useSubscription(id: string) {
  return useQuery({
    queryKey: ['subscriptions', id],
    queryFn: () => curatorClient.getSubscription(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new subscription
 * @returns Mutation object with mutate function, isLoading, and error
 */
export function useCreateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SubscriptionCreate) => curatorClient.createSubscription(data),
    onSuccess: (newSubscription) => {
      // Invalidate all subscriptions queries to refetch the list
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Subscription created', {
        description: `Successfully created "${newSubscription.name}"`
      })
    },
    onError: (err) => {
      toast.error('Failed to create subscription', {
        description: err instanceof Error ? err.message : 'An unexpected error occurred'
      })
    },
  })
}

/**
 * Hook to update an existing subscription with optimistic updates
 * @returns Mutation object that accepts {id, data}
 */
export function useUpdateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubscriptionUpdate }) =>
      curatorClient.updateSubscription(id, data),
    // Optimistic update: immediately update the UI before server confirms
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['subscriptions'] })

      // Snapshot previous values
      const previousSubscriptions = queryClient.getQueriesData<SubscriptionResponse[]>({
        queryKey: ['subscriptions']
      })

      // Optimistically update all subscription queries
      queryClient.setQueriesData<SubscriptionResponse[]>(
        { queryKey: ['subscriptions'] },
        (old) => {
          if (!old) return old
          return old.map((sub) =>
            sub.id === id ? { ...sub, ...data } : sub
          )
        }
      )

      // Return context with previous data for rollback
      return { previousSubscriptions }
    },
    // Rollback on error
    onError: (err, _variables, context) => {
      if (context?.previousSubscriptions) {
        // Restore all previous query states
        context.previousSubscriptions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error('Failed to update subscription', {
        description: err instanceof Error ? err.message : 'An unexpected error occurred'
      })
    },
    // Refetch after mutation to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
    onSuccess: (_data, variables) => {
      // Show success toast for enable/disable actions
      if ('enabled' in variables.data) {
        toast.success(
          variables.data.enabled ? 'Subscription enabled' : 'Subscription paused',
          { description: 'Changes saved successfully' }
        )
      }
    },
  })
}

/**
 * Hook to delete a subscription with optimistic updates
 * @returns Mutation object that accepts subscription id
 */
export function useDeleteSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => curatorClient.deleteSubscription(id),
    // Optimistic update: immediately remove from UI
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['subscriptions'] })

      // Snapshot previous values
      const previousSubscriptions = queryClient.getQueriesData<SubscriptionResponse[]>({
        queryKey: ['subscriptions']
      })

      // Optimistically remove from all subscription queries
      queryClient.setQueriesData<SubscriptionResponse[]>(
        { queryKey: ['subscriptions'] },
        (old) => {
          if (!old) return old
          return old.filter((sub) => sub.id !== id)
        }
      )

      // Return context for rollback
      return { previousSubscriptions }
    },
    // Rollback on error
    onError: (err, _id, context) => {
      if (context?.previousSubscriptions) {
        context.previousSubscriptions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error('Failed to delete subscription', {
        description: err instanceof Error ? err.message : 'An unexpected error occurred'
      })
    },
    // Refetch to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
    onSuccess: () => {
      toast.success('Subscription deleted', {
        description: 'The subscription has been permanently removed'
      })
    },
  })
}
