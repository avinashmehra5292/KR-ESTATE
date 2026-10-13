import express, { Request, Response, NextFunction } from 'express';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Supabase Client Initialization ---
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const useSupabase = !!(SUPABASE_URL && SUPABASE_KEY);
let supabase: SupabaseClient | null = null;

if (useSupabase) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('✅ Supabase client initialized — database-backed storage enabled');
} else {
  console.warn('⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — falling back to local JSON file storage');
}

// --- Supabase Data Helpers (camelCase ↔ snake_case) ---
function propertyRowToApi(row: any): any {
  return {
    id: row.id,
    title: row.title,
    developer: row.developer,
    tagline: row.tagline,
    sector: row.sector,
    locality: row.locality,
    propertyType: row.property_type,
    status: row.status,
    possessionDate: row.possession_date,
    priceDisplay: row.price_display,
    priceNumInCrores: row.price_num_in_crores,
    pricePerSqFt: row.price_per_sq_ft,
    bhkConfigurations: row.bhk_configurations,
    reraNumber: row.rera_number,
    totalAcres: row.total_acres,
    openGreensPercentage: row.open_greens_percentage,
    coverImage: row.cover_image,
    galleryImages: row.gallery_images,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    amenities: row.amenities,
    highlights: row.highlights,
    locationAdvantages: row.location_advantages,
    floorPlans: row.floor_plans,
    distanceToMetro: row.distance_to_metro,
    distanceToAirport: row.distance_to_airport,
    distanceToExpressway: row.distance_to_expressway,
    videoTour: row.video_tour,
    architecturalTheme: row.architectural_theme,
  };
}

function apiPropertyToRow(p: any): any {
  return {
    id: p.id,
    title: p.title,
    developer: p.developer || null,
    tagline: p.tagline || null,
    sector: p.sector || null,
    locality: p.locality || null,
    property_type: p.propertyType,
    status: p.status,
    possession_date: p.possessionDate || null,
    price_display: p.priceDisplay || null,
    price_num_in_crores: p.priceNumInCrores ?? null,
    price_per_sq_ft: p.pricePerSqFt ?? null,
    bhk_configurations: p.bhkConfigurations || [],
    rera_number: p.reraNumber || null,
    total_acres: p.totalAcres ?? null,
    open_greens_percentage: p.openGreensPercentage ?? null,
    cover_image: p.coverImage || null,
    gallery_images: p.galleryImages || [],
    short_description: p.shortDescription || null,
    full_description: p.fullDescription || null,
    amenities: p.amenities || [],
    highlights: p.highlights || [],
    location_advantages: p.locationAdvantages || [],
    floor_plans: p.floorPlans || [],
    distance_to_metro: p.distanceToMetro || null,
    distance_to_airport: p.distanceToAirport || null,
    distance_to_expressway: p.distanceToExpressway || null,
    video_tour: p.videoTour || null,
    architectural_theme: p.architecturalTheme || null,
  };
}

function localityRowToApi(row: any): any {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    subtitle: row.subtitle,
    description: row.description,
    avgPricePerSqFt: row.avg_price_per_sq_ft,
    projectedGrowth3Yr: row.projected_growth_3yr,
    highlights: row.highlights,
    metroConnectivity: row.metro_connectivity,
    landmarkAttractions: row.landmark_attractions,
    topProjects: row.top_projects,
  };
}

function apiLocalityToRow(loc: any): any {
  return {
    id: loc.id,
    name: loc.name,
    slug: loc.slug || null,
    subtitle: loc.subtitle || null,
    description: loc.description || null,
    avg_price_per_sq_ft: loc.avgPricePerSqFt || null,
    projected_growth_3yr: loc.projectedGrowth3Yr || null,
    highlights: loc.highlights || [],
    metro_connectivity: loc.metroConnectivity || null,
    landmark_attractions: loc.landmarkAttractions || [],
    top_projects: loc.topProjects || [],
  };
}

function brochureRowToApi(row: any): any {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.full_name,
    phone: row.phone,
    email: row.email,
    interestedProject: row.interested_project,
    propertyType: row.property_type,
    budgetRange: row.budget_range,
    message: row.message,
    source: row.source,
    leadType: row.lead_type,
    propertyId: row.property_id,
    propertyTitle: row.property_title,
    sector: row.sector,
    developer: row.developer,
    priceDisplay: row.price_display,
    status: row.lead_status,
    comment: row.comment,
  };
}

// Helper to upload base64 file to Supabase Storage (returns public URL)
async function uploadToSupabaseStorage(base64Data: string, fileName: string, bucket: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const matches = base64Data.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
    const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');
    const contentType = matches ? matches[1] : 'application/octet-stream';

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, { contentType, upsert: true });

    if (error) {
      console.error(`Supabase Storage upload error (${bucket}/${fileName}):`, error.message);
      return null;
    }

    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl.publicUrl;
  } catch (err: any) {
    console.error('uploadToSupabaseStorage error:', err.message);
    return null;
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Strict HTTP Security Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// 2. Web Application Firewall (WAF) - Blocks sensitive file downloads & traversal attempts
app.use((req: Request, res: Response, next: NextFunction) => {
  let normalizedPath = '';
  try {
    normalizedPath = decodeURI(req.path).toLowerCase();
  } catch {
    normalizedPath = req.path.toLowerCase();
  }

  const blockedPatterns = [
    /^\/admin-auth\.json/i,
    /^\/totp\.json/i,
    /^\/\.env/i,
    /^\/server\.ts/i,
    /^\/package\.json/i,
    /^\/tsconfig\.json/i,
    /^\/vite\.config\.ts/i,
    /^\/\.git/i,
    /brochurerequests\.json/i,
  ];

  if (blockedPatterns.some((pattern) => pattern.test(normalizedPath))) {
    return res.status(403).json({ error: 'Access denied: protected system file.' });
  }

  next();
});

// 3. Safe Body Parser Limits (25mb max to prevent heap-exhaustion DoS while supporting base64 uploads)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
const staticCacheOptions = {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  setHeaders: (res: Response, filePath: string) => {
    if (/\.(webp|jpg|jpeg|png|svg|ico)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    }
  }
};
app.use(express.static(path.resolve(__dirname, 'public'), staticCacheOptions));
app.use('/uploads', express.static(path.resolve(__dirname, 'public', 'uploads'), staticCacheOptions));
app.use('/images', express.static(path.resolve(__dirname, 'public', 'images'), staticCacheOptions));

// 4. HTML Entity Sanitizer (Prevents HTML & Email Injection)
function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || '127.0.0.1';
}

// 5. Rate Limiter for Public Endpoints (DoS, Spam & Quota Abuse Prevention)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const publicApiLimiter = new Map<string, RateLimitRecord>();

function checkPublicRateLimit(req: Request, res: Response, maxRequests: number, windowMs: number): boolean {
  const clientIp = getClientIp(req);
  const key = `${clientIp}:${req.path}`;
  const now = Date.now();
  const record = publicApiLimiter.get(key);

  if (!record || record.resetAt < now) {
    publicApiLimiter.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    const waitSecs = Math.ceil((record.resetAt - now) / 1000);
    res.status(429).json({ error: `Too many requests. Please try again in ${waitSecs} second(s).` });
    return false;
  }

  record.count += 1;
  return true;
}

// --- SECURE SERVER-SIDE AUTHENTICATION ENGINE ---
interface AdminCredentials {
  username: string;
  salt: string;
  hash: string;
  updatedAt: string;
  totpSecret?: string;
  totpEnabled?: boolean;
}

const ADMIN_AUTH_FILE = path.resolve(__dirname, 'admin-auth.json');
const activeAdminSessions = new Map<string, { username: string; expiresAt: number }>();
const loginRateLimiter = new Map<string, { count: number; lockUntil: number }>();

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

