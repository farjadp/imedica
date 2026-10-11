import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./api";
import type { Attempt, OpenAssessment, PaperBrief, PaperDetail, PaperRef, PaperSearch, Review, SavedPaper, ScenarioSummary, SessionSummary } from "./types";

export const keys = {
  scenarios: ["scenarios"] as const,
  sessions: ["sessions"] as const,
  review: (id: string) => ["review", id] as const,
  assessments: ["assessments"] as const,
  attempt: (id: string) => ["attempt", id] as const,
  papers: (q: string, open: boolean) => ["papers", q, open] as const,
  paper: (p: PaperRef) => ["paper", p.source, p.extId] as const,
  saved: ["papers", "saved"] as const,
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

export function usePaperSearch(q: string, openAccessOnly: boolean) {
  return useInfiniteQuery({
    queryKey: keys.papers(q, openAccessOnly),
    enabled: q.trim().length > 1,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api<PaperSearch>(
        "GET",
        `/papers?${new URLSearchParams({ q, ...(pageParam ? { cursor: pageParam } : {}), ...(openAccessOnly ? { open: "1" } : {}) })}`,
      ),
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 5 * 60_000,
  });
}

export function usePaper(ref: PaperRef) {
  return useQuery({ queryKey: keys.paper(ref), queryFn: () => api<PaperDetail>("GET", `/papers/${ref.source}/${ref.extId}`) });
}

export function useSavedPapers() {
  return useQuery({ queryKey: keys.saved, queryFn: () => api<SavedPaper[]>("GET", "/papers/saved") });
}

export function useBrief(ref: PaperRef) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<PaperBrief>("POST", `/papers/${ref.source}/${ref.extId}/brief`),
    onSuccess: (brief) => qc.setQueryData<PaperDetail>(keys.paper(ref), (p) => (p ? { ...p, brief } : p)),
  });
}

export function useToggleSaved(ref: PaperRef) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (save: boolean) => api<{ saved: boolean }>(save ? "POST" : "DELETE", `/papers/${ref.source}/${ref.extId}/save`),
    onSuccess: ({ saved }) => {
      qc.setQueryData<PaperDetail>(keys.paper(ref), (p) => (p ? { ...p, saved } : p));
      void qc.invalidateQueries({ queryKey: ["papers"] });
    },
  });
}

/** Pre/post tests open for the person's service right now. */
export function useOpenAssessments() {
  return useQuery({ queryKey: keys.assessments, queryFn: () => api<OpenAssessment[]>("GET", "/attempts") });
}

export function useAttempt(id: string | undefined) {
  return useQuery({
    queryKey: keys.attempt(id ?? ""),
    queryFn: () => api<Attempt>("GET", `/attempts/${id}`),
    enabled: Boolean(id),
  });
}
