import { useCallback, useState } from "react";

/**
 * Pull-to-refresh state that only reflects a real pull. Tying RefreshControl
 * to a query's isRefetching shows the spinner (and shifts the page on iOS)
 * whenever data refreshes in the background, e.g. after a call ends.
 */
export function usePull(refresh: () => Promise<unknown> | unknown) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Promise.resolve(refresh()).finally(() => setRefreshing(false));
  }, [refresh]);
  return { refreshing, onRefresh };
}