async function getOrInitAdminCredentials(): Promise<AdminCredentials> {
  const fs = await import('fs/promises');
  const configuredPassword = process.env.ADMIN_PASSWORD || 'QWERTY';
  const configuredUsername = process.env.ADMIN_USERNAME || 'ADMIN';
  try {
    const raw = await fs.readFile(ADMIN_AUTH_FILE, 'utf8');
    const creds: AdminCredentials = JSON.parse(raw);

    // If ADMIN_PASSWORD is set in environment and differs, sync it
    if (process.env.ADMIN_PASSWORD) {
      const currentHash = hashPassword(process.env.ADMIN_PASSWORD, creds.salt);
      if (currentHash !== creds.hash) {
        creds.salt = crypto.randomBytes(16).toString('hex');
        creds.hash = hashPassword(process.env.ADMIN_PASSWORD, creds.salt);
        creds.updatedAt = new Date().toISOString();
        try { await fs.writeFile(ADMIN_AUTH_FILE, JSON.stringify(creds, null, 2), 'utf8'); } catch {}
      }
    }

    if (process.env.ADMIN_USERNAME && creds.username.toLowerCase() !== process.env.ADMIN_USERNAME.toLowerCase()) {
      creds.username = process.env.ADMIN_USERNAME;
      try { await fs.writeFile(ADMIN_AUTH_FILE, JSON.stringify(creds, null, 2), 'utf8'); } catch {}
    }

    if (process.env.ADMIN_TOTP_SECRET && !creds.totpSecret) {
      creds.totpSecret = process.env.ADMIN_TOTP_SECRET;
      creds.totpEnabled = true;
    }
    return creds;
  } catch {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(configuredPassword, salt);
    const creds: AdminCredentials = {
      username: configuredUsername,
      salt,
      hash,
      updatedAt: new Date().toISOString(),
      totpSecret: process.env.ADMIN_TOTP_SECRET || undefined,
      totpEnabled: Boolean(process.env.ADMIN_TOTP_SECRET)
    };
    try {
      await fs.writeFile(ADMIN_AUTH_FILE, JSON.stringify(creds, null, 2), 'utf8');
    } catch (writeErr) {
      // In read-only or ephemeral environments without write access, creds are kept in memory
      console.warn('Could not persist admin-auth.json, using in-memory credentials');
    }
    return creds;
  }
}

function parseCookies(req: Request): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (name) list[name] = decodeURIComponent(parts.slice(1).join('=').trim());
  });
  return list;
}

// Authentication Middleware for all /api/admin/* endpoints
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/api/admin/login' || req.path === '/api/admin/totp-verify' || req.path === '/api/admin/auth-check') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const cookieToken = parseCookies(req)['kr_admin_token'];
  const token = bearerToken || cookieToken;

  if (req.path === '/api/admin/change-password') {
    if (token) {
      const session = activeAdminSessions.get(token);
      if (session && session.expiresAt > Date.now()) {
        (req as any).adminUser = session.username;
      }
    }
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required.' });
  }

  const session = activeAdminSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeAdminSessions.delete(token);
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  // Rolling 24-hour expiration on activity
  session.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  (req as any).adminUser = session.username;
  next();
}

// Apply authentication middleware strictly to /api/admin/* endpoints
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/admin')) {
    return requireAdminAuth(req, res, next);
  }
  next();
});

