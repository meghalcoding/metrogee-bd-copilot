import "server-only";
import type { ProspectResult } from "../types";
import { providerCategory } from "../categories";

type OSMElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

function escapeRegex(value: string) {
  return value.replace(/[^a-zA-Z0-9_|-]/g, "");
}

function queryForCategory(slug: string, lat: number, lon: number, radiusMeters: number, categoryName: string) {
  const filters = providerCategory(slug, "overpass", categoryName) as string[];
  const statements = filters.map((filter) => {
    if (filter === "name") return `nwr(around:${radiusMeters},${lat},${lon})[name];`;
    const [key, values] = filter.split("~");
    if (!values) return `nwr(around:${radiusMeters},${lat},${lon})[${key}];`;
    return `nwr(around:${radiusMeters},${lat},${lon})[${key}~"${escapeRegex(values)}",i];`;
  });
  return `[out:json][timeout:25];(${statements.join("")});out center tags;`;
}

function addressFromTags(tags: Record<string, string>) {
  return [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:postcode"],
  ].filter(Boolean).join(", ") || null;
}

function googleMapsUrl(name: string, address: string | null) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, address].filter(Boolean).join(", "))}`;
}

export async function searchOverpass(slug: string, categoryName: string, lat: number, lon: number, radiusKm: number): Promise<ProspectResult[]> {
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "MetroGee-BD-Copilot/0.1 (educational CRM prospecting demo)",
    },
    body: new URLSearchParams({ data: queryForCategory(slug, lat, lon, radiusKm * 1000, categoryName) }),
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`OpenStreetMap Overpass returned ${response.status}.`);
  const payload = (await response.json()) as { elements?: OSMElement[] };

  return (payload.elements ?? [])
    .filter((element) => element.tags?.name)
    .map((element): ProspectResult => {
      const tags = element.tags ?? {};
      const latitude = element.lat ?? element.center?.lat ?? null;
      const longitude = element.lon ?? element.center?.lon ?? null;
      const address = addressFromTags(tags);
      return {
        provider: "osm_overpass",
        providerPlaceId: `${element.type}/${element.id}`,
        name: tags.name!,
        formattedAddress: address,
        latitude,
        longitude,
        mapsUrl: googleMapsUrl(tags.name!, address),
        providerUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        phone: tags.phone ?? tags["contact:phone"] ?? null,
        email: tags.email ?? tags["contact:email"] ?? null,
        websiteUrl: tags.website ?? tags["contact:website"] ?? null,
        rating: null,
        reviewCount: null,
        types: [tags.amenity, tags.shop, tags.office, tags.leisure, tags.tourism, tags.craft, tags.sport].filter(Boolean) as string[],
        businessStatus: tags.disused === "yes" ? "CLOSED" : null,
        distanceKm: null,
        raw: tags,
      };
    });
}
