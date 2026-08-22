import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listBusinesses } from "@/lib/domains/businesses/service";
import { requireUser } from "@/lib/auth/require-user";

export default async function BusinessesPage() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const businesses = await listBusinesses(organization.id);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-sm font-medium text-primary">CRM</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Businesses</h1><p className="mt-2 text-sm text-text-secondary">The factual company records your organization works with.</p></div>
          <Button asChild><Link href="/businesses/new"><Plus className="size-4" />New business</Link></Button>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-muted">
          <Search className="size-4" /><span>Business search and advanced filters are coming with P1-P.</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="hidden grid-cols-[2fr_1.2fr_1fr_1fr_1fr_100px] gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted md:grid">
            <span>Business</span><span>Location</span><span>Website</span><span>Rating</span><span>Updated</span><span />
          </div>
          {businesses.length === 0 ? (
            <div className="px-5 py-14 text-center"><p className="text-sm font-medium">No businesses yet</p><p className="mt-1 text-sm text-text-secondary">Create the first business record to begin building your CRM.</p></div>
          ) : (
            <div className="divide-y divide-border">
              {businesses.map((business) => (
                <Link key={business.id} href={`/businesses/${business.id}`} className="grid gap-3 px-5 py-4 transition-colors hover:bg-surface-muted md:grid-cols-[2fr_1.2fr_1fr_1fr_1fr_100px] md:items-center md:gap-4">
                  <div><div className="font-medium text-foreground">{business.name}</div><div className="mt-1 text-xs text-text-muted">{business.phone || business.email || "No direct contact details"}</div></div>
                  <div className="text-sm text-text-secondary">{[business.city, business.state, business.country].filter(Boolean).join(", ") || "—"}</div>
                  <div><Badge variant={business.website_status === "W0" ? "danger" : "neutral"}>{business.website_status}</Badge></div>
                  <div className="text-sm text-text-secondary">{business.rating != null ? `${business.rating} (${business.review_count ?? 0})` : "—"}</div>
                  <div className="text-xs text-text-muted">{new Date(business.updated_at).toLocaleDateString()}</div>
                  <span className="text-xs font-semibold text-primary md:text-right">Open</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
