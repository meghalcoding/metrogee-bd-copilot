import "server-only";

export type IndiaLocation = {
  postalCode: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
};

type IndiaPostResponse = Array<{
  Status?: string;
  Message?: string;
  PostOffice?: Array<{
    District?: string;
    State?: string;
    Name?: string;
  }> | null;
}>;

function timeoutSignal() {
  return AbortSignal.timeout(10000);
}

async function indiaPost(pin: string) {
  const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
    signal: timeoutSignal(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("India Post PIN lookup failed.");
  const payload = (await response.json()) as IndiaPostResponse;
  const first = payload[0];
  const office = first?.PostOffice?.[0];
  if (!office) throw new Error("That PIN code was not found in the India Post directory.");
  return {
    city: office.District ?? null,
    state: office.State ?? null,
  };
}

async function geocodeWithGeoapify(pin: string) {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) return null;
  const url = new URL("https://api.geoapify.com/v1/geocode/search");
  url.searchParams.set("text", `${pin}, India`);
  url.searchParams.set("filter", "countrycode:in");
  url.searchParams.set("limit", "1");
  url.searchParams.set("apiKey", key);
  const response = await fetch(url, { signal: timeoutSignal(), cache: "no-store" });
  if (!response.ok) return null;
  const payload = (await response.json()) as { features?: Array<{ properties?: { lat?: number; lon?: number } }> };
  const properties = payload.features?.[0]?.properties;
  if (typeof properties?.lat !== "number" || typeof properties.lon !== "number") return null;
  return { latitude: properties.lat, longitude: properties.lon };
}

async function geocodeWithNominatim(pin: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${pin}, India`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "in");

  const response = await fetch(url, {
    signal: timeoutSignal(),
    cache: "no-store",
    headers: {
      "User-Agent": "MetroGee-BD-Copilot/0.1 (educational CRM prospecting demo)",
    },
  });
  if (!response.ok) throw new Error("OpenStreetMap PIN geocoding failed.");
  const payload = (await response.json()) as Array<{ lat?: string; lon?: string }>;
  const first = payload[0];
  const latitude = Number(first?.lat);
  const longitude = Number(first?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Could not locate that PIN code on the map.");
  }
  return { latitude, longitude };
}

export async function resolveIndianPin(pin: string): Promise<IndiaLocation> {
  const normalized = pin.trim();
  if (!/^\d{6}$/.test(normalized)) {
    throw new Error("Enter a valid 6-digit Indian PIN code, such as 390001.");
  }

  const postal = await indiaPost(normalized);
  const coordinates = (await geocodeWithGeoapify(normalized)) ?? (await geocodeWithNominatim(normalized));

  return {
    postalCode: normalized,
    city: postal.city,
    state: postal.state,
    ...coordinates,
  };
}
