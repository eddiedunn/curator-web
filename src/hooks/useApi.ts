import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { apiClient } from '../api/client'

export function useApiGet<T>(
  path: string,
  options?: UseQueryOptions<T, Error, T>
) {
  return useQuery<T, Error, T>({
    queryKey: [path],
    queryFn: () => apiClient.get<T>(path),
    ...options,
  })
}

export function useApiPost<T>(
  options?: UseMutationOptions<T, Error, Record<string, unknown>>
) {
  return useMutation<T, Error, Record<string, unknown>>({
    mutationFn: (data) => apiClient.post<T>('/', data),
    ...options,
  })
}

export function useApiPut<T>(
  options?: UseMutationOptions<T, Error, Record<string, unknown>>
) {
  return useMutation<T, Error, Record<string, unknown>>({
    mutationFn: (data) => apiClient.put<T>('/', data),
    ...options,
  })
}

export function useApiDelete<T>(
  path: string,
  options?: UseMutationOptions<T, Error, void>
) {
  return useMutation<T, Error, void>({
    mutationFn: () => apiClient.delete<T>(path),
    ...options,
  })
}
