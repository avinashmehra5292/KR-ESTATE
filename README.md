# KR Estate Noida - Luxury Real Estate Portal

A full-stack luxury real estate web platform for Noida, Greater Noida, and Yamuna Expressway corridor properties.

## Features
- **Curated Property Showcase:** Luxury residences, villas, commercial retail hubs, and Jewar Airport plots.
- **AI Property Advisor:** Personalized corridor investment briefs powered by Google Gemini with timeout-safe fallback.
- **Drone Walkthroughs & Video Showcase:** Immersive 4K aerial tours and bespoke presentation scripts.
- **Brochure & Site Visit Management:** Lead capture with real-time Nodemailer SMTP alerts and Supabase CRM persistence.
- **EMI & Valuation Calculators:** Interactive financial planning tools verified against exact mathematical benchmarks.
- **Administrative Portal:** Secure dashboard with PBKDF2 hashing, RFC 6238 2FA TOTP authentication, rate limiting, and session tokens.

## Getting Started

### Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Verification & Automated Testing
```bash
# TypeScript static type check
npm run lint

# Unit, mathematical & API security test suite (62 assertions)
npm test

# Playwright multi-viewport browser end-to-end tests (35 assertions)
npm run test:e2e

# Complete automated testing pipeline (97 total assertions)
npm run test:all
```

### Production Build & Launch
```bash
npm run build
npm run start
```

## Cloud Deployment (Render / Node.js)
Configured for deployment on [Render](https://render.com) or any standard container host:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`

For detailed production environment configuration, secret rotation steps, and verification matrices, refer to:
- [QA_REPORT.md](QA_REPORT.md) — Comprehensive QA Audit, Security Remediation & Test Results
- [CLIENT_HANDOVER_CHECKLIST.md](CLIENT_HANDOVER_CHECKLIST.md) — Production Handover & Deployment Checklist

