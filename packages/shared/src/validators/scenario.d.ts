import { z } from 'zod';
export declare const DecisionTypeEnum: z.ZodEnum<["assessment", "medication", "procedure", "diagnosis", "transport"]>;
export declare const CreateSessionSchema: z.ZodObject<{
    scenarioId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    scenarioId: string;
}, {
    scenarioId: string;
}>;
export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
export declare const SubmitDecisionSchema: z.ZodObject<{
    decisionType: z.ZodEnum<["assessment", "medication", "procedure", "diagnosis", "transport"]>;
    decisionValue: z.ZodAny;
    timeToDecisionMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    decisionType: "assessment" | "medication" | "procedure" | "diagnosis" | "transport";
    timeToDecisionMs: number;
    decisionValue?: any;
}, {
    decisionType: "assessment" | "medication" | "procedure" | "diagnosis" | "transport";
    timeToDecisionMs: number;
    decisionValue?: any;
}>;
export type SubmitDecisionDto = z.infer<typeof SubmitDecisionSchema>;
//# sourceMappingURL=scenario.d.ts.map