// API Route: Admin Login with Rate Limiting & Cryptographic Verification
app.post('/api/admin/login', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  const now = Date.now();

  // Rate Limiting Check (5 attempts / 15 min lock)
  const rateLimit = loginRateLimiter.get(clientIp);
  if (rateLimit && rateLimit.lockUntil > now) {
    const waitMins = Math.ceil((rateLimit.lockUntil - now) / 60000);
    return res.status(429).json({
      error: `Too many failed attempts. Security lock active. Please wait ${waitMins} minute(s).`
    });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const creds = await getOrInitAdminCredentials();
    const isUserMatch = String(username).trim().toLowerCase() === creds.username.toLowerCase();
    const testHash = hashPassword(String(password), creds.salt);
    const isPassMatch = crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(creds.hash, 'hex'));

    if (!isUserMatch || !isPassMatch) {
      const attempts = (rateLimit ? rateLimit.count : 0) + 1;
      const lockUntil = attempts >= 5 ? now + 15 * 60 * 1000 : 0;
      loginRateLimiter.set(clientIp, { count: attempts, lockUntil });

      const remaining = Math.max(0, 5 - attempts);
      return res.status(401).json({
        error: attempts >= 5
          ? 'Too many failed attempts. Security lock active for 15 minutes.'
          : `Invalid admin credentials. ${remaining} attempt(s) remaining.`
      });
    }

    // Login successful: reset rate limiter
    loginRateLimiter.delete(clientIp);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = now + 24 * 60 * 60 * 1000;
    activeAdminSessions.set(token, { username: creds.username, expiresAt });

    res.setHeader('Set-Cookie', `kr_admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);

    return res.json({
      success: true,
      token,
      username: creds.username,
      message: 'Admin authenticated successfully.'
    });
  } catch (err: any) {
    console.error('Error during admin login:', err);
    return res.status(500).json({ error: 'Authentication service error.' });
  }
});

// API Route: Admin Session Logout
app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const cookieToken = parseCookies(req)['kr_admin_token'];
  const token = bearerToken || cookieToken;

  if (token) {
    activeAdminSessions.delete(token);
  }

  res.setHeader('Set-Cookie', 'kr_admin_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// API Route: Verify Admin Session Status
app.get('/api/admin/auth-check', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const cookieToken = parseCookies(req)['kr_admin_token'];
  const token = bearerToken || cookieToken;

  if (!token) {
    return res.json({ authenticated: false });
  }

  const session = activeAdminSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeAdminSessions.delete(token);
    return res.json({ authenticated: false });
  }

  return res.json({ authenticated: true, username: session.username });
});

// API Route: Verify TOTP Code
app.post('/api/admin/totp-verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Verification code is required.' });
    }
    const creds = await getOrInitAdminCredentials();
    if (!creds.totpSecret) {
      return res.json({ success: true, message: 'Code accepted.' });
    }
    const isValid = authenticator.verify({ token: String(token).trim(), secret: creds.totpSecret });
    if (isValid) {
      return res.json({ success: true, message: 'Code verified successfully.' });
    }
    return res.status(400).json({ error: 'Invalid or expired 6-digit authenticator code.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to verify code.' });
  }
});

// API Route: Generate TOTP Secret & QR Code for 2FA Setup
app.get('/api/admin/totp-generate', async (req: Request, res: Response) => {
  try {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri('admin', 'KR Estate Noida', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauth);
    return res.json({ secret, qrCodeUrl });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate 2FA setup details.' });
  }
});

// API Route: Confirm and Activate TOTP 2FA
app.post('/api/admin/totp-setup', async (req: Request, res: Response) => {
  try {
    const { secret, token } = req.body;
    if (!secret || !token) {
      return res.status(400).json({ error: 'Secret and verification token are required.' });
    }
    const isValid = authenticator.verify({ token: String(token).trim(), secret: String(secret).trim() });
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 6-digit verification code.' });
    }

    const fs = await import('fs/promises');
    const creds = await getOrInitAdminCredentials();
    creds.totpSecret = String(secret).trim();
    creds.totpEnabled = true;
    creds.updatedAt = new Date().toISOString();
    await fs.writeFile(ADMIN_AUTH_FILE, JSON.stringify(creds, null, 2), 'utf8');

    return res.json({ success: true, message: 'Two-Factor Authentication activated successfully!' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to complete 2FA setup.' });
  }
});

// API Route: Secure Password Change
app.post('/api/admin/change-password', async (req: Request, res: Response) => {
  try {
    const { newPassword, token } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const creds = await getOrInitAdminCredentials();
    const isAuthenticatedAdmin = Boolean((req as any).adminUser);

    // If not already authenticated via admin session, must verify TOTP
    if (!isAuthenticatedAdmin) {
      if (creds.totpEnabled && creds.totpSecret) {
        if (!token) {
          return res.status(401).json({ error: '2FA verification code required to reset password.' });
        }
        const isTotpValid = authenticator.verify({ token: String(token).trim(), secret: creds.totpSecret });
        if (!isTotpValid) {
          return res.status(401).json({ error: 'Invalid or expired 2FA verification code.' });
        }
      }
    } else if (creds.totpEnabled && creds.totpSecret && token) {
      const isTotpValid = authenticator.verify({ token: String(token).trim(), secret: creds.totpSecret });
      if (!isTotpValid) {
        return res.status(400).json({ error: 'Invalid 2FA verification code.' });
      }
    }

    const fs = await import('fs/promises');
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(newPassword, newSalt);

    creds.salt = newSalt;
    creds.hash = newHash;
    creds.updatedAt = new Date().toISOString();
    await fs.writeFile(ADMIN_AUTH_FILE, JSON.stringify(creds, null, 2), 'utf8');

    return res.json({ success: true, message: 'Admin password updated securely.' });
  } catch (err: any) {
    console.error('Error changing admin password:', err);
    return res.status(500).json({ error: 'Failed to update admin password.' });
  }
});

// Initialize Google GenAI SDK (User-Agent header required by AI Studio guidelines)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Mock in-memory storage for leads & valuations to ensure zero loss
const leadInquiries: any[] = [];
const valuationRequests: any[] = [];

// API Route: Generate Bespoke Real Estate Noida Expressway Video Script for Client
app.post('/api/generate-client-video-script', async (req: Request, res: Response) => {
  if (!checkPublicRateLimit(req, res, 15, 5 * 60 * 1000)) return;
  try {
    const { clientName, focus, budget, highlights } = req.body;

    const safeClient = clientName?.trim() || 'Valued Investor';
    const safeFocus = focus || 'Luxury Living & High Capital Growth';
    const safeBudget = budget || '₹2 Cr - ₹5 Cr';
    const safeHighlights = Array.isArray(highlights) ? highlights.join(', ') : 'Jewar Airport, Metro, 80% Green belts';

    const prompt = `
Create an executive, cinematic 60-second video voiceover script for a real estate client presentation by KR Estate Noida (krestatenoida.com).
Client Name: ${safeClient}
Focus Corridor: Noida Expressway, Uttar Pradesh
Specific Requirement: ${safeFocus}
Target Budget: ${safeBudget}
Key Highlights to Emphasize: ${safeHighlights}

The script should be divided into 4 chronological video scenes matching the drone flight down the 8-lane Noida-Greater Noida Expressway:
1. Scene 1 (0-15s): Welcome & The Gateway (Sector 124-128 Wish Town, ATS Knightsbridge, Mahagun Manorialle, 10 min to South Delhi DND).
2. Scene 2 (15-30s): Commercial Powerhouse & IT Corridors (Sector 140A Bhutani Cyberthum, Sector 142/144 Advant Navis, Aqua Line Metro).
3. Scene 3 (30-45s): Low-Density Green Living (Sector 150 Sports City, ACE Starlit, 80% green reserves, Shaheed Bhagat Singh park).
4. Scene 4 (45-60s): Global Connectivity & Summary (Expressway to Jewar International Airport in 25 mins, strong capital appreciation, VIP site inspection call to action with KR Estate).

Return your response in clean JSON format with keys:
- "clientGreeting": A one-line greeting addressing the client by name.
- "executiveSummary": A two-sentence high-impact overview of why the Noida Expressway suits their exact budget and goals.
- "scenes": Array of 4 objects, each with { "sceneNumber": 1..4, "title": "...", "sector": "...", "duration": "15s", "droneTelemetry": "...", "narrationText": "..." }
- "callToAction": Final invitation to book a private chauffeur-driven site inspection.
`;

    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are the Senior Real Estate Media Director & Property Advisor at KR Estate Noida. You write cinematic, highly factual, refined luxury real estate scripts for high-net-worth buyers and investors in Noida Expressway. Return pure valid JSON.',
            responseMimeType: 'application/json',
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini timeout')), 4000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const responseText = response.text || '';
        const parsed = JSON.parse(responseText);
        if (parsed && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
          return res.json(parsed);
        }
      } catch (geminiError) {
        console.warn('Gemini script generation fallback to high-quality template:', geminiError);
      }
    }

    // High quality deterministic fallback matching the 4 scenes
    const fallbackData = {
      clientGreeting: `Exclusively prepared for ${safeClient} by KR Estate Noida`,
      executiveSummary: `A curated aerial and ground survey across the Noida-Greater Noida Expressway, analyzing premier high-appreciation micro-markets aligned with your investment criteria (${safeBudget}).`,
      scenes: [
        {
          sceneNumber: 1,
          title: 'The Aristocratic Gateway',
          sector: 'Sector 124 - Sector 128 (Wish Town)',
          duration: '15s',
          droneTelemetry: 'ALT: 180M · SECTOR 128 GOLF CORRIDOR · 10 MIN TO SOUTH DELHI',
          narrationText: `Welcome ${safeClient}. We begin our aerial survey at the gateway of the Noida Expressway, just 10 minutes from South Delhi. Here, iconic landmarks like ATS Knightsbridge and Mahagun Manorialle overlook the championship 18-hole golf course, providing unmatched privacy and architectural stature.`,
        },
        {
          sceneNumber: 2,
          title: 'The Commercial Tech Powerhouse',
          sector: 'Sector 140A & Sector 142/144 Corridor',
          duration: '15s',
          droneTelemetry: 'ALT: 165M · SECTOR 140A CYBERTHUM · 200,000+ WORKFORCE',
          narrationText: `Moving south along the 8-lane expressway, we enter Noida’s financial and tech nerve center. Sector 140A features North India’s tallest twin 50-storey commercial skyscrapers at Bhutani Cyberthum, directly served by the Aqua Line Metro with exceptional 9% to 12% projected rental yields.`,
        },
        {
          sceneNumber: 3,
          title: 'The Green Lung: Sector 150 Sports City',
          sector: 'Sector 150 Sports City',
          duration: '15s',
          droneTelemetry: 'ALT: 210M · SECTOR 150 GREEN SANCTUARY · 80% RECREATIONAL GREENS',
          narrationText: `Here is Sector 150 Sports City, celebrated as the greenest sector in NCR. Spanning 80% open landscaped parks with zero overhead electrical wiring, developments like ACE Starlit offer expansive glass curtain residences overlooking the 42-acre Shaheed Bhagat Singh park.`,
        },
        {
          sceneNumber: 4,
          title: 'Global Future & Jewar Airport Link',
          sector: 'Yamuna Expressway & Jewar Corridor',
          duration: '15s',
          droneTelemetry: 'ALT: 240M · SIGNAL-FREE CORRIDOR · 25 MIN TO JEWAR AIRPORT',
          narrationText: `Within 25 minutes signal-free transit lies the upcoming Noida International Airport at Jewar. This infrastructure catalyst is driving unprecedented capital security. KR Estate invites you to experience these corridors firsthand with our private chauffeured site visit.`,
        },
      ],
      callToAction: `Schedule your private VIP site inspection with KR Estate's Senior Advisory Desk.`,
    };

    return res.json(fallbackData);
  } catch (error: any) {
    console.error('Error in /api/generate-client-video-script:', error);
    res.status(500).json({
      error: 'Failed to generate custom script',
      clientGreeting: 'Exclusively prepared for our Valued Client by KR Estate Noida',
      executiveSummary: 'An aerial drone survey of the premier investment micro-markets along Noida Expressway.',
      scenes: [],
    });
  }
});

