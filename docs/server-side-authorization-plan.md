# PoultryPal — Server-Side Authentication & Authorization Plan

Status: PROPOSED (nothing here is implemented). Based on the repository state at branch `fix/build-stabilization`.

## 1. Current state (verified by code inspection)

| Area | Finding | Location |
|---|---|---|
| Login | Mock. Any input "succeeds" and routes to `/dashboard`. No session. | `src/app/page.tsx` `handleLogin` |
| Admin account | Email and plaintext password stored in `localStorage`; password also written to `console.log`. | `src/app/setup/page.tsx` |
| Setup gate | A master key is a **string literal in client source** (shipped to every browser and present in public git history). | `src/app/setup/page.tsx:20` |
| Route protection | None. `/dashboard/**` is reachable without any session; no `middleware.ts`. | — |
| Destructive actions | Delete supplier compares typed credentials to `localStorage` values, client-side only. | `src/app/dashboard/suppliers/page.tsx` |
| Data | All business data (accounts, inventory, customers, staff, payments, logs) lives in browser `localStorage` via `FarmContext` (~80 call sites). No server-side data store. | `src/context/FarmContext.tsx` |
| Server actions | `getEggProductionForecast`, `getFeedForecast`, `getBrokenRatePrediction`, `getHealthAnomalyAlerts` are callable with no auth check (cost/abuse exposure via AI quota). | `src/app/dashboard/actions.ts` |
| Roles | Blueprint specifies RBAC (Admin, Manager, Staff, Driver, Accounts, Delivery, Shed Supervisor); not implemented. Staff `role` is a free string. | `docs/blueprint.md`, `FarmContext` |
| Firebase | `firebase` SDK is a dependency but unused; hosting is Firebase App Hosting (`apphosting.yaml`). | `package.json` |

**Core constraint:** server-side authorization cannot protect data that exists only in the browser. Real enforcement requires moving data to a server-side store (Phase 3). Phases 1–2 close the most exposed gaps first.

## 2. Immediate actions (before any code)

1. Treat the hardcoded master key as compromised (public repo + history). Do not reuse it. Replace with a server-side secret (Phase 1). Rewriting git history is optional and does not un-leak it; rotation is what matters.
2. Stop logging passwords (`console.log` in setup).

## 3. Proposed target architecture

Chosen to fit the existing stack (Firebase App Hosting, Next.js 15 App Router, `firebase` already installed). Alternative noted in section 8.

- **Identity:** Firebase Authentication (email/password). Passwords never touch app code or `localStorage`.
- **Sessions:** Firebase Admin `createSessionCookie` -> `HttpOnly; Secure; SameSite=Lax` cookie. Verified server-side on every request.
- **Authorization data:** Firebase **custom claims**: `{ companyId, role }`, set only by trusted server code (Admin SDK).
- **Data:** Firestore, tenant-scoped paths `companies/{companyId}/...`, protected by Security Rules (defence in depth) **and** server-side checks in Server Actions/route handlers.
- **Enforcement layers (all required):**
  1. `middleware.ts`: redirect unauthenticated users away from `/dashboard/**` (UX gate only, not a security boundary).
  2. A server helper `requireUser(permission)` called at the top of **every** Server Action / route handler: verifies the session cookie, reads claims, checks permission, returns `{uid, companyId, role}` or throws.
  3. Firestore Security Rules mirroring the same permission matrix, so direct client SDK access cannot bypass the app.
- **UI role checks are cosmetic only.** The UI hides what the user cannot do; the server decides.

## 4. Proposed role / permission model (PROPOSED — needs owner confirmation)

Roles from the blueprint. `R` read, `W` create/update, `D` delete, `—` none. Matrix below is a starting proposal, not an existing requirement.

| Module | Admin | Manager | Accounts | Shed Supervisor | Staff | Driver / Delivery |
|---|---|---|---|---|---|---|
| Company, users, roles, settings | RWD | R | — | — | — | — |
| Suppliers / Customers | RWD | RW | RW | — | R | R (assigned) |
| Purchase orders, payments, credit/debit notes | RWD | RW | RW | — | — | — |
| Inventory / feed | RWD | RW | R | RW | R | — |
| Egg collection / sheds / chicks | RWD | RW | R | RW | RW (assigned) | — |
| Dispatch | RWD | RW | R | R | — | RW (own dispatches) |
| Tasks | RWD | RW | — | RW | RW (own) | R (own) |
| Vehicles / staff | RWD | RW | R | — | — | R (own) |
| Logs / audit | R | R | — | — | — | — |
| AI forecast actions | Y | Y | — | Y | — | — |

