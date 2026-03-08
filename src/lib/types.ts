// Types matching evolve-wireless-figma-supabase-v3.html schema

export interface InternetPlan {
  id: string;
  name: string;
  slug: string;
  tier: "residential" | "business";
  speed_down_mbps: number;
  speed_up_mbps: number;
  data_cap_gb: number | null;
  price_gyd: number;
  price_usd: number | null;
  setup_fee_gyd: number;
  is_featured: boolean;
  badge_text: string | null;
  max_devices: number | null;
  contract_months: number;
  sort_order: number;
  is_active: boolean;
  plan_features?: PlanFeature[];
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  label: string;
  icon: string | null;
  quality: "excellent" | "good" | "limited" | null;
  sort_order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string | null;
  quote: string;
  plan_name: string | null;
  rating: number | null;
  avatar_url: string | null;
  is_featured: boolean;
  sort_order: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "billing" | "technical" | "coverage" | "setup" | "general" | null;
  sort_order: number;
  is_active: boolean;
}

export interface HeroContent {
  id: string;
  headline: string;
  headline_short: string | null;
  subheadline: string | null;
  cta_text: string;
  speed_callout: string | null;
  is_active: boolean;
}

export interface CoverageZone {
  id: string;
  name: string;
  region_number: number;
  region_name: string | null;
  status: "active" | "planned" | "limited";
  technology: string | null;
  max_speed_mbps: number | null;
  center_lat: number | null;
  center_lng: number | null;
  is_active: boolean;
}

export interface CoverageCheckResult {
  zone_id: string;
  zone_name: string;
  zone_status: string;
  technology: string;
  max_speed: number;
}

export interface Lead {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  region?: number | null;
  lat?: number | null;
  lng?: number | null;
  plan_interest?: string | null;
  source?: string;
  utm_source?: string | null;
  in_coverage?: boolean | null;
}

export interface SearchResult {
  id: string;
  type: "plan" | "faq" | "zone";
  title: string;
  subtitle: string;
  url: string;
  rank: number;
}

export interface ServiceOutage {
  id: string;
  title: string;
  description: string | null;
  severity: "info" | "warning" | "critical";
  affected_zones: string[] | null;
  start_time: string;
  end_time: string | null;
  is_resolved: boolean;
}