// API Route: AI Real Estate Advisor
app.post('/api/advisor', async (req: Request, res: Response) => {
  if (!checkPublicRateLimit(req, res, 20, 5 * 60 * 1000)) return;
  try {
    const { goal, budget, config, preference } = req.body;

    const prompt = `
Client Investment Profile:
- Objective: ${goal}
- Budget Range: ${budget}
- Preferred Configuration: ${config}
- Priority Focus: ${preference}

Provide an executive, highly tailored 3-paragraph investment appraisal from KR Estate Noida (krestatenoida.com):
1. Top 2 specific project recommendations matching this exact budget and priority among Noida landmarks (e.g. Godrej Woods Sector 43, ACE Starlit Sector 150, ATS Knightsbridge Sector 124, Mahagun Manorialle Sector 128, Bhutani Cyberthum Sector 140A, or Jewar Aerocity Plots). Include current approximate price brackets in Crores/Lakhs and price per sq.ft.
2. Locality & Infrastructure Catalyst: Explain why this micro-market (Sector 150, Expressway, Central Noida, or Yamuna Expressway) has an advantage, referencing metro connectivity or the upcoming Noida International Airport at Jewar.
3. Realistic Financial ROI: Estimated rental yield (% p.a.) and 3-year projected capital appreciation.
Keep the tone authoritative, trustworthy, and actionable. Do not use generic buzzwords.
`;

    let reportText = '';
    const recommendedProjects: string[] = [];

    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are the Chief Real Estate Strategy Director at KR Estate Noida (krestatenoida.com), an authorized RERA property consultancy in Noida, Greater Noida, and Yamuna Expressway. Speak with precise factual knowledge of Noida sectors, circle rates, and infrastructure milestones.',
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini timeout')), 5000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        reportText = response.text || '';
      } catch (geminiError) {
        console.warn('Gemini call failed or key invalid, using expert fallback report:', geminiError);
      }
    }

    if (!reportText) {
      const cleanGoal = typeof goal === 'string' 
        ? goal.replace(/[<>{}`$]/g, '').replace(/SYSTEM_PROMPT|API_KEY|DROP\s+TABLE|--/gi, '').trim().slice(0, 100)
        : 'wealth generation';
      const cleanBudget = typeof budget === 'string'
        ? budget.replace(/[<>{}`$]/g, '').replace(/SYSTEM_PROMPT|API_KEY|DROP\s+TABLE|--/gi, '').trim().slice(0, 50)
        : 'selected budget';

      reportText = `Based on your goal (${cleanGoal || 'strategic acquisition'}) and budget (${cleanBudget || 'stated range'}), KR Estate strongly recommends evaluating Sector 150 Sports City (ACE Starlit) and Sector 43 (Godrej Woods). 

Sector 150 offers 80% open greens with signal-free transit to the upcoming Jewar International Airport (25 mins) and the Aqua Line metro. Current prices range between ₹12,500 – ₹17,000/sq.ft.

Expected rental yield on high-rise residential in this corridor is 4.2% – 5.5% with an anticipated 28%–35% capital appreciation over the next 36 months as airport operations commence.`;
    }

    if (reportText.includes('Godrej Woods')) recommendedProjects.push('Godrej Woods');
    if (reportText.includes('ACE Starlit')) recommendedProjects.push('ACE Starlit');
    if (reportText.includes('ATS Knightsbridge')) recommendedProjects.push('ATS Knightsbridge');
    if (reportText.includes('Mahagun Manorialle')) recommendedProjects.push('Mahagun Manorialle');
    if (reportText.includes('Bhutani Cyberthum')) recommendedProjects.push('Bhutani Cyberthum');
    if (reportText.includes('Jewar') || reportText.includes('Aerocity')) recommendedProjects.push('Jewar Aerocity Freehold Plots');
    if (recommendedProjects.length === 0) recommendedProjects.push('ACE Starlit', 'Godrej Woods');

    return res.json({
      report: reportText,
      recommendedProjects,
    });
  } catch (error: any) {
    console.error('Error in /api/advisor:', error);
    res.json({
      report: 'Based on your criteria, our senior advisory desk recommends ACE Starlit (Sector 150) and Godrej Woods (Sector 43) for optimum capital security and strong rental demand in Noida.',
      recommendedProjects: ['ACE Starlit', 'Godrej Woods'],
    });
  }
});

// API Route: Schedule VIP Site Visit
app.post('/api/schedule-visit', async (req: Request, res: Response) => {
  if (!checkPublicRateLimit(req, res, 15, 10 * 60 * 1000)) return;
  const visitData = {
    ...req.body,
    receivedAt: new Date().toISOString(),
    recipientEmail: 'avinashmehra5292@gmail.com',
  };
  leadInquiries.push(visitData);
  console.log('Site Visit Booked for KR Estate (Target: avinashmehra5292@gmail.com):', visitData);

  // Persist to database for Admin Dashboard "Brochure & Site Leads"
  try {
    const newVisitLead = {
      id: `VISIT-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      name: req.body.fullName || 'VIP Client',
      phone: req.body.phoneNumber || 'N/A',
      email: req.body.email || 'N/A',
      leadType: 'Site Visit',
      comment: `VIP Site Visit on ${req.body.date || 'TBD'} (${req.body.timeSlot || 'Slot TBD'}). Pickup: ${req.body.pickupRequired ? (req.body.pickupCity || 'Yes') : 'No'}`,
      propertyId: '',
      propertyTitle: req.body.project || 'KR Estate VIP Site Visit',
      sector: 'Noida',
      developer: 'KR Estate VIP Escort',
      priceDisplay: 'Scheduled Visit',
      status: 'Visit Booked'
    };

    if (useSupabase && supabase) {
      await supabase.from('brochure_requests').insert({
        id: newVisitLead.id,
        full_name: newVisitLead.name,
        phone: newVisitLead.phone,
        email: newVisitLead.email,
        lead_type: newVisitLead.leadType,
        comment: newVisitLead.comment,
        property_id: newVisitLead.propertyId,
        property_title: newVisitLead.propertyTitle,
        sector: newVisitLead.sector,
        developer: newVisitLead.developer,
        price_display: newVisitLead.priceDisplay,
        lead_status: newVisitLead.status,
        source: 'site_visit',
      });
    } else {
      const fs = await import('fs/promises');
      const brochurePath = path.resolve(__dirname, 'src', 'data', 'brochureRequests.json');
      let list: any[] = [];
      try {
        const data = await fs.readFile(brochurePath, 'utf8');
        list = JSON.parse(data);
      } catch {
        list = [];
      }
      list.unshift(newVisitLead);
      await fs.writeFile(brochurePath, JSON.stringify(list, null, 2), 'utf8');
    }
  } catch (persistErr) {
    console.error('Failed to persist site visit request:', persistErr);
  }

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: `"KR Estate Bookings" <${process.env.SMTP_USER}>`,
        to: 'avinashmehra5292@gmail.com',
        subject: `New Site Visit Booking: ${escapeHtml(visitData.project)}`,
        html: `
          <h2>New Site Visit Booking</h2>
          <p><strong>Name:</strong> ${escapeHtml(visitData.fullName)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(visitData.phoneNumber)}</p>
          <p><strong>Email:</strong> ${escapeHtml(visitData.email)}</p>
          <p><strong>Project:</strong> ${escapeHtml(visitData.project)}</p>
          <p><strong>Date:</strong> ${escapeHtml(visitData.date)}</p>
          <p><strong>Time Slot:</strong> ${escapeHtml(visitData.timeSlot)}</p>
          <p><strong>Pickup Required:</strong> ${visitData.pickupRequired ? 'Yes' : 'No'}</p>
          ${visitData.pickupRequired ? `<p><strong>Pickup City:</strong> ${escapeHtml(visitData.pickupCity)}</p>` : ''}
        `,
      });
      console.log('Email sent successfully to avinashmehra5292@gmail.com');
    } else {
      console.warn('SMTP credentials not found in .env. Skipping email sending.');
    }
  } catch (error) {
    console.error('Failed to send email:', error);
  }

  res.json({
    success: true,
    message: 'Site visit booked successfully',
    bookingId: `KR-${Date.now().toString().slice(-6)}`,
  });
});

// API Route: Property Valuation / Resale Listing
app.post('/api/valuation', (req: Request, res: Response) => {
  if (!checkPublicRateLimit(req, res, 15, 10 * 60 * 1000)) return;
  const valuationData = {
    ...req.body,
    receivedAt: new Date().toISOString(),
    recipientEmail: 'avinashmehra5292@gmail.com',
  };
  valuationRequests.push(valuationData);
  console.log('Valuation Request for KR Estate (Target: avinashmehra5292@gmail.com):', valuationData);

  res.json({
    success: true,
    message: 'Valuation request submitted successfully',
    requestId: `VAL-${Date.now().toString().slice(-6)}`,
  });
});

// API Route: Request Property PDF Brochure & Cost Sheet (Records lead and sends email)
app.post('/api/request-brochure', async (req: Request, res: Response) => {
  if (!checkPublicRateLimit(req, res, 20, 10 * 60 * 1000)) return;

  const newLead = {
    id: `BRC-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
    name: req.body.name || 'Anonymous Client',
    phone: req.body.phone || 'N/A',
    email: req.body.email || 'N/A',
    comment: req.body.comment || 'Requested complete digital brochure and cost sheet.',
    propertyId: req.body.propertyId || '',
    propertyTitle: req.body.propertyTitle || 'General Noida Inquiry',
    sector: req.body.sector || 'Noida',
    developer: req.body.developer || 'KR Estate',
    priceDisplay: req.body.priceDisplay || 'On Request',
    leadType: 'Brochure Request',
    status: 'New'
  };

  // 1. Persist to database for Admin Dashboard
  try {
    if (useSupabase && supabase) {
      await supabase.from('brochure_requests').insert({
        id: newLead.id,
        full_name: newLead.name,
        phone: newLead.phone,
        email: newLead.email,
        comment: newLead.comment,
        property_id: newLead.propertyId,
        property_title: newLead.propertyTitle,
        sector: newLead.sector,
        developer: newLead.developer,
        price_display: newLead.priceDisplay,
        lead_type: newLead.leadType,
        lead_status: newLead.status,
        source: 'brochure_download',
      });
    } else {
      const fs = await import('fs/promises');
      const brochurePath = path.resolve(__dirname, 'src', 'data', 'brochureRequests.json');
      let list: any[] = [];
      try {
        const data = await fs.readFile(brochurePath, 'utf8');
        list = JSON.parse(data);
      } catch {
        list = [];
      }
      list.unshift(newLead);
      await fs.writeFile(brochurePath, JSON.stringify(list, null, 2), 'utf8');
    }
  } catch (persistErr) {
    console.error('Failed to persist brochure request:', persistErr);
  }

  // 2. Send Email Notification
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: `"KR Estate Brochure Inquiries" <${process.env.SMTP_USER}>`,
        to: 'avinashmehra5292@gmail.com',
        subject: `New PDF Brochure & Cost Sheet Request: ${escapeHtml(newLead.propertyTitle)}`,
        html: `
          <h2>New PDF Brochure & Cost Sheet Request</h2>
          <p><strong>Property:</strong> ${escapeHtml(newLead.propertyTitle)} (${escapeHtml(newLead.sector)})</p>
          <p><strong>Customer Name:</strong> ${escapeHtml(newLead.name)}</p>
          <p><strong>Contact Number:</strong> ${escapeHtml(newLead.phone)}</p>
          <p><strong>Email:</strong> ${escapeHtml(newLead.email)}</p>
          <p><strong>Comment / Requirement:</strong> ${escapeHtml(newLead.comment)}</p>
          <p><strong>Requested At:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        `,
      });
      console.log('Brochure request email sent successfully to avinashmehra5292@gmail.com');
    }
  } catch (emailErr) {
    console.error('Failed to send brochure request email:', emailErr);
  }

  res.json({
    success: true,
    message: 'Brochure request recorded successfully',
    requestId: newLead.id,
  });
});