Rule: **delete is Admin-only** unless the owner decides otherwise; financial records (payments, notes) are append-only for non-Admins.

## 5. Phases

### Phase 1 — Real authentication (no data migration required)
- Add Firebase Admin SDK; credentials via App Hosting secrets (Cloud Secret Manager), never committed.
- Login page -> Firebase Auth sign-in -> exchange ID token for session cookie via a route handler; logout clears it.
- `middleware.ts` gate for `/dashboard/**`.
- Replace the `MASTER_KEY` literal with a server-side secret checked in a Server Action; first-admin bootstrap becomes a one-time server operation (disabled once an admin exists).
- Remove `adminEmail` / `adminPassword` from `localStorage` and the "forgot password" localStorage reset; use Firebase password-reset email.
- Add `requireUser()` to the four AI server actions (role check + basic rate limit).
- **Exit criteria:** unauthenticated request to any `/dashboard` route or server action is rejected; no credential in `localStorage` or source.

### Phase 2 — Roles and protected destructive actions
- User management (Admin only): create user, assign role, set custom claims via Admin SDK. Persist a `users/{uid}` profile doc.
- Move supplier delete (and other deletes) to a Server Action: `requireUser('supplier:delete')` plus **recent re-authentication** (e.g. `auth_time` within 5 minutes) instead of typing credentials into a client comparison. Remove the localStorage comparison.
- Write an audit record server-side for every destructive/financial action: `{uid, role, action, entity, id, timestamp}`.
- **Exit criteria:** a non-Admin cannot delete via UI *or* by calling the action directly.

### Phase 3 — Move data server-side (largest effort)
- Introduce a data-access layer (e.g. `src/server/repos/*`) behind Server Actions; `FarmContext` calls actions instead of `localStorage`. Migrate module by module (suppliers -> customers -> inventory -> accounts last).
- Tenant isolation: every query is scoped by the verified `companyId` from claims, never from client input.
- Firestore Security Rules per section 4; **test with the emulator** (allow/deny cases per role and cross-tenant).
- Money-affecting writes (payments, credit-note settlement, stock movements) use Firestore transactions and idempotency keys so retries/double-submits cannot double-post.
- One-time import path for existing `localStorage` data (export JSON from the browser, validate with Zod, import server-side).
- **Exit criteria:** with the browser's storage cleared, data persists; user A cannot read or write company B's data.

### Phase 4 — Hardening
- Zod validation on all Server Action inputs (zod already present).
- Security headers/CSP, rate limiting on login and AI actions, session revocation on role change (`revokeRefreshTokens`).
- Dependency audit follow-up (jspdf/jspdf-autotable majors; `xlsx` and `zod` have no non-breaking fix).
- Automated tests: permission-matrix unit tests, Rules emulator tests, one e2e per role.

## 6. Failure modes to design for
- Run twice: server actions idempotent on retry (keys on payments/dispatch).
- Fails halfway: multi-document writes in a transaction or batch.
- Firebase/Admin unavailable: fail closed (deny), show an error; never fall back to client-side checks.
- Stale role after demotion: revoke refresh tokens and shorten session cookie lifetime (e.g. 5 days max; 1 hour for Admin).
- Lost-admin recovery: documented break-glass procedure using the Admin SDK, not an in-app backdoor.

## 7. Open decisions for the project owner
1. Confirm Firebase Auth + Firestore (section 3), or choose another stack (section 8).
2. Confirm or edit the permission matrix (section 4), including who may delete and whether Accounts can edit payments.
3. Single company per deployment, or true multi-tenant (current UI supports multiple companies)?
4. Can existing `localStorage` data be exported and imported, or is there live data on user devices that must be migrated?
5. Who is the first Admin, and is self-registration allowed or invite-only?

## 8. Alternatives considered
- **Supabase (Auth + Postgres + RLS):** strong relational fit for accounting; requires adopting a new platform alongside Firebase hosting.
- **Auth.js + own database:** most control, most code to own and maintain.
- Not chosen by default because the project already targets Firebase App Hosting and ships the Firebase SDK. Not benchmarked; this is a fit judgement, not a measured one.

## 9. Not verified
This plan has not been implemented or executed. Firebase API specifics (session cookie lifetimes, claim size limits, rules syntax) should be confirmed against current official documentation when implementing.
