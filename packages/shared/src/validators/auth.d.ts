import { z } from 'zod';
/** POST /api/auth/register */
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    /** Explicit opt-in for anonymized analytics collection (required for PIPEDA). */
    consentAnalytics: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    consentAnalytics: boolean;
    firstName?: string | undefined;
    lastName?: string | undefined;
    organizationId?: string | undefined;
}, {
    email: string;
    password: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    organizationId?: string | undefined;
    consentAnalytics?: boolean | undefined;
}>;
/** POST /api/auth/login */
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    /** Optional TOTP code for MFA-enabled accounts. */
    totpCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    totpCode?: string | undefined;
}, {
    email: string;
    password: string;
    totpCode?: string | undefined;
}>;
/** POST /api/auth/forgot-password */
export declare const ForgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
/** POST /api/auth/reset-password */
export declare const ResetPasswordSchema: z.ZodEffects<z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    newPassword: string;
    confirmPassword: string;
}, {
    token: string;
    newPassword: string;
    confirmPassword: string;
}>, {
    token: string;
    newPassword: string;
    confirmPassword: string;
}, {
    token: string;
    newPassword: string;
    confirmPassword: string;
}>;
/** POST /api/auth/verify-email */
export declare const VerifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
/** POST /api/auth/refresh
 *  Note: The refresh token is read from the httpOnly cookie on the server.
 *  This schema just documents that no body is needed. */
export declare const RefreshSchema: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;
//# sourceMappingURL=auth.d.ts.map