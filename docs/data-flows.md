# Imedica — Data Flows & Canadian Data Residency

> Version 1.0.0 — Phase 1
> **PIPEDA/PHIPA Compliance Record** — Update this document whenever a new data flow is added.

---

## Data Residency Policy

All data at rest and in transit must remain within Canada unless:
1. The data has been de-identified through the `DeidentificationService`
2. The cross-border flow is explicitly documented here with justification
3. The third party has a DPA (Data Processing Agreement) with Canadian terms

**Production infrastructure:** DigitalOcean Toronto (TOR1) for all compute, database, and cache.

---

## Data Flow Inventory

### Phase 1 Flows

| Flow ID | Source | Destination | Data Type | Contains PII? | Cross-Border? | Controls |
|---------|--------|-------------|-----------|---------------|---------------|----------|
| DF-001 | User browser | Backend API (DO TOR1) | Auth credentials (email, password) | Yes | No (Canada→Canada) | TLS 1.3, rate limiting |
| DF-002 | Backend | PostgreSQL (DO TOR1) | User PII, tokens | Yes | No | Encrypted at rest, VPC |
| DF-003 | Backend | Redis (DO TOR1) | Session cache, job queue | No (no PII cached) | No | VPC |
| DF-004 | Backend | Mailhog (local dev) / SendGrid | Email address (To: field) | Yes — email only | TBD* | TLS |
| DF-005 | Backend | Browser (cookie) | Refresh token (JWT, no PII) | No | No | httpOnly, SameSite=Strict |

*SendGrid data residency: Review SendGrid's Canadian data processing terms before production. Alternative: self-hosted Postfix on DO Toronto.

### Phase 5 Flows (LLM Integration — not yet active)

| Flow ID | Source | Destination | Data Type | Contains PII? | Cross-Border? | Controls |
|---------|--------|-------------|-----------|---------------|---------------|----------|
| DF-101 | Backend | Anthropic API (US servers) | Feedback context | **Must be NO** | Yes (Canada→US) | De-identification Gateway (mandatory), audit log |
| DF-102 | Anthropic API | Backend | LLM-generated feedback text | No | Yes (US→Canada) | Output validation before storage |

**DF-101 is the highest-risk flow.** The `DeidentificationService.verifyNoLeakage()` check runs on every payload before the Anthropic API is called. If it detects PII, the operation is aborted and logged.

---

## PII Inventory

### PII Collected

| Field | Location | Purpose | Retention | Legal Basis |
|-------|----------|---------|-----------|-------------|
| Email | `identity.users.email` | Authentication, communication | Lifetime of account + 7 years | Contract |
| Password hash (bcrypt) | `identity.users.password_hash` | Authentication | Lifetime of account | Contract |
| First name, Last name | `identity.users.first_name/last_name` | Personalization | Lifetime of account | Contract |
| Phone | `identity.users.phone` | Optional contact | Lifetime of account | Consent |
| IP address | `content.audit_logs.ip_address` | Security audit | 7 years | Legitimate interest |
| User agent | `content.audit_logs.user_agent` | Security audit | 7 years | Legitimate interest |

### Analytics Data (No PII)

| Field | Table | Notes |
|-------|-------|-------|
| `anonymous_hash` | All analytics tables | HMAC-SHA256 of user_id — not reversible without DEIDENT_SECRET |
| `paramedic_level` | `paramedic_profile_snapshot` | PCP/ACP/CCP/student — not identifying |
| `experience_bucket` | `paramedic_profile_snapshot` | Bucketed range — not exact |
| `region` | `paramedic_profile_snapshot` | Province code only (ON, AB, etc.) |
| `service_type` | `paramedic_profile_snapshot` | Category, not organization name |

---

## Data Subject Rights (PIPEDA)

We must be able to fulfill these requests within 30 days:

| Right | Implementation |
|-------|---------------|
| Access | Admin endpoint to export user's own data from identity schema |
| Correction | User profile update endpoint (Phase 2) |
| Deletion | Soft-delete (`deleted_at` set). Analytics data remains (anonymous — cannot be linked). Hard delete available to super_admin. |
| Portability | CSV export of own data (Phase 6) |
| Consent withdrawal | `consentAnalytics = false` → future analytics writes blocked |

**Consent withdrawal note:** Existing analytics data cannot be deleted because it is not linked to the user (anonymous_hash is one-way). This is by design — the anonymization is what makes analytics lawful.

---

## Audit Trail

Every data access is written to `content.audit_logs`. Retention: 7 years.

Access to audit logs is restricted to:
- `super_admin` role via the admin panel
- Automated export for compliance reports

The audit log itself contains `actor_id` (user UUID). This is intentional — the audit trail needs to identify who accessed what for regulatory purposes. The audit log is NOT exposed to analytics queries.

---

## Breach Response

If a data breach is suspected:

1. **Immediately** revoke all refresh tokens for affected users (`TokenService.revokeAllForUser()`)
2. **Within 1 hour**: Notify the CTO (Farjad)
3. **Within 72 hours**: File PIPEDA breach report if there is a risk of significant harm
4. **Preserve**: All audit logs from the breach window
5. **Investigate**: Check `content.audit_logs` for the actor, action, and timing

Critical breach indicators:
- `PiiLeakageError` caught in production — means PII reached a system it shouldn't
- Unusual spike in `anonymous_mapping.create` events — possible schema exposure
- Unexpected Anthropic API calls without matching de-identification audit entries
