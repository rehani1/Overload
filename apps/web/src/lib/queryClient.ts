import { QueryClient } from "@tanstack/react-query";

import { getApiStatus } from "./apiClient";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (getApiStatus(error) === 401) {
          return false;
        }

        return failureCount < 1;
      },
      staleTime: 30_000,
    },
  },
});
