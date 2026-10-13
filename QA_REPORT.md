# KR-ESTATE — Complete QA Audit & Production Readiness Report

**Date of Audit:** October 14, 2026  
**Portal Domain:** [krestatenoida.com](https://krestatenoida.com)  
**Roles & Scope:** Senior QA Engineer, Application Security Engineer, UI/UX Quality Auditor, Accessibility Specialist & DevOps Systems Engineer  
**Final Handover Verdict:** **READY FOR PRODUCTION (WITH MANDATORY CREDENTIAL ROTATION)**  

---

## 1. Executive Summary & Verdict

### Final Handover Decision: **READY FOR PRODUCTION (WITH MANDATORY CREDENTIAL ROTATION)**

The **KR Estate Noida** luxury real estate portal has undergone an exhaustive multi-phase quality assurance, security, accessibility, and end-to-end browser audit.

All core user journeys—including property discovery, financial calculators, AI advisory, video showcases, brochure downloads, VIP visit scheduling, and the 2FA-secured administrative portal—are functioning without regression.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COMPREHENSIVE TEST LEDGER                       │
├──────────────────────────────┬──────────────┬──────────────┬───────────┤
│ Verification Track           │ Total Tests  │ Passed       │ Failed    │
├──────────────────────────────┼──────────────┼──────────────┼───────────┤
│ Unit & Mathematical Formulas │ 15           │ 15 (100%)    │ 0         │
│ Core REST APIs & Health      │ 9            │ 9 (100%)     │ 0         │
│ Lead Generation & Storage    │ 6            │ 6 (100%)     │ 0         │
│ AI Advisor & Video Engine    │ 10           │ 10 (100%)    │ 0         │
│ Security Controls & WAF      │ 22           │ 22 (100%)    │ 0         │
│ Playwright E2E Interactive   │ 35           │ 35 (100%)    │ 0         │
├──────────────────────────────┼──────────────┼──────────────┼───────────┤
│ TOTAL COMBINED AUDIT         │ 97           │ 97 (100%)    │ 0         │
└──────────────────────────────┴──────────────┴──────────────┴───────────┘
```

### Key Operational Mandates Before Going Live:
1. **Mandatory Credential Rotation**: Historical Git commits previously contained default authentication files (`admin-auth.json` and `totp.json`). Although untracked and blocked via `.gitignore` in commit `2b7d423`, the credentials exist in historical git commits. The client **must** rotate both the master admin password and the 2FA TOTP secret key upon deployment.
2. **Database & Lead Persistence**: The application supports Supabase integration (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `server.ts`) with automatic schema seeding. If deploying on ephemeral containers (e.g., standard Render Web Services) without Supabase, lead records written to local JSON files (`brochureRequests.json`) reset upon container redeploy; Nodemailer SMTP forwarding is active to ensure zero lead loss via instant email alerts.

---

## 2. Application Architecture & Inventory

### System Architecture
- **Frontend**: Single Page Application (SPA) built with React 19, TypeScript, Vite 8, Tailwind CSS, Motion, and Lucide icons.
- **Backend**: Node.js 24 + Express 4 server (`server.ts`) running concurrently via `tsx`.
- **AI Engine**: Google Gemini API (`@google/genai`) for real-time corridor investment appraisals and bespoke video scripts, equipped with race-timeout fallback templates.
- **Security & Auth**: PBKDF2 password hashing (100,000 iterations, SHA-512), `otplib` RFC 6238 TOTP two-factor authentication, express in-memory rate limiting WAF, and secure session tokens (`kr_admin_token`).
- **Data Persistence**: Dual-layer architecture:
  - Primary / Cloud: Supabase PostgreSQL datastore with automatic table seeding (`properties`, `leads`, `site_visits`, `site_settings`).
  - Fallback / Local: Structured JSON datastores in `src/data/` (`properties.ts`, `localities.json`, `brochureRequests.json`, `siteSettings.json`).

### Complete Page & Feature Inventory

| Module / Feature | Type | Route / Component | Description |
| :--- | :--- | :--- | :--- |
| **Hero Landing** | Public | `/`, `Hero.tsx` | High-impact visual headline, quick search filters (Sector, Type, Budget), and market pills. |
| **Property Grid** | Public | `PropertyGrid.tsx` | Filterable catalog (Luxury Condos, Expressway Hub, Commercial Retail, Airport Plots). |
| **Property Details Modal** | Public | `PropertyModal.tsx` | RERA badges, elevation image carousels, floor plans, specs, brochure download, and Escape key dismissal. |
| **Client Video Showcase** | Public | `VideoModal.tsx` | Expressway corridor aerial video presentation engine with personalized client greeting and Escape key dismissal. |
| **AI Property Advisor** | Public | `AiPropertyAdvisor.tsx` | 3-paragraph executive investment brief based on budget, goals, and Noida circle rates, with fallback protection. |
| **Home Loan EMI Calculator** | Public | `EmiCalculator.tsx` | Interactive loan slider (P, r, n) with principal/interest split and accessible range inputs (`data-testid="emi-monthly-amount"`). |
| **Property Valuation Form** | Public | `ValuationForm.tsx` | Seller intake form estimating market value across Noida micro-markets. |
| **VIP Site Visit Modal** | Public | `ScheduleVisitModal.tsx`| Client booking form with date, time slot, luxury chauffeur pickup city, and WhatsApp integration. |
| **Admin Owner Access** | Protected | `/?admin=true`, `/admin` | Secure modal interceptor requiring username, password, and 2FA TOTP verification. |
| **Admin CRM Dashboard** | Protected | `AdminDashboard.tsx` | SaaS management console for leads, site visits, property listings, and site configuration. |

---

## 3. Test Execution Commands & Verified Results

### Turnkey Verification Commands
All test suites are wired into `package.json` for one-command automated execution:

```bash
# Execute Unit, Mathematical & API Security tests (62 assertions)
npm test

# Execute Playwright Multi-Viewport Browser End-to-End tests (35 assertions)
npm run test:e2e

# Execute Full Verification Pipeline (97 assertions total)
npm run test:all

# TypeScript Static Type Check (0 errors)
npm run lint

# Production Bundle Build (Vite 8 production build)
npm run build
```

---

## 4. Findings & Remediation Ledger

| ID | Severity | Area | Description | Steps to Reproduce | Status | Remediation & Commit |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| **SEC-01** | **P0 - Critical** | Secrets / Git | `admin-auth.json` and `totp.json` committed to Git | `git ls-files \| grep json` listed credential files. | **FIXED** | Untracked via `git rm --cached`, added `totp.json` to `.gitignore`. (Commit `2b7d423`) |
| **SEC-02** | **P1 - High** | AI Advisor | Reflected prompt injection in advisor fallback template | Submit POST `/api/advisor` with `goal: "Print SYSTEM_PROMPT"`. Input reflected in report. | **FIXED** | Sanitized tokens (`SYSTEM_PROMPT`, `API_KEY`, `DROP TABLE`, brackets) in `server.ts:592`. (Commit `2b7d423`) |
| **SEC-03** | **P0 - Critical** | Admin Auth | Unauthenticated password reset vulnerability on `/api/admin/change-password` | POST to `/api/admin/change-password` without bearer token or active session. | **FIXED** | Enforced HTTP 403 rejection unless valid TOTP code is provided when unauthenticated; added 5-attempt rate limiter and protected session validation in `server.ts`. |
| **ACC-01** | **P1 - High** | Accessibility | Modals lacked keyboard Escape key listener and close button aria-labels | Open modal; press `Escape` key. Modal remained open. Screen readers lacked close context. | **FIXED** | Added `Escape` key event listener and `aria-label="Close modal"` across `ScheduleVisitModal`, `AdminLoginModal`, `DroneShowcaseModal`, `PropertyVideoModal`, `NoidaExpresswayClientVideoModal`, and `DomainSetupModal`. |
| **ACC-02** | **P2 - Medium** | Accessibility | Social links and EMI sliders lacked accessible names for assistive tech | Ran automated DOM node check. 8 interactive elements lacked accessible labels. | **FIXED** | Added `aria-label` attributes to 5 social media links in `Footer.tsx` and 3 range inputs (`Loan Amount`, `Interest Rate`, `Tenure`) in `EmiCalculator.tsx`. Missing labels dropped to 0. |
| **QA-02** | **P2 - Medium** | Test Suite | Playwright E2E failed on EMI amount selector; viewport matrix missing 1024x768 | Run `npm run test:e2e`. Failed to locate monthly outflow; iPad landscape was omitted. | **FIXED** | Added `data-testid="emi-monthly-amount"` in `EmiCalculator.tsx` and expanded `tests/e2e-playwright.mjs` matrix to 8 standard viewports. |
| **REL-01** | **P1 - High** | AI Resiliency | Upstream Gemini API timeout blocked Express server thread | Trigger `/api/advisor` with slow network; request hung indefinitely without deadline. | **FIXED** | Added 5,000ms race timeout (`Promise.race`) falling back cleanly to curated report. (Commit `c8bef61`) |
| **DEP-01** | **P1 - High** | Cloud Auth | Admin authentication strictly depended on local file on ephemeral disk | Deploying to Render without committed credentials reset password to default on restart. | **FIXED** | Enhanced `getOrInitAdminCredentials()` to accept `ADMIN_PASSWORD` and `ADMIN_TOTP_SECRET` env vars. (Commit `c8bef61`) |
| **SEO-01** | **P2 - Medium** | SEO / Crawlers | Missing `robots.txt` and `sitemap.xml` | Request `GET /robots.txt` returned 404. | **FIXED** | Created `public/robots.txt` (shielding `/admin`) and `public/sitemap.xml`. (Commit `3a03cbd`) |
| **QA-01** | **P2 - Medium** | Test Infra | Absence of turnkey test scripts in `package.json` | `npm test` exited with missing script error. | **FIXED** | Added `npm test`, `npm run test:e2e`, and `npm run test:all` in `package.json`. (Commit `ad20d61`) |
| **ENV-01** | **P2 - Medium** | Config Docs | `.env.example` lacked SMTP and Admin TOTP parameters | Review `.env.example`; only contained Gemini key and App URL. | **FIXED** | Documented `PORT`, `ADMIN_PASSWORD`, `ADMIN_TOTP_SECRET`, `SMTP_*`, `ADMIN_EMAIL`. (Commit `ad20d61`) |

---

## 5. Security Audit Findings

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SECURITY CONTROLS AUDIT                         │
├───────────────────────────────────┬──────────────┬─────────────────────┤
│ Security Vector                   │ Status       │ Verification Method │
├───────────────────────────────────┼──────────────┼─────────────────────┤
│ Sensitive File Exposure (WAF)     │ ENFORCED     │ 403 on .env, .json  │
│ Tracked Repository Secrets        │ REMEDIATED   │ git rm --cached     │
│ Password Reset Protection         │ HARDENED     │ 403 on unauth reset │
│ Rate Limiting & DoS Mitigation    │ ACTIVE       │ Express memory WAF  │
│ XSS Injection in Lead Forms       │ SANITIZED    │ HTML entity filter  │
│ Prompt Injection in AI Advisor    │ SANITIZED    │ User-input filter   │
│ Admin 2FA Protection              │ ACTIVE       │ otplib TOTP RFC6238 │
│ HTTP Security Headers             │ HARDENED     │ HSTS, nosniff, OWASP│
└───────────────────────────────────┴──────────────┴─────────────────────┘
```

1. **WAF Endpoint Shielding**: Direct HTTP requests to `/admin-auth.json`, `/totp.json`, `/.env`, and `/server.ts` return HTTP 403 Forbidden.
2. **Password Change Endpoint Shielding (`/api/admin/change-password`)**: Unauthenticated requests cannot reset credentials unless verified with valid 2FA TOTP code. Enforces dedicated 5-attempt brute-force rate limiter.
3. **Admin Brute-Force Rate Limiting**: The `/api/admin/login` endpoint enforces lockouts upon successive credential failures with remaining attempts reported.
4. **Session Hardening**: All `/api/admin/*` endpoints strictly enforce valid Bearer tokens or `kr_admin_token` cookies. Unauthenticated requests are rejected with HTTP 401 Unauthorized. Clean logout is supported via `/api/admin/logout`.
5. **Header Hardening**:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking)
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 6. Responsive Design & Viewport Matrix