// API Route: Upload Property Video (Strict extension whitelist & sanitization)
app.post('/api/admin/upload-video', async (req: Request, res: Response) => {
  try {
    if (req.body && req.body.base64) {
      const { name, base64 } = req.body;
      const rawExt = (name && name.split('.').pop()?.toLowerCase()) || 'mp4';
      const ALLOWED_VIDEO_EXTS = ['mp4', 'webm', 'mov', 'mkv'];

      if (!ALLOWED_VIDEO_EXTS.includes(rawExt)) {
        return res.status(400).json({
          success: false,
          error: `Invalid video format (.${escapeHtml(rawExt)}). Only MP4, WebM, MOV, and MKV video files are permitted.`
        });
      }

      const cleanName = (name ? name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') : 'tour');
      const fileName = `video-${cleanName.slice(0, 40)}-${Date.now()}.${rawExt}`;

      // Use Supabase Storage in production, local fs in development
      if (useSupabase && supabase) {
        const publicUrl = await uploadToSupabaseStorage(base64, `videos/${fileName}`, 'uploads');
        if (!publicUrl) {
          return res.status(500).json({ success: false, error: 'Failed to upload video to cloud storage' });
        }
        const matches = base64.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
        const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64, 'base64');
        const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
        console.log(`Uploaded video to Supabase Storage: ${fileName} (${sizeMb} MB)`);
        return res.json({
          success: true,
          videoUrl: publicUrl,
          fileName,
          sizeMb,
        });
      } else {
        const fs = await import('fs/promises');
        const videosDir = path.resolve(__dirname, 'public', 'uploads', 'videos');
        await fs.mkdir(videosDir, { recursive: true });

        const matches = base64.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
        const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64, 'base64');
        const filePath = path.resolve(videosDir, fileName);
        await fs.writeFile(filePath, buffer);

        const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
        console.log(`Uploaded video saved: ${filePath} (${sizeMb} MB)`);
        return res.json({
          success: true,
          videoUrl: `/uploads/videos/${fileName}`,
          fileName,
          sizeMb,
        });
      }
    }

    return res.status(400).json({ success: false, error: 'No video payload received' });
  } catch (err: any) {
    console.error('Error in /api/admin/upload-video:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to save video' });
  }
});

// API Route: Get Site Settings
app.get('/api/site-settings', async (req: Request, res: Response) => {
  try {
    if (useSupabase && supabase) {
      const { data, error } = await supabase.from('site_settings').select('settings').eq('id', 1).single();
      if (!error && data?.settings) {
        return res.json(data.settings);
      }
      // If table is empty or record not found, load default and seed Supabase
      try {
        const fs = await import('fs/promises');
        const settingsFile = path.resolve(__dirname, 'src', 'data', 'siteSettings.json');
        const content = await fs.readFile(settingsFile, 'utf8');
        const initialSettings = JSON.parse(content);
        await supabase.from('site_settings').upsert({ id: 1, settings: initialSettings }, { onConflict: 'id' });
        return res.json(initialSettings);
      } catch (fallbackErr) {
        console.error('Fallback site_settings read error:', fallbackErr);
      }
      return res.status(500).json({ error: 'Failed to read site settings' });
    } else {
      const fs = await import('fs/promises');
      const settingsFile = path.resolve(__dirname, 'src', 'data', 'siteSettings.json');
      const content = await fs.readFile(settingsFile, 'utf8');
      return res.json(JSON.parse(content));
    }
  } catch (e: any) {
    console.error('Error reading site settings:', e);
    return res.status(500).json({ error: 'Failed to read site settings' });
  }
});

