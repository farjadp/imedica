import { PII_PATTERNS } from '@imedica/shared';

import type { FeedbackEnhancementInput } from './types.js';

type ValidationResult = {
  valid: boolean;
  errors: string[];
};

type MedicationDoseRule = {
  label: string;
  aliases: string[];
  allowedMg: number[];
};

const MEDICATION_DOSE_RULES: MedicationDoseRule[] = [
  {
    label: 'epinephrine',
    aliases: ['epinephrine', 'adrenaline', 'epi'],
    allowedMg: [1, 0.5],
  },
  {
    label: 'atropine',
    aliases: ['atropine'],
    allowedMg: [1, 0.5],
  },
  {
    label: 'amiodarone',
    aliases: ['amiodarone'],
    allowedMg: [300, 150],
  },
];

const PERSONAL_NAME_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  {
    label: 'titled personal name',
    pattern: /\b(?:Mr|Mrs|Ms|Miss|Dr)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
  },
  {
    label: 'explicit personal name',
    pattern:
      /\b(?:patient|paramedic|provider|clinician|learner)\s+(?:named\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
  },
  {
    label: 'common full name',
    pattern:
      /\b(?:John|Jane|Michael|Sarah|David|Emily|Robert|Mary|Jennifer|William|James|Linda|Patricia|Elizabeth|Susan|Jessica|Daniel|Matthew|Ashley|Amanda|Christopher)\s+[A-Z][a-z]+\b/g,
  },
];

const MEDICAL_IMPOSSIBILITY_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  {
    label: '100% survival claim',
    pattern: /\b100\s*%\s+(?:survival|recovery|success|chance|guarantee)\b/gi,
  },
  {
    label: 'guaranteed survival or recovery claim',
    pattern: /\b(?:guarantees?|ensures?|will\s+ensure)\s+(?:survival|recovery|ROSC|a\s+good\s+outcome)\b/gi,
  },
  {
    label: 'absolute outcome language',
    pattern: /\b(?:always|never)\b[^.?!]{0,80}\b(?:survival|death|ROSC|outcome|recovery)\b/gi,
  },
];

const HARSH_LANGUAGE_PATTERN = /\b(?:stupid|terrible|awful|idiotic|incompetent|reckless|useless)\b/gi;
const SUPPORTIVE_LANGUAGE_PATTERN =
  /\b(?:appropriate|aligned|correct|good|strong|reasonable|consider|review|improve|focus|continue|next time|constructive|guidance|help)\b/i;

export function validateLLMOutput(
  output: string,
  originalInput: FeedbackEnhancementInput,
): ValidationResult {
  const errors: string[] = [];
  const normalizedOutput = output.trim();

  if (normalizedOutput.length === 0) {
    errors.push('Output is empty.');
    return { valid: false, errors };
  }

  validateMedicationDosages(normalizedOutput, errors);
  validateNoPii(normalizedOutput, errors);
  validateMedicalPossibilities(normalizedOutput, errors);
  validateTone(normalizedOutput, originalInput, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateMedicationDosages(output: string, errors: string[]): void {
  for (const rule of MEDICATION_DOSE_RULES) {
    const mentionedDoses = extractMedicationDoses(output, rule.aliases);
    const invalidDoses = mentionedDoses.filter((dose) => !rule.allowedMg.includes(dose));

    if (invalidDoses.length > 0) {
      const formattedInvalidDoses = [...new Set(invalidDoses)]
        .map((dose) => `${dose}mg`)
        .join(', ');
      const formattedAllowedDoses = rule.allowedMg.map((dose) => `${dose}mg`).join(', ');

      errors.push(
        `Incorrect ${rule.label} dosage mentioned: ${formattedInvalidDoses}. Acceptable dosages: ${formattedAllowedDoses}.`,
      );
    }
  }
}

function extractMedicationDoses(output: string, aliases: string[]): number[] {
  const doses: number[] = [];

  for (const alias of aliases) {
    const escapedAlias = escapeRegex(alias);
    const medicationBeforeDose = new RegExp(
      `\\b${escapedAlias}\\b[^.\\n;:]{0,60}?\\b(\\d+(?:\\.\\d+)?)\\s*(?:mg|milligrams?)\\b`,
      'gi',
    );
    const doseBeforeMedication = new RegExp(
      `\\b(\\d+(?:\\.\\d+)?)\\s*(?:mg|milligrams?)\\b[^.\\n;:]{0,60}?\\b${escapedAlias}\\b`,
      'gi',
    );

    collectDoses(output, medicationBeforeDose, doses);
    collectDoses(output, doseBeforeMedication, doses);
  }

  return doses;
}

function collectDoses(output: string, pattern: RegExp, doses: number[]): void {
  for (const match of output.matchAll(pattern)) {
    const rawDose = match[1];
    if (rawDose) {
      doses.push(Number.parseFloat(rawDose));
    }
  }
}

function validateNoPii(output: string, errors: string[]): void {
  const piiPatterns: Array<{ label: string; pattern: RegExp }> = [
    ...Object.entries(PII_PATTERNS).map(([label, pattern]) => ({
      label,
      pattern: new RegExp(pattern.source, pattern.flags),
    })),
    ...PERSONAL_NAME_PATTERNS,
  ];

  for (const { label, pattern } of piiPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(output)) {
      errors.push(`Potential PII detected: ${label}.`);
    }
  }
}

function validateMedicalPossibilities(output: string, errors: string[]): void {
  for (const { label, pattern } of MEDICAL_IMPOSSIBILITY_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(output)) {
      errors.push(`Medical impossibility or inappropriate certainty detected: ${label}.`);
    }
  }
}

function validateTone(
  output: string,
  originalInput: FeedbackEnhancementInput,
  errors: string[],
): void {
  HARSH_LANGUAGE_PATTERN.lastIndex = 0;

  if (HARSH_LANGUAGE_PATTERN.test(output)) {
    errors.push('Harsh or non-educational language detected.');
  }

  const needsConstructiveGuidance = originalInput.decision.isCorrect !== true;
  if (needsConstructiveGuidance && !SUPPORTIVE_LANGUAGE_PATTERN.test(output)) {
    errors.push('Output should include supportive or constructive guidance.');
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