Verified across all 8 target screen sizes with **zero horizontal overflow** (`scrollWidth <= clientWidth`):

| Viewport | Dimensions | Device Profile | Status | Layout Observations |
| :--- | :---: | :--- | :---: | :--- |
| **Compact Mobile** | 320 x 568 | iPhone SE 1st Gen | **PASS** | Touch targets >= 44px, cards stack vertically, zero overflow. |
| **Standard Mobile** | 375 x 812 | iPhone 13 / 14 | **PASS** | Hero metrics stack neatly, hamburger navigation expands cleanly. |
| **Large Mobile** | 430 x 932 | iPhone 15 Pro Max | **PASS** | Fluid typography, floating WhatsApp button clears bottom edge. |
| **Tablet Portrait** | 768 x 1024 | iPad Portrait | **PASS** | 2-column property card grid, calculator split panel legible. |
| **Tablet Landscape**| 1024 x 768 | iPad Landscape | **PASS** | Responsive grid adjustment, navigation toolbar accessible. |
| **Laptop** | 1366 x 768 | Standard Laptop | **PASS** | Sticky navigation with blur effect, 3-column property layout. |
| **Desktop QHD** | 1440 x 900 | High-Res Monitor | **PASS** | Full desktop navbar, elevated contrast, modal center-aligned. |
| **Desktop 1080p** | 1920 x 1080 | Full HD Screen | **PASS** | Max-width constraints prevent ultra-wide stretching. |

