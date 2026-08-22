export const CATEGORY_PROVIDER_MAP: Record<string, {
  overpass: string[];
  geoapify: string[];
  mappls: string;
  query: string;
}> = {
  "restaurant-cafe": {
    overpass: ["amenity~restaurant|cafe|fast_food"],
    geoapify: ["catering.restaurant", "catering.cafe", "catering.fast_food"],
    mappls: "restaurant cafe",
    query: "restaurant cafe",
  },
  "retail-store": {
    overpass: ["shop"],
    geoapify: ["commercial", "service.shop"],
    mappls: "retail store shop",
    query: "retail store",
  },
  "salon-beauty": {
    overpass: ["shop~hairdresser|beauty"],
    geoapify: ["service.beauty"],
    mappls: "salon beauty parlour spa",
    query: "salon beauty",
  },
  "healthcare-wellness": {
    overpass: ["amenity~clinic|hospital|doctors|dentist|pharmacy"],
    geoapify: ["healthcare"],
    mappls: "clinic hospital doctor dentist pharmacy",
    query: "healthcare wellness",
  },
  "professional-services": {
    overpass: ["office"],
    geoapify: ["office"],
    mappls: "professional services office",
    query: "professional services",
  },
  "home-local-services": {
    overpass: ["craft", "service"],
    geoapify: ["service"],
    mappls: "home services local services",
    query: "home local services",
  },
  automotive: {
    overpass: ["shop~car|car_repair|motorcycle"],
    geoapify: ["commercial.vehicle", "service.vehicle"],
    mappls: "car repair automobile service",
    query: "automotive car repair",
  },
  "education-coaching": {
    overpass: ["amenity~school|college|university|kindergarten", "office~educational_institution"],
    geoapify: ["education"],
    mappls: "school college coaching classes education",
    query: "education coaching",
  },
  "hospitality-travel": {
    overpass: ["tourism~hotel|hostel|guest_house|motel"],
    geoapify: ["accommodation"],
    mappls: "hotel hostel travel",
    query: "hotel hospitality travel",
  },
  "fitness-sports": {
    overpass: ["leisure~fitness_centre|sports_centre|pitch", "sport"],
    geoapify: ["sport", "leisure.sports_centre", "leisure.fitness_centre"],
    mappls: "gym fitness sports",
    query: "gym fitness sports",
  },
  "real-estate": {
    overpass: ["office~estate_agent"],
    geoapify: ["office.real_estate"],
    mappls: "real estate property dealer",
    query: "real estate",
  },
  "other-local-business": {
    overpass: ["name"],
    geoapify: ["commercial"],
    mappls: "local business",
    query: "local business",
  },
};

export function providerCategory(slug: string, provider: "overpass" | "geoapify" | "mappls", fallback: string) {
  const mapping = CATEGORY_PROVIDER_MAP[slug];
  if (!mapping) return provider === "overpass" ? [fallback] : fallback;
  if (provider === "overpass") return mapping.overpass;
  if (provider === "geoapify") return mapping.geoapify.join(",");
  return mapping.mappls;
}

export function categoryQuery(slug: string, name: string) {
  return CATEGORY_PROVIDER_MAP[slug]?.query ?? name;
}
