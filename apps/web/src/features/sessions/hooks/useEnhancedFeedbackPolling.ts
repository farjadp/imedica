// ============================================================================
// File: apps/web/src/features/sessions/hooks/useEnhancedFeedbackPolling.ts
// Version: 1.0.0 — 2026-04-24
// Why: Polls background enhanced feedback generation status for review pages.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { getEnhancedFeedbackStatus } from '../api/sessionsApi.js';

export function useEnhancedFeedbackPolling(sessionId: string | undefined): {
  status: Awaited<ReturnType<typeof getEnhancedFeedbackStatus>> | undefined;
  isPolling: boolean;
  refetch: ReturnType<typeof useQuery>['refetch'];
} {
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    setIsPolling(true);
  }, [sessionId]);

  const { data: status, refetch } = useQuery({
    queryKey: ['enhanced-feedback-status', sessionId],
    queryFn: () => getEnhancedFeedbackStatus(sessionId ?? ''),
    enabled: Boolean(sessionId) && isPolling,
    refetchInterval: isPolling ? 2000 : false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (status?.isComplete) {
      setIsPolling(false);
    }
  }, [status?.isComplete]);

  return {
    status,
    isPolling,
    refetch,
  };
}
