/**
 * KR Estate Noida — Seed Supabase with existing local data
 * 
 * Usage:
 *   1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env
 *   2. Run: npx tsx seed-supabase.ts
 * 
 * This reads your existing properties.ts, siteSettings.json, localities.json,
 * and brochureRequests.json, then upserts everything into Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper: Convert camelCase property object to snake_case DB row
function propertyToRow(p: any) {
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

async function seedProperties() {
  console.log('📦 Seeding properties...');
  const filePath = path.resolve(__dirname, 'src', 'data', 'properties.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/export const NOIDA_PROPERTIES:\s*Property\[\]\s*=\s*(\[\s*[\s\S]*\]);?\s*$/);
  if (!match) {
    console.error('❌ Could not parse properties.ts');
    return;
  }
  const properties = JSON.parse(match[1]);
  const rows = properties.map(propertyToRow);

  const { error } = await supabase.from('properties').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('❌ Properties seed error:', error.message);
  } else {
    console.log(`✅ Seeded ${rows.length} properties`);
  }
}

async function seedSiteSettings() {
  console.log('📦 Seeding site settings...');
  const filePath = path.resolve(__dirname, 'src', 'data', 'siteSettings.json');
  const settings = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const { error } = await supabase.from('site_settings').upsert({
    id: 1,
    settings,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) {
    console.error('❌ Site settings seed error:', error.message);
  } else {
    console.log('✅ Seeded site settings');
  }
}

async function seedLocalities() {
  console.log('📦 Seeding localities...');
  const filePath = path.resolve(__dirname, 'src', 'data', 'localities.json');
  const localities = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const rows = localities.map((loc: any) => ({
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
  }));

  const { error } = await supabase.from('localities').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('❌ Localities seed error:', error.message);
  } else {
    console.log(`✅ Seeded ${rows.length} localities`);
  }
}

async function seedBrochureRequests() {
  console.log('📦 Seeding brochure requests...');
  const filePath = path.resolve(__dirname, 'src', 'data', 'brochureRequests.json');
  const requests = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!Array.isArray(requests) || requests.length === 0) {
    console.log('ℹ️  No brochure requests to seed (empty)');
    return;
  }

  const rows = requests.map((req: any) => ({
    id: req.id,
    full_name: req.fullName || req.full_name || req.name || null,
    phone: req.phone || req.phoneNumber || null,
    email: req.email || null,
    interested_project: req.interestedProject || req.interested_project || req.propertyTitle || null,
    property_type: req.propertyType || req.property_type || null,
    budget_range: req.budgetRange || req.budget_range || null,
    message: req.message || null,
    comment: req.comment || null,
    lead_type: req.leadType || req.lead_type || null,
    lead_status: req.status || req.lead_status || null,
    property_id: req.propertyId || req.property_id || null,
    property_title: req.propertyTitle || req.property_title || null,
    sector: req.sector || null,
    developer: req.developer || null,
    price_display: req.priceDisplay || req.price_display || null,
    source: req.source || null,
    created_at: req.createdAt || req.created_at || new Date().toISOString(),
  }));

  const { error } = await supabase.from('brochure_requests').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('❌ Brochure requests seed error:', error.message);
  } else {
    console.log(`✅ Seeded ${rows.length} brochure requests`);
  }
}

async function main() {
  console.log('\n🚀 KR Estate Noida — Supabase Data Seeding\n');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('---');

  await seedProperties();
  await seedSiteSettings();
  await seedLocalities();
  await seedBrochureRequests();

  console.log('\n🎉 Seeding complete! Your Supabase database is ready.\n');
}

main().catch(console.error);
