// ============================================================================
// File: apps/web/src/features/sessions/utils/gradeCalculator.ts
// Version: 1.0.0 — 2026-04-22
// Why: Shared score-to-grade utility for the post-session review experience.
// Env / Identity: Web (browser runtime)
// ============================================================================

export type SessionGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

export function calculateSessionGrade(score: number, maxScore: number): SessionGrade {
  if (maxScore <= 0) {
    return score >= 0 ? 'A+' : 'F';
  }

  const percentage = (score / maxScore) * 100;

  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

export function getGradeTone(grade: SessionGrade): 'success' | 'warning' | 'error' | 'neutral' {
  if (grade === 'A+' || grade === 'A') return 'success';
  if (grade === 'B+' || grade === 'B') return 'success';
  if (grade === 'C+' || grade === 'C') return 'warning';
  if (grade === 'D') return 'warning';
  return 'error';
}

