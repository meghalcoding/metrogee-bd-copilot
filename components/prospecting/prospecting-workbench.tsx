"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookmarkPlus, Check, ChevronDown, ChevronUp, ExternalLink,
  Loader2, Phone, Globe, Mail, MapPin, MessageCircle,
  Plus, Search, Star, Trash2, X, Zap,
} from "lucide-react";
import {
  addProspectAction,
  bulkAddProspectsAction,
  searchProspectsAction,
} from "@/app/actions/prospecting";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PROSPECTING_PROVIDERS,
  type ProspectResult,
  type ProspectingProvider,
  type ProspectingSession,
  type ProspectSearchResult,
  type SavedTerritory,
} from "@/lib/domains/prospecting/types";
import { scoreProspect, scoreLabel, type ScoredResult } from "@/lib/domains/prospecting/scoring";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: string; name: string; slug: string };
type ResultState = ScoredResult & {
  state?: "ADDED" | "EXISTS" | "IGNORED";
  businessId?: string;
  selected?: boolean;
};

const providerLabels: Record<ProspectingProvider, string> = {
  osm_overpass: "OpenStreetMap",
  geoapify: "Geoapify",
  foursquare: "Foursquare",
  mappls: "Mappls",
};

const TERRITORIES_KEY = "metrogee:territories";
const SESSION_KEY = "metrogee:prospecting-session";

// ─── Session helpers ──────────────────────────────────────────────────────────

function readSession(): Partial<ProspectingSession> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? "null") ?? {};
  } catch { return {}; }
}

function readTerritories(): SavedTerritory[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(TERRITORIES_KEY) ?? "null") ?? [];
  } catch { return []; }
}

function writeTerritories(ts: SavedTerritory[]) {
  window.localStorage.setItem(TERRITORIES_KEY, JSON.stringify(ts));
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const { variant } = scoreLabel(score);
  const colorMap: Record<string, string> = {
    success: "bg-success",
    info: "bg-info",
    warning: "bg-warning",
    neutral: "bg-border-strong",
  };
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${colorMap[variant]}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs tabular-nums text-text-muted">{score}</span>
    </div>
  );
}

// ─── Result card ─────────────────────────────────────────────────────────────

