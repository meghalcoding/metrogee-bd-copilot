import Link from "next/link";
import { Building2, Globe, MapPin, Phone, Plus, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listBusinesses } from "@/lib/domains/businesses/service";
import { requireUser } from "@/lib/auth/require-user";

const websiteStatusLabel: Record<string, { label: string; variant: "success" | "danger" | "neutral" | "warning" }> = {
  WU: { label: "Has website", variant: "success" },
  W0: { label: "No website", variant: "danger" },
  WE: { label: "Website error", variant: "warning" },
};

export default async function BusinessesPage() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const businesses = await listBusinesses(organization.id);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">CRM</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Businesses</h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              {businesses.length > 0
                ? `${businesses.length} business record${businesses.length === 1 ? "" : "s"} in your workspace`
                : "The factual company records your organisation works with."}
            </p>
          </div>
          <Button asChild>
            <Link href="/businesses/new">
              <Plus className="size-4" />New business
            </Link>
          </Button>
        </div>

        {/* List */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {/* Table header */}
          <div className="hidden grid-cols-[2fr_1.4fr_1fr_1fr_110px_80px] gap-4 border-b border-border bg-surface-muted/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted md:grid">
            <span>Business</span>
            <span>Location</span>
            <span>Website</span>
            <span>Rating</span>
            <span>Updated</span>
            <span />
          </div>

          {businesses.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <Building2 className="mb-3 size-10 text-text-muted" strokeWidth={1.2} />
              <p className="text-sm font-medium">No businesses yet</p>
              <p className="mt-1 max-w-xs text-sm text-text-secondary">
                Create the first business record, or use Prospecting to find and import businesses automatically.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button asChild variant="secondary" size="sm">
                  <Link href="/prospecting">Open Prospecting</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/businesses/new">Create manually</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {businesses.map((business) => {
                const ws = websiteStatusLabel[business.website_status] ?? { label: business.website_status, variant: "neutral" as const };
                const location = [business.city, business.state, business.country].filter(Boolean).join(", ");
                return (
                  <Link
                    key={business.id}
                    href={`/businesses/${business.id}`}
                    className="group grid gap-3 px-5 py-4 transition-colors hover:bg-surface-muted/50 md:grid-cols-[2fr_1.4fr_1fr_1fr_110px_80px] md:items-center md:gap-4"
                  >
                    {/* Name + contact */}
                    <div className="min-w-0">
                      <div className="font-medium text-foreground transition-colors group-hover:text-primary">
                        {business.name}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                        {business.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3" />{business.phone}
                          </span>
                        )}
                        {!business.phone && !business.email && (
                          <span>No contact details</span>
                        )}
                        {business.email && !business.phone && (
                          <span>{business.email}</span>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                      {location ? (
                        <>
                          <MapPin className="size-3.5 shrink-0 text-text-muted" />
                          <span className="truncate">{location}</span>
                        </>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </div>

                    {/* Website */}
                    <div className="flex items-center gap-1.5">
                      <Globe className="size-3.5 shrink-0 text-text-muted" />
                      <Badge variant={ws.variant}>{ws.label}</Badge>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                      {business.rating != null ? (
                        <>
                          <Star className="size-3.5 shrink-0 fill-warning text-warning" />
                          <span className="font-medium">{business.rating}</span>
                          {business.review_count != null && (
                            <span className="text-xs text-text-muted">({business.review_count})</span>
                          )}
                        </>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </div>

                    {/* Updated */}
                    <div className="text-xs text-text-muted">
                      {new Date(business.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>

                    {/* CTA */}
                    <span className="text-xs font-semibold text-primary md:text-right">Open →</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
