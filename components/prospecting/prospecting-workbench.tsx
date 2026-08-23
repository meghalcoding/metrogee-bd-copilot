"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2, Plus, Search, X } from "lucide-react";
import { addProspectAction, searchProspectsAction } from "@/app/actions/prospecting";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROSPECTING_PROVIDERS, type ProspectResult, type ProspectingProvider, type ProspectingSession } from "@/lib/domains/prospecting/types";

type Category = { id: string; name: string; slug: string };
type ResultState = ProspectResult & { state?: "ADDED" | "EXISTS" | "IGNORED"; businessId?: string };

const providerLabels: Record<ProspectingProvider, string> = {
  osm_overpass: "OpenStreetMap",
  geoapify: "Geoapify",
  foursquare: "Foursquare",
  mappls: "Mappls",
};

export function ProspectingWorkbench({ categories, configuredProviders }: { categories: Category[]; configuredProviders: ProspectingProvider[] }) {
  const [categoryId, setCategoryId] = useState(() => {
    if (typeof window === "undefined") return categories[0]?.id ?? "";
    try {
      const raw = window.sessionStorage.getItem("metrogee:prospecting-session");
      const session = raw ? JSON.parse(raw) as ProspectingSession : null;
      return session && categories.some((category) => category.id === session.categoryId) ? session.categoryId : categories[0]?.id ?? "";
    } catch {
      return categories[0]?.id ?? "";
    }
  });
  const [postalCode, setPostalCode] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return (JSON.parse(window.sessionStorage.getItem("metrogee:prospecting-session") ?? "null") as ProspectingSession | null)?.postalCode ?? ""; } catch { return ""; }
  });
  const [radiusKm, setRadiusKm] = useState(() => {
    if (typeof window === "undefined") return "5";
    try { return (JSON.parse(window.sessionStorage.getItem("metrogee:prospecting-session") ?? "null") as ProspectingSession | null)?.radiusKm ?? "5"; } catch { return "5"; }
  });
  const [providers, setProviders] = useState<ProspectingProvider[]>(() => {
    if (typeof window === "undefined") return configuredProviders;
    try {
      const session = JSON.parse(window.sessionStorage.getItem("metrogee:prospecting-session") ?? "null") as ProspectingSession | null;
      const saved = session?.providers?.filter((provider) => configuredProviders.includes(provider));
      return saved?.length ? saved : configuredProviders;
    } catch { return configuredProviders; }
  });
  const [results, setResults] = useState<ResultState[]>(() => {
    if (typeof window === "undefined") return [];
    try { return (JSON.parse(window.sessionStorage.getItem("metrogee:prospecting-session") ?? "null") as ProspectingSession | null)?.results ?? []; } catch { return []; }
  });
  const [locationLabel, setLocationLabel] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return (JSON.parse(window.sessionStorage.getItem("metrogee:prospecting-session") ?? "null") as ProspectingSession | null)?.locationLabel ?? ""; } catch { return ""; }
  });
  const [providerCounts, setProviderCounts] = useState<Partial<Record<ProspectingProvider, number>>>(() => {
    if (typeof window === "undefined") return {};
    try { return (JSON.parse(window.sessionStorage.getItem("metrogee:prospecting-session") ?? "null") as ProspectingSession | null)?.providerCounts ?? {}; } catch { return {}; }
  });
  const [providerErrors, setProviderErrors] = useState<Partial<Record<ProspectingProvider, string>>>(() => {
    if (typeof window === "undefined") return {};
    try { return (JSON.parse(window.sessionStorage.getItem("metrogee:prospecting-session") ?? "null") as ProspectingSession | null)?.providerErrors ?? {}; } catch { return {}; }
  });
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const session: ProspectingSession = { categoryId, postalCode, radiusKm, providers, results, locationLabel, providerCounts, providerErrors };
    window.sessionStorage.setItem("metrogee:prospecting-session", JSON.stringify(session));
  }, [categoryId, postalCode, radiusKm, providers, results, locationLabel, providerCounts, providerErrors]);

  function clearSession() {
    setResults([]);
    setLocationLabel("");
    setProviderCounts({});
    setProviderErrors({});
    setError("");
    if (typeof window !== "undefined") window.sessionStorage.removeItem("metrogee:prospecting-session");
  }
  const selectedCategory = categories.find((category) => category.id === categoryId);

  function toggleProvider(provider: ProspectingProvider) {
    setProviders((current) => current.includes(provider) ? current.filter((item) => item !== provider) : [...current, provider]);
  }

  async function search() {
    if (!selectedCategory) return;
    setLoading(true);
    setError("");
    setResults([]);
    setProviderCounts({});
    setProviderErrors({});
    try {
      const response = await searchProspectsAction({
        categoryId,
        categorySlug: selectedCategory.slug,
        postalCode,
        radiusKm: Number(radiusKm),
        providers,
      });
      setResults(response.results);
      setLocationLabel([response.location.city, response.location.state].filter(Boolean).join(", "));
      setProviderCounts(response.providerCounts);
      setProviderErrors(response.providerErrors);
      const errors = Object.entries(response.providerErrors);
      if (errors.length) {
        setError(errors.map(([provider, message]) => `${providerLabels[provider as ProspectingProvider]}: ${message}`).join(" | "));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not search for businesses.");
    } finally {
      setLoading(false);
    }
  }

  async function add(result: ResultState) {
    setAdding(`${result.provider}:${result.providerPlaceId}`);
    setError("");
    try {
      const response = await addProspectAction(categoryId, result);
      setResults((current) => current.map((item) => item.providerPlaceId === result.providerPlaceId && item.provider === result.provider
        ? { ...item, state: response.status === "CREATED" ? "ADDED" : "EXISTS", businessId: response.businessId }
        : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add this business.");
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <p className="text-sm font-medium text-primary">India Prospecting</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Find new businesses</h1>
        <p className="mt-2 max-w-3xl text-sm text-text-secondary">Search multiple business-data providers around an Indian PIN code, review the candidates, and add only the businesses you want in the CRM.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_180px_160px_auto] sm:items-end">
          <label className="space-y-2">
            <span className="block text-xs font-medium text-text-secondary">Business category</span>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="block text-xs font-medium text-text-secondary">PIN code</span>
            <input value={postalCode} onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(event) => { if (event.key === "Enter") void search(); }} inputMode="numeric" maxLength={6} placeholder="390001" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
          </label>
          <label className="space-y-2">
            <span className="block text-xs font-medium text-text-secondary">Radius</span>
            <select value={radiusKm} onChange={(event) => setRadiusKm(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
              <option value="2">2 km</option><option value="5">5 km</option><option value="10">10 km</option><option value="25">25 km</option>
            </select>
          </label>
          <Button type="button" onClick={() => void search()} disabled={loading || !categoryId || postalCode.length !== 6 || !providers.length}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Search
          </Button>
        </div>

        <div className="mt-5">
          <div className="text-xs font-medium text-text-secondary">Data providers</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {PROSPECTING_PROVIDERS.map((provider) => {
              const configured = configuredProviders.includes(provider);
              const selected = providers.includes(provider);
              return (
                <button key={provider} type="button" disabled={!configured} onClick={() => toggleProvider(provider)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${selected ? "border-primary bg-primary-soft text-primary" : "border-border text-text-secondary"} ${!configured ? "cursor-not-allowed opacity-40" : ""}`}>
                  {providerLabels[provider]}{!configured ? " · not configured" : ""}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-xs text-text-muted">OpenStreetMap is available without an API key. Optional providers use their own free/limited API plans. Results are reviewed before anything is written to your CRM. OpenStreetMap/Nominatim requests are user-triggered and kept within their published usage requirements.</p>
      </section>

      {error ? <div className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div> : null}

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm font-semibold">Search results</h2><p className="mt-1 text-xs text-text-muted">{results.length ? `${results.length} candidates${locationLabel ? ` around ${locationLabel}` : ""}` : "Nothing searched yet."}</p></div>
          {results.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {PROSPECTING_PROVIDERS.filter((provider) => providers.includes(provider)).map((provider) => (
                <Badge key={provider} variant={providerErrors[provider] ? "warning" : "neutral"}>
                  {providerLabels[provider]} {providerErrors[provider] ? "· Failed" : `· ${providerCounts[provider] ?? 0} found`}
                </Badge>
              ))}
              <Button type="button" size="sm" variant="secondary" onClick={clearSession}>Clear current search</Button>
            </div>
          ) : null}
        </div>

        {results.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-text-secondary">Choose a category, enter an Indian PIN code, select providers, and search.</div>
        ) : (
          <div className="divide-y divide-border">
            {results.map((result) => (
              <div key={`${result.provider}:${result.providerPlaceId}`} className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{result.name}</h3>
                    <Badge variant="neutral">{providerLabels[result.provider]}</Badge>
                    {result.rating != null && <Badge variant="neutral">Score {result.rating}</Badge>}
                    {result.state === "ADDED" && <Badge variant="success"><Check className="mr-1 size-3" />Added</Badge>}
                    {result.state === "EXISTS" && <Badge variant="warning">Already in CRM</Badge>}
                    {result.state === "IGNORED" && <Badge variant="neutral">Ignored</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{result.formattedAddress ?? "Address unavailable"}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-muted">
                    {result.phone ? <span>{result.phone}</span> : null}
                    {result.websiteUrl ? <span>{result.websiteUrl}</span> : null}
                    {result.types.length ? <span>{result.types.slice(0, 3).join(", ")}</span> : null}
                    {result.mapsUrl ? <a href={result.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">Open in Google Maps <ExternalLink className="size-3" /></a> : null}
                    {result.providerUrl ? <a href={result.providerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">Source <ExternalLink className="size-3" /></a> : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {result.state === "ADDED" || result.state === "EXISTS" ? (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button asChild variant="secondary" size="sm"><Link href={`/businesses/${result.businessId}`}>Open business</Link></Button>
                      <Button asChild variant="secondary" size="sm"><Link href={`/businesses/${result.businessId}?action=contact`}>Add contact</Link></Button>
                      <Button asChild size="sm"><Link href={`/leads/new?business=${result.businessId}`}>Create lead</Link></Button>
                    </div>
                  ) : result.state === "IGNORED" ? (
                    <Button type="button" size="sm" variant="secondary" onClick={() => setResults((current) => current.map((item) => item.providerPlaceId === result.providerPlaceId && item.provider === result.provider ? { ...item, state: undefined } : item))}>Undo</Button>
                  ) : (
                    <>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setResults((current) => current.map((item) => item.providerPlaceId === result.providerPlaceId && item.provider === result.provider ? { ...item, state: "IGNORED" } : item))}><X className="size-4" />Ignore</Button>
                      <Button type="button" size="sm" onClick={() => void add(result)} disabled={adding === `${result.provider}:${result.providerPlaceId}`}><Plus className="size-4" />{adding === `${result.provider}:${result.providerPlaceId}` ? "Adding..." : "Add"}</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-text-muted">Map and place references are provided as source links. Google Maps content is not copied into the CRM.</p>
    </div>
  );
}