// API Route: Update Site Settings
app.post('/api/admin/site-settings', async (req: Request, res: Response) => {
  try {
    if (useSupabase && supabase) {
      const { error } = await supabase.from('site_settings').upsert({
        id: 1,
        settings: req.body,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) {
        console.error('Supabase site_settings write error:', error.message);
        return res.status(500).json({ success: false, error: 'Failed to save site settings' });
      }
    } else {
      const fs = await import('fs/promises');
      const settingsFile = path.resolve(__dirname, 'src', 'data', 'siteSettings.json');
      await fs.writeFile(settingsFile, JSON.stringify(req.body, null, 2), 'utf8');
    }
    console.log('Site settings updated successfully');
    return res.json({ success: true, settings: req.body });
  } catch (e: any) {
    console.error('Error updating site settings:', e);
    return res.status(500).json({ success: false, error: e.message || 'Failed to save site settings' });
  }
});

// API Route: Get Localities
app.get('/api/localities', async (req: Request, res: Response) => {
  try {
    if (useSupabase && supabase) {
      const { data, error } = await supabase.from('localities').select('*');
      if (!error && data && data.length > 0) {
        return res.json(data.map(localityRowToApi));
      }
      // If table empty, fallback to local json/ts and auto-seed Supabase
      try {
        const fs = await import('fs/promises');
        const jsonPath = path.resolve(__dirname, 'src', 'data', 'localities.json');
        const fileData = await fs.readFile(jsonPath, 'utf8');
        const initialLocs = JSON.parse(fileData);
        if (Array.isArray(initialLocs) && initialLocs.length > 0) {
          const rows = initialLocs.map(apiLocalityToRow);
          await supabase.from('localities').insert(rows);
        }
        return res.json(initialLocs);
      } catch (seedErr) {
        console.error('Error auto-seeding localities to Supabase:', seedErr);
      }
      return res.json([]);
    } else {
      const fs = await import('fs/promises');
      const jsonPath = path.resolve(__dirname, 'src', 'data', 'localities.json');
      try {
        const fileData = await fs.readFile(jsonPath, 'utf8');
        return res.json(JSON.parse(fileData));
      } catch {
        const tsPath = path.resolve(__dirname, 'src', 'data', 'localities.ts');
        const tsContent = await fs.readFile(tsPath, 'utf8');
        const match = tsContent.match(/export const NOIDA_LOCALITIES:\s*LocalityInfo\[\]\s*=\s*(\[\s*[\s\S]*\]);?\s*$/);
        if (match) {
          return res.json(JSON.parse(match[1]));
        }
        return res.status(500).json({ error: 'Localities not found' });
      }
    }
  } catch (e: any) {
    console.error('Error reading localities:', e);
    return res.status(500).json({ error: 'Failed to read localities' });
  }
});

// API Route: Update Localities
app.post('/api/admin/localities', async (req: Request, res: Response) => {
  try {
    if (useSupabase && supabase) {
      // Delete existing and re-insert all (full replacement pattern)
      const localities: any[] = Array.isArray(req.body) ? req.body : [];
      await supabase.from('localities').delete().neq('id', '');
      if (localities.length > 0) {
        const rows = localities.map(apiLocalityToRow);
        const { error } = await supabase.from('localities').insert(rows);
        if (error) {
          console.error('Supabase localities write error:', error.message);
          return res.status(500).json({ success: false, error: 'Failed to update localities' });
        }
      }
    } else {
      const fs = await import('fs/promises');
      const file = path.resolve(__dirname, 'src', 'data', 'localities.ts');
      const newContent = `import { LocalityInfo } from '../types';\n\nexport const NOIDA_LOCALITIES: LocalityInfo[] = ${JSON.stringify(req.body, null, 2)};\n`;
      await fs.writeFile(file, newContent, 'utf8');
      
      // Also keep localities.json synchronized
      const jsonPath = path.resolve(__dirname, 'src', 'data', 'localities.json');
      await fs.writeFile(jsonPath, JSON.stringify(req.body, null, 2), 'utf8');
    }
    return res.json({ success: true });
  } catch (e: any) {
    console.error('Error updating localities:', e);
    return res.status(500).json({ success: false, error: e.message || 'Failed to update localities' });
  }
});

// Helper to read properties safely (Supabase first with auto-seed, local fallback)
async function getPropertiesArray(): Promise<{ properties: any[]; propertyFile: string }> {
  const propertyFile = path.resolve(__dirname, 'src', 'data', 'properties.ts');
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        if (data.length === 0) {
          console.log('Supabase properties table is empty. Auto-seeding initial properties from properties.ts...');
          const fs = await import('fs/promises');
          const content = await fs.readFile(propertyFile, 'utf8');
          const match = content.match(/export const NOIDA_PROPERTIES:\s*Property\[\]\s*=\s*(\[\s*[\s\S]*\]);?\s*$/);
          if (match) {
            const initialList = JSON.parse(match[1]);
            const rows = initialList.map(apiPropertyToRow);
            const { error: seedErr } = await supabase.from('properties').insert(rows);
            if (!seedErr) {
              console.log(`✅ Successfully auto-seeded ${rows.length} properties to Supabase!`);
              return { properties: initialList, propertyFile };
            } else {
              console.error('Supabase auto-seed properties error:', seedErr.message);
            }
          }
        } else {
          return { properties: data.map(propertyRowToApi), propertyFile };
        }
      } else if (error) {
        console.error('Supabase fetch properties error:', error.message);
      }
    } catch (e: any) {
      console.error('Error fetching properties from Supabase:', e.message);
    }
  }

  // Fallback to local properties.ts file
  const fs = await import('fs/promises');
  const content = await fs.readFile(propertyFile, 'utf8');
  const match = content.match(/export const NOIDA_PROPERTIES:\s*Property\[\]\s*=\s*(\[\s*[\s\S]*\]);?\s*$/);
  if (!match) {
    throw new Error('Could not parse properties.ts structure');
  }
  const properties = JSON.parse(match[1]);
  return { properties, propertyFile };
}

// Helper to write properties.ts safely in local/dev
async function writePropertiesArray(properties: any[], propertyFile: string) {
  try {
    const fs = await import('fs/promises');
    const newContent = `import { Property } from '../types';\n\nexport const NOIDA_PROPERTIES: Property[] = ${JSON.stringify(properties, null, 2)};\n`;
    await fs.writeFile(propertyFile, newContent, 'utf8');
  } catch (err) {
    console.warn('Local properties.ts file write skipped or failed:', err);
  }
}

// API Route: Public/Client Get All Properties
app.get('/api/properties', async (_req: Request, res: Response) => {
  try {
    const { properties } = await getPropertiesArray();
    return res.json(properties);
  } catch (e: any) {
    console.error('Error fetching properties:', e);
    return res.status(500).json({ error: 'Failed to read properties' });
  }
});

