/**
 * Maps category slugs to provider-specific query formats.
 * The "custom" slug signals free-text mode — all providers use the
 * caller-supplied query string directly.
 */

export const CATEGORY_PROVIDER_MAP: Record<string, {
  overpass: string[];
  geoapify: string[];
  mappls: string;
  query: string;
}> = {
  "restaurant-cafe": {
    overpass: ["amenity~restaurant|cafe|fast_food|food_court|bar|pub"],
    geoapify: ["catering.restaurant", "catering.cafe", "catering.fast_food", "catering.bar"],
    mappls: "restaurant cafe food court",
    query: "restaurant cafe",
  },
  "retail-store": {
    overpass: ["shop"],
    geoapify: ["commercial", "commercial.shopping_mall", "commercial.supermarket"],
    mappls: "retail store shop mall supermarket",
    query: "retail store",
  },
  "salon-beauty": {
    overpass: ["shop~hairdresser|beauty|cosmetics|massage|tattoo"],
    geoapify: ["service.beauty", "service.beauty.hairdresser", "service.beauty.spa"],
    mappls: "salon beauty parlour spa massage",
    query: "salon beauty spa",
  },
  "healthcare-wellness": {
    overpass: ["amenity~clinic|hospital|doctors|dentist|pharmacy|optician|veterinary"],
    geoapify: ["healthcare", "healthcare.hospital", "healthcare.pharmacy", "healthcare.clinic_or_praxis"],
    mappls: "clinic hospital doctor dentist pharmacy medical",
    query: "healthcare clinic hospital",
  },
  "professional-services": {
    overpass: ["office"],
    geoapify: ["office", "office.lawyer", "office.accountant", "office.tax_advisor", "office.financial"],
    mappls: "professional services office consultancy",
    query: "professional services",
  },
  "home-local-services": {
    overpass: ["craft", "shop~electrical|plumber|painter|carpenter"],
    geoapify: ["service", "service.cleaning", "service.laundry"],
    mappls: "home services electrician plumber carpenter",
    query: "home services repair",
  },
  automotive: {
    overpass: ["shop~car|car_repair|motorcycle|tyres|fuel", "amenity~fuel|car_wash"],
    geoapify: ["commercial.vehicle", "service.vehicle", "service.vehicle.car_repair"],
    mappls: "car repair automobile service petrol pump",
    query: "automotive car repair garage",
  },
  "education-coaching": {
    overpass: ["amenity~school|college|university|kindergarten|language_school|music_school|driving_school", "office~educational_institution"],
    geoapify: ["education", "education.school", "education.university", "education.college"],
    mappls: "school college coaching classes education institute",
    query: "education school coaching institute",
  },
  "hospitality-travel": {
    overpass: ["tourism~hotel|hostel|guest_house|motel|apartment", "amenity~hotel"],
    geoapify: ["accommodation", "accommodation.hotel", "accommodation.hostel", "accommodation.guest_house"],
    mappls: "hotel hostel resort guest house lodge",
    query: "hotel hospitality accommodation",
  },
  "fitness-sports": {
    overpass: ["leisure~fitness_centre|sports_centre|swimming_pool|stadium|pitch", "sport"],
    geoapify: ["sport", "sport.fitness", "leisure.sports_centre", "leisure.fitness_centre", "leisure.swimming_pool"],
    mappls: "gym fitness sports centre swimming pool yoga",
    query: "gym fitness sports centre",
  },
  "real-estate": {
    overpass: ["office~estate_agent|property_management"],
    geoapify: ["office.real_estate", "commercial.real_estate"],
    mappls: "real estate property dealer broker",
    query: "real estate property agent",
  },
  manufacturing: {
    overpass: ["industrial~factory|warehouse|manufacturing", "man_made~works"],
    geoapify: ["commercial.industrial", "commercial.warehouse"],
    mappls: "factory manufacturing industry warehouse",
    query: "factory manufacturing industry",
  },
  logistics: {
    overpass: ["amenity~courier|post_office", "office~logistics|courier", "shop~courier"],
    geoapify: ["service.delivery", "office.courier"],
    mappls: "courier logistics transport freight delivery",
    query: "courier logistics transport",
  },
  it: {
    overpass: ["office~it|software|telecommunication", "shop~computer|electronics|mobile_phone"],
    geoapify: ["office", "commercial.electronics", "commercial.computer"],
    mappls: "IT company software technology computer",
    query: "IT company software technology",
  },
  "finance-banking": {
    overpass: ["amenity~bank|atm|money_transfer", "office~financial|insurance|accountant"],
    geoapify: ["service.financial", "service.financial.bank", "service.financial.atm", "office.financial"],
    mappls: "bank finance insurance investment",
    query: "bank finance insurance",
  },
  "other-local-business": {
    overpass: ["name"],
    geoapify: ["commercial"],
    mappls: "local business",
    query: "local business",
  },
};

export const CUSTOM_CATEGORY = {
  id: "custom",
  name: "Custom search",
  slug: "custom",
  is_system: false,
  is_active: true,
} as const;

/** Returns Overpass filter tags for a slug (or free-text fallback) */
export function overpassFilters(slug: string, customQuery: string): string[] {
  if (slug === "custom" || !CATEGORY_PROVIDER_MAP[slug]) {
    // For free-text: search by name containing the query
    return [`name~"${customQuery.replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 60)}",i`];
  }
  return CATEGORY_PROVIDER_MAP[slug].overpass;
}

/** Returns Geoapify category codes for a slug */
export function geoapifyCategories(slug: string): string | null {
  if (slug === "custom" || !CATEGORY_PROVIDER_MAP[slug]) return null;
  return CATEGORY_PROVIDER_MAP[slug].geoapify.join(",");
}

/** Returns Mappls keyword string for a slug */
export function mapplsKeywords(slug: string, categoryName: string): string {
  if (slug === "custom" || !CATEGORY_PROVIDER_MAP[slug]) return categoryName;
  return CATEGORY_PROVIDER_MAP[slug].mappls;
}

/** Returns the best free-text query for a slug */
export function categoryQuery(slug: string, customQuery: string, name: string): string {
  if (slug === "custom") return customQuery || name;
  return CATEGORY_PROVIDER_MAP[slug]?.query ?? name;
}

/** Legacy compat shim */
export function providerCategory(
  slug: string,
  provider: "overpass" | "geoapify" | "mappls",
  fallback: string,
) {
  if (provider === "overpass") return overpassFilters(slug, fallback);
  if (provider === "geoapify") return geoapifyCategories(slug) ?? fallback;
  return mapplsKeywords(slug, fallback);
}
