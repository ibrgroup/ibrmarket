'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

interface QueryProviderProps {
	children: React.ReactNode;
}

// CRITICAL: Global QueryClient instance for use in Zustand stores
// This allows stores to invalidate React Query cache without React hooks
let globalQueryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient | null {
	return globalQueryClient;
}

export function QueryProvider({ children }: QueryProviderProps) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000, // 1 minute
						gcTime: 5 * 60 * 1000, // 5 minutes
						retry: (failureCount, error) => {
							// Don't retry on 4xx errors
							if (error instanceof Error && 'status' in error) {
								const status = (error as any).status;
								if (status >= 400 && status < 500) {
									return false;
								}
							}
							return failureCount < 3;
						},
					},
				},
			})
	);

	// CRITICAL: Store global reference for use in Zustand stores
	globalQueryClient = queryClient;

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}