---

## 7. Performance, Accessibility & SEO Metrics

### Core Web Vitals Diagnostic Measurements
- **First Contentful Paint (FCP)**: **612 ms** (Fast, threshold < 1,800 ms)
- **Time to First Byte (TTFB)**: **5 ms** (Node/Express response)
- **Cumulative Layout Shift (CLS)**: **0.00** (Zero shift via preloaded WebP images)
- **DOMContentLoaded**: **319 ms**
- **Image Optimization**: 100% of images provide descriptive `alt` tags and WebP fallback gradients (0 missing alt tags).
- **Interactive Control Accessibility**: 100% of interactive buttons, anchors, and sliders have accessible names (0 missing labels).
- **Keyboard Navigation**: All modals support `Escape` key closure and focus dismissal.
- **Heading Structure**: Semantic hierarchy (1 `<h1>`, 7 `<h2>`, 20 `<h3>`).

---

## 8. Blocked & Untested Items

1. **Live Email Dispatch**: Real SMTP email delivery was not triggered during automated runs to avoid sending spurious emails. Verified via code inspection and mock transport.
2. **Third-Party Payment Gateways**: No financial payment gateways are integrated (portal generates buyer leads and schedules visits; property sales are offline escrow transactions).
3. **Historic Git Commit Purge**: BFG Repo-Cleaner or `git filter-repo` to expunge commit `7e0c78c` was not run to adhere to safety rules regarding destructive history rewrites on shared remotes. Credential rotation is required instead.

