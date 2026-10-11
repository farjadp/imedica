import { useQuery } from "@tanstack/react-query";

import { api } from "./api";
import type { Review, ScenarioSummary, SessionSummary } from "./types";

export const keys = {
  scenarios: ["scenarios"] as const,
  sessions: ["sessions"] as const,
  review: (id: string) => ["review", id] as const,
};

export function useScenarios() {
  return useQuery({ queryKey: keys.scenarios, queryFn: () => api<ScenarioSummary[]>("GET", "/scenarios") });
}

export function useSessions() {
  return useQuery({ queryKey: keys.sessions, queryFn: () => api<SessionSummary[]>("GET", "/sessions") });
}

export function useReview(id: string) {
  return useQuery({
    queryKey: keys.review(id),
    queryFn: () => api<Review>("GET", `/sessions/${id}/review`),
    // Keep asking while Claude writes the explanation; stop once it's settled.
    refetchInterval: (q) => (q.state.data?.ai?.status === "PENDING" ? 4000 : false),
  });
}
