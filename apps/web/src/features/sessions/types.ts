// ============================================================================
// File: apps/web/src/features/sessions/types.ts
// Version: 1.0.0 — 2026-04-22
// Why: Shared runtime types for session execution UI and API payloads.
// Env / Identity: Web (browser runtime)
// ============================================================================

import type { ScenarioCategory, ScenarioDifficulty } from '../scenarios/types.js';

export type FeedbackSource = 'cache' | 'llm' | 'fallback';

export interface SessionVitals {
  hr: number | null;
  bp: string | null;
  spo2: number | null;
  rr: number | null;
  temp: number | null;
  ecg: string | null;
}

export interface SessionStateRecord {
  id: string;
  order: number;
  name: string;
  vitals: SessionVitals;
  physicalExam: string | null;
  symptoms: string | null;
  timeLimit: number | null;
}

export interface SessionDecisionRecord {
  id: string;
  sessionId: string;
  actionType: string;
  actionValue: string | null;
  stateOrder: number;
  timestamp: string;
  timeFromStart: number;
  isCorrect: boolean | null;
  pointsAwarded: number;
  feedbackKey: string | null;
  ruleMatched: string | null;
  enhancedFeedback: string | null;
  feedbackSource: FeedbackSource | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnhancedFeedbackStatus {
  total: number;
  completed: number;
  pending: number;
  isComplete: boolean;
}

export interface SessionFeedbackTemplate {
  id: string;
  key: string;
  title: string;
  message: string;
}

export interface SessionRuleRecord {
  id: string;
  name: string;
  condition: {
    action?: string;
    stateOrder?: number;
    maxTime?: number | null;
    minTime?: number | null;
  };
  points: number;
  feedbackKey: string;
  priority: number;
  isActive: boolean;
}

export interface SessionScenarioRecord {
  id: string;
  title: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  estimatedDuration: number;
  patientPresentation: string;
  learningObjectives: string;
  states: SessionStateRecord[];
  rules?: SessionRuleRecord[];
  feedbackTemplates?: SessionFeedbackTemplate[];
}

export interface SessionRecord {
  id: string;
  userId: string;
  scenarioId: string;
  startedAt: string;
  completedAt: string | null;
  status: 'RUNNING' | 'COMPLETED' | 'ABANDONED';
  currentStateOrder: number;
  totalScore: number;
  maxPossibleScore: number | null;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface SessionRuntimePayload {
  sessionId: string;
  session: SessionRecord;
  scenario: SessionScenarioRecord;
  initialState: SessionStateRecord | null;
  vitals: SessionVitals | null;
}

export interface SessionLoadPayload {
  id: string;
  userId: string;
  scenarioId: string;
  startedAt: string;
  completedAt: string | null;
  status: 'RUNNING' | 'COMPLETED' | 'ABANDONED';
  currentStateOrder: number;
  totalScore: number;
  maxPossibleScore: number | null;
  userAgent: string | null;
  ipAddress: string | null;
  decisions: SessionDecisionRecord[];
  scenario: SessionScenarioRecord;
}

export interface SessionDecisionResponse {
  decision: SessionDecisionRecord;
  feedback: {
    key: string;
    title: string;
    message: string;
  } | null;
  stateChange: {
    currentStateOrder: number;
    nextState: SessionStateRecord | null;
  } | null;
  session: SessionLoadPayload;
}