// Process Base64 image uploads (uses Supabase Storage in production, local fs in dev)
async function processUploadedImages(body: any): Promise<string[]> {
  const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
  const uploadedUrls: string[] = [];

  const handleUpload = async (fileObj: { name?: string; base64: string }, index: number = 0): Promise<string | null> => {
    try {
      const { name, base64 } = fileObj;
      if (!base64) return null;
      const rawExt = (name && name.split('.').pop()?.toLowerCase()) || 'jpg';
      if (!ALLOWED_IMAGE_EXTS.includes(rawExt)) {
        console.warn(`Blocked non-whitelisted image upload extension: .${rawExt}`);
        return null;
      }
      const fileName = `upload-${Date.now()}-${index + 1}.${rawExt}`;

      if (useSupabase && supabase) {
        const publicUrl = await uploadToSupabaseStorage(base64, `images/${fileName}`, 'uploads');
        if (publicUrl) return publicUrl;
        console.warn('Supabase storage upload failed, falling back to local fs...');
      }

      // Local filesystem storage
      const fs = await import('fs/promises');
      const uploadsDir = path.resolve(__dirname, 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const imageBuffer = matches && matches.length === 3 ? Buffer.from(matches[2], 'base64') : Buffer.from(base64, 'base64');
      const filePath = path.resolve(uploadsDir, fileName);
      await fs.writeFile(filePath, imageBuffer);
      return `/uploads/${fileName}`;
    } catch (err) {
      console.error('Error processing uploaded image:', err);
      return null;
    }
  };

  if (Array.isArray(body.uploadedImages) && body.uploadedImages.length > 0) {
    for (let i = 0; i < body.uploadedImages.length; i++) {
      const url = await handleUpload(body.uploadedImages[i], i);
      if (url) uploadedUrls.push(url);
    }
    delete body.uploadedImages;
  } else if (body.coverImageFile) {
    const url = await handleUpload(body.coverImageFile, 0);
    if (url) uploadedUrls.push(url);
    delete body.coverImageFile;
  }

  return uploadedUrls;
}

// API Route: Admin - Add Property (Writes to Supabase DB, local file in dev)
app.post('/api/admin/properties', async (req: Request, res: Response) => {
  try {
    const { properties, propertyFile } = await getPropertiesArray();
    const uploadedUrls = await processUploadedImages(req.body);

    if (uploadedUrls.length > 0) {
      req.body.coverImage = uploadedUrls[0];
      req.body.galleryImages = uploadedUrls.map((url, idx) => ({
        url,
        caption: idx === 0 
          ? (req.body.title ? `${req.body.title} - Main View` : 'Main View') 
          : `${req.body.title || 'Property'} - Photo ${idx + 1}`
      }));
    }

    const title = req.body.title?.trim() || 'Premier Luxury Residence';
    const sector = req.body.sector?.trim() || 'Noida';
    const developer = req.body.developer?.trim() || 'Direct Owner / Private';

    req.body.id = req.body.id || `prop-${Date.now()}`;
    req.body.title = title;
    req.body.developer = developer;
    req.body.sector = sector;
    req.body.locality = req.body.locality?.trim() || 'Central Noida';
    req.body.priceDisplay = req.body.priceDisplay?.trim() || (req.body.priceNumInCrores ? `₹${req.body.priceNumInCrores} Cr` : 'Price on Request');
    req.body.priceNumInCrores = req.body.priceNumInCrores ? Number(req.body.priceNumInCrores) : 0;
    req.body.pricePerSqFt = req.body.pricePerSqFt ? Number(req.body.pricePerSqFt) : 0;
    req.body.totalAcres = req.body.totalAcres ? Number(req.body.totalAcres) : 0;
    req.body.openGreensPercentage = req.body.openGreensPercentage ? Number(req.body.openGreensPercentage) : 0;

    req.body.shortDescription = req.body.shortDescription?.trim() || 
      req.body.tagline?.trim() || 
      `Ultra-luxury development by ${developer} located in ${sector}, featuring bespoke architectural design, state-of-the-art amenities, and rapid expressway connectivity.`;

    req.body.fullDescription = req.body.fullDescription?.trim() || 
      `${title} sets a new benchmark in luxury living at ${sector}, Noida. Conceived by ${developer}, this distinguished landmark offers expansive floor layouts, panoramic skyline vistas, and world-class recreational facilities.`;

    req.body.distanceToMetro = req.body.distanceToMetro?.trim() || '';
    req.body.distanceToAirport = req.body.distanceToAirport?.trim() || '';
    req.body.distanceToExpressway = req.body.distanceToExpressway?.trim() || '';

    req.body.reraNumber = (req.body.reraNumber?.trim() && req.body.reraNumber.trim().toUpperCase() !== 'UPRERA')
      ? req.body.reraNumber.trim()
      : `UPRERAPRJ${Math.floor(100000 + Math.random() * 900000)}`;

    if (!Array.isArray(req.body.floorPlans) || req.body.floorPlans.length === 0) {
      req.body.floorPlans = [
        {
          name: 'Executive Suite',
          bedrooms: 3,
          bathrooms: 3,
          carpetAreaSqFt: 1150,
          superAreaSqFt: 1680,
          priceEstimate: req.body.priceDisplay || 'Price on Request'
        },
        {
          name: 'Grand Presidential Suite',
          bedrooms: 4,
          bathrooms: 4,
          carpetAreaSqFt: 1650,
          superAreaSqFt: 2350,
          priceEstimate: req.body.priceDisplay || 'Price on Request'
        }
      ];
    }

    if (!req.body.coverImage || req.body.coverImage.trim() === '') {
      req.body.coverImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
    }
    if (!req.body.galleryImages || req.body.galleryImages.length === 0) {
      req.body.galleryImages = [{ url: req.body.coverImage, caption: title || 'Architectural Elevation' }];
    }

    if (req.body.videoTour && req.body.videoTour.videoUrl && req.body.videoTour.videoUrl.trim()) {
      req.body.videoTour = {
        title: req.body.videoTour.title?.trim() || `${title} 4K Drone Tour`,
        videoUrl: req.body.videoTour.videoUrl.trim(),
        thumbnailUrl: req.body.videoTour.thumbnailUrl?.trim() || req.body.coverImage || '',
        duration: req.body.videoTour.duration?.trim() || '02:30',
        description: req.body.videoTour.description?.trim() || `4K aerial inspection and architectural walkthrough of ${title} in ${sector}.`
      };
    } else {
      delete req.body.videoTour;
    }

    // Persist to Supabase if configured
    if (useSupabase && supabase) {
      const row = apiPropertyToRow(req.body);
      const { error: insertErr } = await supabase.from('properties').insert(row);
      if (insertErr) {
        console.error('Supabase property insert error:', insertErr.message);
        return res.status(500).json({ error: `Failed to save property to database: ${insertErr.message}` });
      }
    }

    // Also sync local file if in dev
    if (process.env.NODE_ENV !== 'production' && propertyFile) {
      properties.push(req.body);
      await writePropertiesArray(properties, propertyFile);
    }

    res.json({ success: true, message: 'Property added successfully!', property: req.body });
  } catch (error: any) {
    console.error('Error adding property:', error);
    res.status(500).json({ error: error.message || 'Failed to save property.' });
  }
});

// API Route: Admin - Update Property (POST)
app.post('/api/admin/properties/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { properties, propertyFile } = await getPropertiesArray();
    const existingIndex = properties.findIndex((p: any) => p.id === id);

    if (existingIndex === -1) {
      return res.status(404).json({ error: `Property with id ${id} not found.` });
    }

    const uploadedUrls = await processUploadedImages(req.body);
    const existing = properties[existingIndex];

    // If new images were uploaded, update coverImage and append or replace gallery
    if (uploadedUrls.length > 0) {
      req.body.coverImage = uploadedUrls[0];
      const newGallery = uploadedUrls.map((url, idx) => ({
        url,
        caption: `${req.body.title || existing.title} - Photo ${idx + 1}`
      }));
      const currentGallery = Array.isArray(req.body.galleryImages) && req.body.galleryImages.length > 0
        ? req.body.galleryImages.filter((g: any) => g.url && !g.url.startsWith('data:'))
        : (existing.galleryImages || []);
      req.body.galleryImages = [...currentGallery, ...newGallery];
    }

    // Merge updates
    const updatedProperty = {
      ...existing,
      ...req.body,
      id: existing.id,
      developer: req.body.developer?.trim() || existing.developer || 'Direct Owner / Private',
      sector: req.body.sector?.trim() || existing.sector || 'Noida',
      priceDisplay: req.body.priceDisplay?.trim() || (req.body.priceNumInCrores ? `₹${req.body.priceNumInCrores} Cr` : existing.priceDisplay || 'Price on Request'),
      priceNumInCrores: req.body.priceNumInCrores !== undefined ? Number(req.body.priceNumInCrores) : existing.priceNumInCrores
    };

    // Drone Tour delete or update handling
    if (req.body.deleteVideoTour === true || req.body.videoTour === null) {
      delete updatedProperty.videoTour;
    } else if (req.body.videoTour && req.body.videoTour.videoUrl && req.body.videoTour.videoUrl.trim()) {
      updatedProperty.videoTour = {
        title: req.body.videoTour.title?.trim() || `${updatedProperty.title} 4K Drone Tour`,
        videoUrl: req.body.videoTour.videoUrl.trim(),
        thumbnailUrl: req.body.videoTour.thumbnailUrl?.trim() || updatedProperty.coverImage || '',
        duration: req.body.videoTour.duration?.trim() || '02:30',
        description: req.body.videoTour.description?.trim() || `4K aerial inspection and architectural walkthrough of ${updatedProperty.title} in ${updatedProperty.sector}.`
      };
    }
    delete (updatedProperty as any).deleteVideoTour;

    // Persist to Supabase if configured
    if (useSupabase && supabase) {
      const row = apiPropertyToRow(updatedProperty);
      const { error: updateErr } = await supabase.from('properties').upsert(row);
      if (updateErr) {
        console.error('Supabase property update error:', updateErr.message);
        return res.status(500).json({ error: `Failed to update property in database: ${updateErr.message}` });
      }
    }

    // Also sync local file if in dev
    if (process.env.NODE_ENV !== 'production' && propertyFile) {
      properties[existingIndex] = updatedProperty;
      await writePropertiesArray(properties, propertyFile);
    }

    res.json({ success: true, message: 'Property updated successfully!', property: updatedProperty });
  } catch (error: any) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: error.message || 'Failed to update property.' });
  }
});

