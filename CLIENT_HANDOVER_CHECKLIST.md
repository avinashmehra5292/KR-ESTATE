# KR-ESTATE — Client Production Handover Checklist

This document details the essential technical and operational handover steps for the owner and hosting engineering team before taking **krestatenoida.com** live.

---

## 1. Cloud & Server Environment Setup (Render / Node.js)

Configure the following environment variables in your Render Dashboard (**Settings > Environment Variables**). Do not commit real values to Git.

```env
# Network Configuration
PORT=3000
APP_URL=https://krestatenoida.com

# Google Gemini AI Integration (Property Advisor & Video Engine)
# Obtain key at: https://aistudio.google.com/
GEMINI_API_KEY=<PROD_GEMINI_API_KEY>

# Master Administrative Credentials (Rotate immediately upon launch)
ADMIN_PASSWORD=<PROD_STRONG_ADMIN_PASSWORD>
ADMIN_TOTP_SECRET=<PROD_BASE32_16_CHAR_TOTP_SECRET>

# Real-time Lead Notification Alerts (Nodemailer SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@krestatenoida.com
SMTP_PASS=<GMAIL_APP_SPECIFIC_PASSWORD>
ADMIN_NOTIFICATION_EMAIL=avinashmehra5292@gmail.com

# Supabase Managed Database (Recommended for permanent CRM lead persistence)
SUPABASE_URL=<PROD_SUPABASE_PROJECT_URL>
SUPABASE_ANON_KEY=<PROD_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<PROD_SUPABASE_SERVICE_ROLE_KEY>
```

### Build & Start Commands
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`

---

## 2. Mandatory Credential & Secret Rotation

> [!CAUTION]
> **Action Required:** Historical Git commits previously contained default authentication files (`admin-auth.json` and `totp.json`). While these files are now untracked and blocked via `.gitignore`, the previous credentials are compromised and **must not be used in production**.

- [ ] **Step 1:** Choose a strong, unique production administrator password and set it as `ADMIN_PASSWORD` in your cloud hosting environment.
- [ ] **Step 2:** Generate a new 16-character Base32 secret for 2FA TOTP (or scan the new QR code directly in the Admin Dashboard under Security Settings).
- [ ] **Step 3:** Generate a new Google Gemini API key specifically dedicated to this web application at [Google AI Studio](https://aistudio.google.com/).
- [ ] **Step 4:** Generate a Google Workspace / Gmail App Password for SMTP lead dispatch (do not use your primary Google account password).
- [ ] **Step 5:** Obtain production Supabase credentials (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`) from your Supabase Project Settings.

---

## 3. Custom Domain & SSL Provisioning

- [ ] **DNS Records Configuration:**
  - Add an **A Record**: Host `@` pointing to Render's IP address (provided in Render dashboard).
  - Add a **CNAME Record**: Host `www` pointing to your Render service URL (e.g. `kr-estate.onrender.com`).
- [ ] **SSL / TLS Verification:** Confirm that Render automatically provisions a free Let's Encrypt certificate and force-redirects HTTP traffic to HTTPS.
- [ ] **Canonical URL:** Verify that [https://krestatenoida.com](https://krestatenoida.com) loads securely with a green padlock.

---

## 4. Cloud Data Persistence & CRM Strategy

> [!NOTE]
> The server includes an integrated **Supabase Client with automatic table seeding**. When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured, property listings and CRM leads are automatically persisted to PostgreSQL and will never be lost upon container redeployment.

### Persistence Checklist:
- [ ] **Supabase Active:** Verify that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are populated in the production environment so lead capture writes directly to cloud PostgreSQL.
- [ ] **Zero-Data-Loss Failover:** Nodemailer SMTP alerts are active simultaneously. Even if the database connection ever experiences network partitions, every brochure download, site visit booking, and valuation enquiry is immediately emailed to `ADMIN_NOTIFICATION_EMAIL`.

---

## 5. Regulatory Compliance & Content Verification

- [ ] **UP RERA Registration Numbers:** Cross-verify that each RERA number listed in property details matches official records on the Uttar Pradesh RERA portal ([up-rera.in](https://up-rera.in)):
  - *ACE Starlit (Sector 150)*: UPRERAPRJ677297
  - *Godrej Woods (Sector 43)*: UPRERAPRJ704730
  - *ATS Knightsbridge (Sector 124)*: UPRERAPRJ3574
  - *Mahagun Manorialle (Sector 128)*: UPRERAPRJ2051
  - *Bhutani Cyberthum (Sector 140A)*: UPRERAPRJ240156
- [ ] **Official Contact Numbers:** Confirm that the phone number in `src/data/siteSettings.json` (`+91 78704 33580`) and email address (`krestate813@gmail.com`) are monitored by the KR Estate sales desk.
- [ ] **WhatsApp Concierge Link:** Test the floating WhatsApp button to ensure it opens a conversation with the designated sales agent.

---

## 6. Accessibility & Multi-Device Verification

- [x] **8 Viewport Responsiveness:** Tested and verified with 0 horizontal overflow across 320x568, 375x812, 430x932, 768x1024, 1024x768, 1366x768, 1440x900, and 1920x1080.
- [x] **Modal Keyboard Dismissal:** Verified that pressing the `Escape` key dismisses all modal windows (`ScheduleVisitModal`, `AdminLoginModal`, `DroneShowcaseModal`, `PropertyVideoModal`, `DomainSetupModal`).
- [x] **Screen Reader Labels:** Verified 0 unlabeled interactive controls; social media links and EMI range sliders include descriptive `aria-label` attributes.

---

## 7. Post-Deployment Smoke Test Protocol

Perform these 6 smoke tests immediately after pushing to production:

1. **Homepage Load:** Visit `https://krestatenoida.com` and verify the hero background loads crisply within 1 second.
2. **Interactive Loan Calculator:** Slide the EMI calculator to ₹2.0 Cr and ensure monthly outflow calculates in Indian Rupees without NaN or formatting glitches.
3. **AI Property Advisor:** Click "Generate Advisory Report" and verify that a 3-paragraph strategy is produced within 3 seconds (or served via fallback if API quota is reached).
4. **Site Visit Lead Submission:** Fill out a test visit request with your mobile number and confirm receipt of the email alert.
5. **Escape Key Modal Check:** Open any property or visit modal and press `Escape` on your keyboard to verify that it smoothly dismisses.
6. **Admin 2FA Login:** Navigate to `https://krestatenoida.com/?admin=true`, enter your production credentials, and enter the 6-digit TOTP code from Google Authenticator to confirm dashboard access.

---

## 8. Sign-off & Final Handover Status

- **Technical Handover Status:** **READY FOR PRODUCTION (WITH MANDATORY CREDENTIAL ROTATION)**
- **Lead Developer & QA Reviewer:** DeepMind Agentic Systems
- **Recipient:** KR Estate Management & Systems Operations Team

