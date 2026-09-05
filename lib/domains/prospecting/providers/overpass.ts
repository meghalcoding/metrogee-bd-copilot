import "server-only";
import type { ProspectResult } from "../types";
import { overpassFilters } from "../categories";

type OSMElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

function buildOverpassQuery(
  slug: string,
  customQuery: string,
  lat: number,
  lon: number,
  radiusMeters: number,
): string {
  const filters = overpassFilters(slug, customQuery);
  const statements = filters.map((filter) => {
    if (filter === "name") return `nwr(around:${radiusMeters},${lat},${lon})[name];`;
    if (filter.startsWith("name~")) {
      return `nwr(around:${radiusMeters},${lat},${lon})[${filter}];`;
    }
    const [key, values] = filter.split("~");
    if (!values) return `nwr(around:${radiusMeters},${lat},${lon})[${key}];`;
    const safeValues = values.replace(/[^a-zA-Z0-9_|]/g, "");
    return `nwr(around:${radiusMeters},${lat},${lon})[${key}~"${safeValues}",i];`;
  });
  return `[out:json][timeout:30];(${statements.join("")});out center tags;`;
}

function addressFromTags(tags: Record<string, string>): string | null {
  return (
    [
      tags["addr:housenumber"],
      tags["addr:street"],
      tags["addr:suburb"],
      tags["addr:quarter"],
      tags["addr:city"],
      tags["addr:state"],
      tags["addr:postcode"],
      tags["addr:country"],
    ]
      .filter(Boolean)
      .join(", ") || null
  );
}

function extractCity(tags: Record<string, string>): string | null {
  return tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"] ?? null;
}

function extractState(tags: Record<string, string>): string | null {
  return tags["addr:state"] ?? null;
}

function extractCountry(tags: Record<string, string>): string | null {
  return tags["addr:country"] ?? null;
}

function extractOpeningHours(tags: Record<string, string>): string[] | null {
  const hours = tags["opening_hours"];
  if (!hours) return null;
  return [hours];
}

function extractSocialLinks(tags: Record<string, string>): Record<string, string> {
  const social: Record<string, string> = {};
  if (tags["contact:facebook"]) social.facebook = tags["contact:facebook"];
  if (tags["contact:instagram"]) social.instagram = tags["contact:instagram"];
  if (tags["contact:twitter"]) social.twitter = tags["contact:twitter"];
  if (tags["contact:whatsapp"]) social.whatsapp = tags["contact:whatsapp"];
  if (tags["contact:linkedin"]) social.linkedin = tags["contact:linkedin"];
  if (tags["contact:youtube"]) social.youtube = tags["contact:youtube"];
  return social;
}

function googleMapsUrl(name: string, address: string | null): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, address].filter(Boolean).join(", "))}`;
}

export async function searchOverpass(
  slug: string,
  categoryName: string,
  lat: number,
  lon: number,
  radiusKm: number,
  customQuery = "",
): Promise<ProspectResult[]> {
  const query = buildOverpassQuery(slug, customQuery || categoryName, lat, lon, radiusKm * 1000);

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "MetroGee-BD-Copilot/1.0 (CRM prospecting tool)",
    },
    body: new URLSearchParams({ data: query }),
    cache: "no-store",
    signal: AbortSignal.timeout(35000),
  });

  if (!response.ok) throw new Error(`OpenStreetMap Overpass returned ${response.status}.`);
  const payload = (await response.json()) as { elements?: OSMElement[] };

  return (payload.elements ?? [])
    .filter((el) => el.tags?.name)
    .map((el): ProspectResult => {
      const tags = el.tags ?? {};
      const latitude = el.lat ?? el.center?.lat ?? null;
      const longitude = el.lon ?? el.center?.lon ?? null;
      const address = addressFromTags(tags);
      const name = tags.name!;
      return {
        provider: "osm_overpass",
        providerPlaceId: `${el.type}/${el.id}`,
        name,
        formattedAddress: address,
        city: extractCity(tags),
        regionState: extractState(tags),
        country: extractCountry(tags),
        latitude,
        longitude,
        mapsUrl: googleMapsUrl(name, address),
        providerUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        phone: tags.phone ?? tags["contact:phone"] ?? null,
        email: tags.email ?? tags["contact:email"] ?? null,
        websiteUrl: tags.website ?? tags["contact:website"] ?? tags["url"] ?? null,
        rating: null,
        reviewCount: null,
        types: [tags.amenity, tags.shop, tags.office, tags.leisure, tags.tourism, tags.craft, tags.sport, tags.industrial, tags.man_made].filter(Boolean) as string[],
        businessStatus: tags.disused === "yes" || tags["disused:amenity"] ? "CLOSED" : null,
        distanceKm: null,
        openingHours: extractOpeningHours(tags),
        socialLinks: extractSocialLinks(tags),
        raw: tags,
      };
    });
}