function ResultCard({
  result,
  onAdd,
  onIgnore,
  onUndoIgnore,
  onToggleSelect,
  adding,
  bulkMode,
}: {
  result: ResultState;
  onAdd: () => void;
  onIgnore: () => void;
  onUndoIgnore: () => void;
  onToggleSelect: () => void;
  adding: boolean;
  bulkMode: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { label, variant } = scoreLabel(result.score);
  const waPhone = result.phone?.replace(/\D/g, "");

  return (
    <div
      className={`flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start lg:justify-between transition-colors ${
        result.selected ? "bg-primary-soft/30" : ""
      } ${result.state === "IGNORED" ? "opacity-50" : ""}`}
    >
      {/* Select checkbox in bulk mode */}
      {bulkMode && result.state !== "ADDED" && result.state !== "EXISTS" && (
        <button
          type="button"
          onClick={onToggleSelect}
          className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
            result.selected
              ? "border-primary bg-primary text-white"
              : "border-border-strong bg-background"
          }`}
          aria-label={result.selected ? "Deselect" : "Select"}
        >
          {result.selected && <Check className="size-3" />}
        </button>
      )}

      <div className="min-w-0 flex-1">
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{result.name}</h3>
          <Badge variant="neutral">{providerLabels[result.provider]}</Badge>
          <Badge variant={variant}>{label} · {result.score}</Badge>
          {result.rating != null && (
            <Badge variant="neutral">
              <Star className="mr-1 size-3 fill-warning text-warning" />
              {result.rating.toFixed(1)}
              {result.reviewCount != null && <span className="ml-1 text-text-muted">({result.reviewCount})</span>}
            </Badge>
          )}
          {result.state === "ADDED" && <Badge variant="success"><Check className="mr-1 size-3" />Added</Badge>}
          {result.state === "EXISTS" && <Badge variant="warning">Already in CRM</Badge>}
          {result.state === "IGNORED" && <Badge variant="neutral">Ignored</Badge>}
          {result.businessStatus && result.businessStatus !== "VeryLikelyOpen" && (
            <Badge variant="warning">{result.businessStatus}</Badge>
          )}
        </div>

        {/* Score bar */}
        <div className="mt-1.5">
          <ScoreBar score={result.score} />
        </div>

        {/* Address */}
        {result.formattedAddress && (
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-text-secondary">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-text-muted" />
            {result.formattedAddress}
            {(result.city || result.regionState || result.country) && (
              <span className="text-text-muted">
                {" · "}{[result.city, result.regionState, result.country].filter(Boolean).join(", ")}
              </span>
            )}
          </p>
        )}

        {/* Contact row */}
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-secondary">
          {result.phone && (
            <a href={`tel:${result.phone}`} className="inline-flex items-center gap-1 hover:text-primary">
              <Phone className="size-3" />{result.phone}
            </a>
          )}
          {waPhone && waPhone.length >= 10 && (
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-success hover:underline"
            >
              <MessageCircle className="size-3" />WhatsApp
            </a>
          )}
          {result.email && (
            <a href={`mailto:${result.email}`} className="inline-flex items-center gap-1 hover:text-primary">
              <Mail className="size-3" />{result.email}
            </a>
          )}
          {result.websiteUrl && (
            <a
              href={result.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <Globe className="size-3" />Website
            </a>
          )}
          {result.types.length > 0 && (
            <span className="text-text-muted">{result.types.slice(0, 3).join(", ")}</span>
          )}
          {result.mapsUrl && (
            <a
              href={result.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Maps <ExternalLink className="size-3" />
            </a>
          )}
          {result.providerUrl && (
            <a
              href={result.providerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-text-muted hover:text-primary"
            >
              Source <ExternalLink className="size-3" />
            </a>
          )}
        </div>

        {/* Expandable: opening hours + social */}
        {(result.openingHours?.length || Object.keys(result.socialLinks).length > 0) && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-text-muted hover:text-foreground"
          >
            {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            {expanded ? "Less" : "More details"}
          </button>
        )}
        {expanded && (
          <div className="mt-2 space-y-1 text-xs text-text-secondary">
            {result.openingHours?.map((h, i) => (
              <p key={i}>{h}</p>
            ))}
            {Object.entries(result.socialLinks).map(([k, v]) => (
              <p key={k}>
                <span className="capitalize text-text-muted">{k}:</span>{" "}
                <a href={v} target="_blank" rel="noreferrer" className="text-primary hover:underline">{v}</a>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-end">
        {result.state === "ADDED" || result.state === "EXISTS" ? (
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/businesses/${result.businessId}`}>Open business</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/leads/new?business=${result.businessId}`}>Create lead</Link>
            </Button>
          </>
        ) : result.state === "IGNORED" ? (
          <Button type="button" size="sm" variant="secondary" onClick={onUndoIgnore}>Undo</Button>
        ) : (
          <>
            <Button type="button" size="sm" variant="secondary" onClick={onIgnore}>
              <X className="size-4" />Ignore
            </Button>
            <Button type="button" size="sm" onClick={onAdd} disabled={adding || bulkMode}>
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {adding ? "Adding..." : "Add"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main workbench ───────────────────────────────────────────────────────────

export function ProspectingWorkbench({
  categories,
  configuredProviders,
}: {
  categories: Category[];
  configuredProviders: ProspectingProvider[];
}) {
  const session = readSession();

  const [categoryId, setCategoryId] = useState(session.categoryId ?? categories[0]?.id ?? "");
  const [customQuery, setCustomQuery] = useState(session.customQuery ?? "");
  const [postalCode, setPostalCode] = useState(session.postalCode ?? "");
  const [countryCode, setCountryCode] = useState(session.countryCode ?? "");
  const [radiusKm, setRadiusKm] = useState(session.radiusKm ?? "5");
  const [providers, setProviders] = useState<ProspectingProvider[]>(
    session.providers?.filter((p) => configuredProviders.includes(p)) ?? configuredProviders,
  );
  const [results, setResults] = useState<ResultState[]>(
    (session.results ?? []).map((r) => ({ ...scoreProspect(r), state: r.state, businessId: r.businessId })),
  );
  const [locationLabel, setLocationLabel] = useState(session.locationLabel ?? "");
  const [resolvedLocation, setResolvedLocation] = useState<ProspectSearchResult["location"] | null>(null);
  const [providerCounts, setProviderCounts] = useState<Partial<Record<ProspectingProvider, number>>>(
    session.providerCounts ?? {},
  );
  const [providerErrors, setProviderErrors] = useState<Partial<Record<ProspectingProvider, string>>>(
    session.providerErrors ?? {},
  );

  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [error, setError] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<"score" | "distance" | "name">("score");
  const [bulkMode, setBulkMode] = useState(false);
  const [territories, setTerritories] = useState<SavedTerritory[]>(readTerritories);
  const [showTerritories, setShowTerritories] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [savingTerritory, setSavingTerritory] = useState(false);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isCustom = selectedCategory?.slug === "custom";

  // Mappls only makes sense for India
  const isIndia = !countryCode || countryCode.toLowerCase() === "in";
  const visibleProviders = PROSPECTING_PROVIDERS.filter(
    (p) => p !== "mappls" || isIndia,
  );

  // Persist session
  useEffect(() => {
    if (typeof window === "undefined") return;
    const s: ProspectingSession = {
      categoryId, customQuery, postalCode, countryCode, radiusKm,
      providers, results, locationLabel, providerCounts, providerErrors,
    };
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }, [categoryId, customQuery, postalCode, countryCode, radiusKm, providers, results, locationLabel, providerCounts, providerErrors]);

  // Sorted + filtered results
  const displayResults = [...results]
    .filter((r) => r.score >= minScore)
    .sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "distance") return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      return a.name.localeCompare(b.name);
    });

  const selectedCount = results.filter((r) => r.selected).length;
  const pendingResults = results.filter(
    (r) => !r.state || r.state === "IGNORED",
  );

  function clearSession() {
    setResults([]);
    setLocationLabel("");
    setResolvedLocation(null);
    setProviderCounts({});
    setProviderErrors({});
    setError("");
    setBulkMode(false);
    if (typeof window !== "undefined") window.sessionStorage.removeItem(SESSION_KEY);
  }

  function toggleProvider(p: ProspectingProvider) {
    setProviders((cur) =>
      cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p],
    );
  }

  function setResultState(result: ResultState, state: ResultState["state"] | null, extra?: Partial<ResultState>) {
    setResults((cur) =>
      cur.map((r) =>
        r.providerPlaceId === result.providerPlaceId && r.provider === result.provider
          ? { ...r, state: state ?? undefined, ...extra }
          : r,
      ),
    );
  }

  async function search() {
    if (!selectedCategory) return;
    if (isCustom && !customQuery.trim()) { setError("Enter a search term."); return; }
    setLoading(true); setError(""); setResults([]); setProviderCounts({}); setProviderErrors({});
    try {
      const response = await searchProspectsAction({
        categoryId,
        categorySlug: selectedCategory.slug,
        customQuery: customQuery.trim(),
        postalCode,
        countryCode: countryCode.trim() || undefined,
        radiusKm: Number(radiusKm),
        providers,
      });
      const scored: ResultState[] = response.results.map((r) => ({ ...scoreProspect(r) }));
      setResults(scored);
      setResolvedLocation(response.location);
      setLocationLabel(
        [response.location.city, response.location.state, response.location.country]
          .filter(Boolean)
          .join(", "),
      );
      setProviderCounts(response.providerCounts);
      setProviderErrors(response.providerErrors);
      const errs = Object.entries(response.providerErrors);
      if (errs.length) {
        setError(
          errs.map(([p, m]) => `${providerLabels[p as ProspectingProvider]}: ${m}`).join(" | "),
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not search for businesses.");
    } finally {
      setLoading(false);
    }
  }

  async function addOne(result: ResultState) {
    setAdding(`${result.provider}:${result.providerPlaceId}`);
    setError("");
    try {
      const response = await addProspectAction(categoryId, result, resolvedLocation ?? undefined);
      setResultState(result, response.status === "CREATED" ? "ADDED" : "EXISTS", {
        businessId: response.businessId,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add this business.");
    } finally {
      setAdding(null);
    }
  }

  async function addSelected() {
    const toAdd = results.filter((r) => r.selected && !r.state);
    if (!toAdd.length) return;
    setBulkAdding(true); setError("");
    try {
      const outcomes = await bulkAddProspectsAction(categoryId, toAdd, resolvedLocation ?? undefined);
      setResults((cur) =>
        cur.map((r) => {
          const outcome = outcomes.find(
            (o) => o.provider === r.provider && o.providerPlaceId === r.providerPlaceId,
          );
          if (!outcome) return r;
          if (outcome.status === "ERROR") return { ...r, selected: false };
          return {
            ...r,
            selected: false,
            state: outcome.status === "CREATED" ? "ADDED" : "EXISTS",
            businessId: outcome.businessId,
          };
        }),
      );
      setBulkMode(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Bulk add failed.");
    } finally {
      setBulkAdding(false);
    }
  }

  function saveTerritory() {
    if (!saveName.trim()) return;
    const t: SavedTerritory = {
      id: Date.now().toString(),
      name: saveName.trim(),
      categoryId,
      customQuery,
      postalCode,
      countryCode,
      radiusKm,
      providers,
      savedAt: new Date().toISOString(),
    };
    const updated = [t, ...territories];
    setTerritories(updated);
    writeTerritories(updated);
    setSaveName("");
    setSavingTerritory(false);
  }

  function loadTerritory(t: SavedTerritory) {
    setCategoryId(t.categoryId);
    setCustomQuery(t.customQuery);
    setPostalCode(t.postalCode);
    setCountryCode(t.countryCode);
    setRadiusKm(t.radiusKm);
    setProviders(t.providers.filter((p) => configuredProviders.includes(p)));
    setShowTerritories(false);
  }

  function deleteTerritory(id: string) {
    const updated = territories.filter((t) => t.id !== id);
    setTerritories(updated);
    writeTerritories(updated);
  }

  const canSearch = !loading && !!selectedCategory && !!postalCode.trim() && providers.length > 0
    && (!isCustom || !!customQuery.trim());

  return (
    <div className="space-y-6">
      {/* ── Search form ─────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Prospecting</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Find new businesses</h1>
            <p className="mt-2 max-w-3xl text-sm text-text-secondary">
              Search multiple business-data providers by postal code. Works globally — enter any postal or ZIP code and an optional country code.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowTerritories(!showTerritories)}
            className="shrink-0"
          >
            <BookmarkPlus className="size-4" />
            Saved ({territories.length})
          </Button>
        </div>

        {/* Saved territories panel */}
        {showTerritories && (
          <div className="mt-4 rounded-lg border border-border bg-background p-4">
            <h3 className="mb-3 text-sm font-semibold">Saved territories</h3>
            {territories.length === 0 ? (
              <p className="text-sm text-text-muted">No saved territories yet. Fill in the form and save.</p>
            ) : (
              <div className="space-y-2">
                {territories.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-text-muted">
                        {t.postalCode}{t.countryCode ? ` · ${t.countryCode.toUpperCase()}` : ""} · {t.radiusKm}km
                        {t.customQuery ? ` · "${t.customQuery}"` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => loadTerritory(t)}>Load</Button>
                      <button
                        type="button"
                        onClick={() => deleteTerritory(t.id)}
                        className="text-text-muted hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main form grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr_140px_130px_auto] sm:items-end">
          <label className="space-y-2">
            <span className="block text-xs font-medium text-text-secondary">Business category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-xs font-medium text-text-secondary">
              {isCustom ? "Search term *" : "Search term (optional override)"}
            </span>
            <input
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void search(); }}
              placeholder={isCustom ? "e.g. steel manufacturer, NGO, IT company…" : "Override default"}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-xs font-medium text-text-secondary">Postal / ZIP code</span>
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.trim())}
              onKeyDown={(e) => { if (e.key === "Enter") void search(); }}
              placeholder="390001 / 10001"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-xs font-medium text-text-secondary">Country (ISO)</span>
            <input
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.trim().toLowerCase().slice(0, 2))}
              onKeyDown={(e) => { if (e.key === "Enter") void search(); }}
              placeholder="in / us / gb"
              maxLength={2}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-xs font-medium text-text-secondary">Radius</span>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="2">2 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void search()} disabled={!canSearch}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Search
          </Button>

          {/* Save territory */}
          {savingTerritory ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveTerritory(); if (e.key === "Escape") setSavingTerritory(false); }}
                placeholder="Territory name…"
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              />
              <Button type="button" size="sm" onClick={saveTerritory} disabled={!saveName.trim()}>Save</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setSavingTerritory(false)}>Cancel</Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSavingTerritory(true)}
              disabled={!postalCode}
            >
              <BookmarkPlus className="size-4" />Save territory
            </Button>
          )}
        </div>

        {/* Providers */}
        <div className="mt-5">
          <div className="text-xs font-medium text-text-secondary">Data providers</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {visibleProviders.map((p) => {
              const configured = configuredProviders.includes(p);
              const selected = providers.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  disabled={!configured}
                  onClick={() => toggleProvider(p)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected ? "border-primary bg-primary-soft text-primary" : "border-border text-text-secondary"
                  } ${!configured ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {providerLabels[p]}{!configured ? " · not configured" : ""}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-xs text-text-muted">
          OpenStreetMap is available without an API key. Mappls only appears for India searches.
          Results are reviewed before writing to your CRM.
        </p>
      </section>

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {/* ── Results section ──────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        {/* Results header */}
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Search results</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {results.length
                ? `${displayResults.length} of ${results.length} candidates${locationLabel ? ` around ${locationLabel}` : ""}`
                : "Nothing searched yet."}
            </p>
          </div>

          {results.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Provider badges */}
              {PROSPECTING_PROVIDERS.filter((p) => providers.includes(p)).map((p) => (
                <Badge key={p} variant={providerErrors[p] ? "warning" : "neutral"}>
                  {providerLabels[p]} {providerErrors[p] ? "· Failed" : `· ${providerCounts[p] ?? 0}`}
                </Badge>
              ))}

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              >
                <option value="score">Sort: Score</option>
                <option value="distance">Sort: Distance</option>
                <option value="name">Sort: Name</option>
              </select>

              {/* Min score filter */}
              <div className="flex items-center gap-1.5">
                <Zap className="size-3 text-text-muted" />
                <span className="text-xs text-text-muted">Min score</span>
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={10}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-16"
                />
                <span className="w-4 text-xs text-text-muted">{minScore}</span>
              </div>

              {/* Bulk mode toggle */}
              <Button
                type="button"
                size="sm"
                variant={bulkMode ? "primary" : "secondary"}
                onClick={() => {
                  setBulkMode(!bulkMode);
                  setResults((cur) => cur.map((r) => ({ ...r, selected: false })));
                }}
              >
                {bulkMode ? "Exit bulk" : "Bulk select"}
              </Button>

              <Button type="button" size="sm" variant="secondary" onClick={clearSession}>
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Bulk action bar */}
        {bulkMode && results.length > 0 && (
          <div className="flex items-center gap-3 border-b border-border bg-primary-soft/30 px-5 py-3">
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() =>
                setResults((cur) =>
                  cur.map((r) =>
                    r.state ? r : { ...r, selected: !r.selected },
                  ),
                )
              }
            >
              {selectedCount === pendingResults.length ? "Deselect all" : "Select all"}
            </button>
            <span className="text-xs text-text-muted">{selectedCount} selected</span>
            {selectedCount > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={() => void addSelected()}
                disabled={bulkAdding}
              >
                {bulkAdding
                  ? <><Loader2 className="size-4 animate-spin" />Adding {selectedCount}…</>
                  : <><Plus className="size-4" />Add {selectedCount} businesses</>}
              </Button>
            )}
          </div>
        )}

        {/* Results list */}
        {results.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-text-secondary">
            Choose a category or enter a search term, enter a postal code, select providers, and search.
          </div>
        ) : displayResults.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-text-secondary">
            No results match the current score filter. Lower the minimum score slider.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayResults.map((result) => (
              <ResultCard
                key={`${result.provider}:${result.providerPlaceId}`}
                result={result}
                adding={adding === `${result.provider}:${result.providerPlaceId}`}
                bulkMode={bulkMode}
                onAdd={() => void addOne(result)}
                onIgnore={() => setResultState(result, "IGNORED")}
                onUndoIgnore={() => setResultState(result, null)}
                onToggleSelect={() =>
                  setResults((cur) =>
                    cur.map((r) =>
                      r.provider === result.provider && r.providerPlaceId === result.providerPlaceId
                        ? { ...r, selected: !r.selected }
                        : r,
                    ),
                  )
                }
              />
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-text-muted">
        Map and place references are provided as source links only. Google Maps content is not copied into the CRM.
      </p>
    </div>
  );
}