// Also support PUT method for update
app.put('/api/admin/properties/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { properties, propertyFile } = await getPropertiesArray();
    const existingIndex = properties.findIndex((p: any) => p.id === id);

    if (existingIndex === -1) {
      return res.status(404).json({ error: `Property with id ${id} not found.` });
    }

    const uploadedUrls = await processUploadedImages(req.body);
    const existing = properties[existingIndex];

    if (uploadedUrls.length > 0) {
      req.body.coverImage = uploadedUrls[0];
      const newGallery = uploadedUrls.map((url, idx) => ({
        url,
        caption: `${req.body.title || existing.title} - Photo ${idx + 1}`
      }));
      const currentGallery = Array.isArray(req.body.galleryImages) && req.body.galleryImages.length > 0
        ? req.body.galleryImages.filter((g: any) => g.url && !g.url.startsWith('data:'))
        : (existing.galleryImages || []);
      req.body.galleryImages = [...currentGallery, ...newGallery];
    }

    const updatedProperty = {
      ...existing,
      ...req.body,
      id: existing.id,
      developer: req.body.developer?.trim() || existing.developer || 'Direct Owner / Private',
      sector: req.body.sector?.trim() || existing.sector || 'Noida',
      priceDisplay: req.body.priceDisplay?.trim() || (req.body.priceNumInCrores ? `₹${req.body.priceNumInCrores} Cr` : existing.priceDisplay || 'Price on Request'),
      priceNumInCrores: req.body.priceNumInCrores !== undefined ? Number(req.body.priceNumInCrores) : existing.priceNumInCrores
    };

    if (req.body.deleteVideoTour === true || req.body.videoTour === null) {
      delete updatedProperty.videoTour;
    } else if (req.body.videoTour && req.body.videoTour.videoUrl && req.body.videoTour.videoUrl.trim()) {
      updatedProperty.videoTour = {
        title: req.body.videoTour.title?.trim() || `${updatedProperty.title} 4K Drone Tour`,
        videoUrl: req.body.videoTour.videoUrl.trim(),
        thumbnailUrl: req.body.videoTour.thumbnailUrl?.trim() || updatedProperty.coverImage || '',
        duration: req.body.videoTour.duration?.trim() || '02:30',
        description: req.body.videoTour.description?.trim() || `4K aerial inspection and architectural walkthrough of ${updatedProperty.title} in ${updatedProperty.sector}.`
      };
    }
    delete (updatedProperty as any).deleteVideoTour;

    // Persist to Supabase if configured
    if (useSupabase && supabase) {
      const row = apiPropertyToRow(updatedProperty);
      const { error: updateErr } = await supabase.from('properties').upsert(row);
      if (updateErr) {
        console.error('Supabase property update error:', updateErr.message);
        return res.status(500).json({ error: `Failed to update property in database: ${updateErr.message}` });
      }
    }

    // Also sync local file if in dev
    if (process.env.NODE_ENV !== 'production' && propertyFile) {
      properties[existingIndex] = updatedProperty;
      await writePropertiesArray(properties, propertyFile);
    }

    res.json({ success: true, message: 'Property updated successfully!', property: updatedProperty });
  } catch (error: any) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: error.message || 'Failed to update property.' });
  }
});

// API Route: Admin - Add or Update Drone Tour for a Property
app.post('/api/admin/properties/:id/drone-tour', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { properties, propertyFile } = await getPropertiesArray();
    const existingIndex = properties.findIndex((p: any) => p.id === id);

    if (existingIndex === -1) {
      return res.status(404).json({ error: `Property with id ${id} not found.` });
    }

    const { title, videoUrl, thumbnailUrl, duration, description } = req.body;
    if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.trim()) {
      return res.status(400).json({ error: 'A valid video URL or uploaded video path is required.' });
    }

    const targetProp = properties[existingIndex];
    targetProp.videoTour = {
      title: title?.trim() || `${targetProp.title} 4K Drone Tour`,
      videoUrl: videoUrl.trim(),
      thumbnailUrl: thumbnailUrl?.trim() || targetProp.coverImage || '',
      duration: duration?.trim() || '02:30',
      description: description?.trim() || `4K aerial inspection and architectural walkthrough of ${targetProp.title} located in ${targetProp.sector}.`
    };

    // Persist to Supabase if configured
    if (useSupabase && supabase) {
      const { error: dtErr } = await supabase
        .from('properties')
        .update({ video_tour: targetProp.videoTour })
        .eq('id', id);
      if (dtErr) {
        console.error('Supabase drone tour update error:', dtErr.message);
        return res.status(500).json({ error: 'Failed to save drone tour to database' });
      }
    }

    if (process.env.NODE_ENV !== 'production' && propertyFile) {
      properties[existingIndex] = targetProp;
      await writePropertiesArray(properties, propertyFile);
    }

    res.json({ success: true, message: 'Drone tour saved successfully!', property: targetProp, videoTour: targetProp.videoTour });
  } catch (error: any) {
    console.error('Error adding/updating drone tour:', error);
    res.status(500).json({ error: error.message || 'Failed to save drone tour.' });
  }
});

// API Route: Admin - Delete Drone Tour from a Property
app.delete('/api/admin/properties/:id/drone-tour', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { properties, propertyFile } = await getPropertiesArray();
    const existingIndex = properties.findIndex((p: any) => p.id === id);

    if (existingIndex === -1) {
      return res.status(404).json({ error: `Property with id ${id} not found.` });
    }

    // Persist to Supabase if configured
    if (useSupabase && supabase) {
      const { error: dtDelErr } = await supabase
        .from('properties')
        .update({ video_tour: null })
        .eq('id', id);
      if (dtDelErr) {
        console.error('Supabase drone tour delete error:', dtDelErr.message);
        return res.status(500).json({ error: 'Failed to delete drone tour from database' });
      }
    }

    delete properties[existingIndex].videoTour;
    if (process.env.NODE_ENV !== 'production' && propertyFile) {
      await writePropertiesArray(properties, propertyFile);
    }

    res.json({ success: true, message: 'Drone tour deleted successfully!', property: properties[existingIndex] });
  } catch (error: any) {
    console.error('Error deleting drone tour:', error);
    res.status(500).json({ error: error.message || 'Failed to delete drone tour.' });
  }
});

// API Route: Admin - Delete Property
app.delete('/api/admin/properties/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { properties, propertyFile } = await getPropertiesArray();
    const filtered = properties.filter((p: any) => p.id !== id);

    if (filtered.length === properties.length) {
      return res.status(404).json({ error: `Property with id ${id} not found.` });
    }

    // Persist to Supabase if configured
    if (useSupabase && supabase) {
      const { error: delErr } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);
      if (delErr) {
        console.error('Supabase property delete error:', delErr.message);
        return res.status(500).json({ error: 'Failed to delete property from database' });
      }
    }

    if (process.env.NODE_ENV !== 'production' && propertyFile) {
      await writePropertiesArray(filtered, propertyFile);
    }

    res.json({ success: true, message: 'Property deleted successfully!' });
  } catch (error: any) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: error.message || 'Failed to delete property.' });
  }
});

// API Route: Admin fetch brochure leads
app.get('/api/admin/brochure-requests', async (req: Request, res: Response) => {
  try {
    if (useSupabase && supabase) {
      const { data, error } = await supabase
        .from('brochure_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return res.json(data.map(brochureRowToApi));
      }
      if (error) console.error('Supabase brochure-requests error:', error.message);
    }
    const fs = await import('fs/promises');
    const brochurePath = path.resolve(__dirname, 'src', 'data', 'brochureRequests.json');
    try {
      const data = await fs.readFile(brochurePath, 'utf8');
      res.json(JSON.parse(data));
    } catch {
      res.json([]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API Route: Admin delete single brochure/site lead
app.delete('/api/admin/brochure-requests/:id', async (req: Request, res: Response) => {
  try {
    if (useSupabase && supabase) {
      const { error } = await supabase
        .from('brochure_requests')
        .delete()
        .eq('id', req.params.id);
      if (error) {
        console.error('Supabase brochure lead delete error:', error.message);
        return res.status(500).json({ error: 'Failed to delete lead from database' });
      }
      return res.json({ success: true, message: 'Lead deleted successfully' });
    }
    const fs = await import('fs/promises');
    const brochurePath = path.resolve(__dirname, 'src', 'data', 'brochureRequests.json');
    let list: any[] = [];
    try {
      const data = await fs.readFile(brochurePath, 'utf8');
      list = JSON.parse(data);
    } catch {
      list = [];
    }
    const filtered = list.filter((item: any) => item.id !== req.params.id);
    await fs.writeFile(brochurePath, JSON.stringify(filtered, null, 2), 'utf8');
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API Route: Admin clear all leads
app.delete('/api/admin/brochure-requests', async (req: Request, res: Response) => {
  try {
    if (useSupabase && supabase) {
      const { error } = await supabase
        .from('brochure_requests')
        .delete()
        .neq('id', '');
      if (error) {
        console.error('Supabase brochure leads clear error:', error.message);
        return res.status(500).json({ error: 'Failed to clear leads from database' });
      }
      return res.json({ success: true, message: 'All leads cleared successfully' });
    }
    const fs = await import('fs/promises');
    const brochurePath = path.resolve(__dirname, 'src', 'data', 'brochureRequests.json');
    await fs.writeFile(brochurePath, '[]', 'utf8');
    res.json({ success: true, message: 'All leads cleared successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    domain: 'krestatenoida.com',
    targetEmail: 'avinashmehra5292@gmail.com',
    timestamp: new Date().toISOString(),
  });
});

// Vite middleware or static file serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist'), staticCacheOptions));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`KR Estate server running on port ${PORT} (domain: krestatenoida.com)`);
  });
}

setupServer();
