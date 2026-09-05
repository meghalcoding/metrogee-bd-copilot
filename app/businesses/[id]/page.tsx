import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, MapPin, Phone, Mail, Pencil, UserPlus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getBusiness } from "@/lib/domains/businesses/service";
import { listContacts } from "@/lib/domains/contacts/service";
import { requireUser } from "@/lib/auth/require-user";
import { ContactList } from "@/components/contacts/contact-list";
import { EnrichBusinessButton } from "@/components/businesses/enrich-business-button";
import { listRelatedMeetings } from "@/lib/domains/meetings/service";

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const organization = await getCurrentOrganization();
  if (!organization) return null;

  const business = await getBusiness(organization.id, id);
  if (!business) notFound();
  const [contacts, meetings] = await Promise.all([listContacts(organization.id, id), listRelatedMeetings(organization.id, { businessId: id })]);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/businesses" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-foreground"><ArrowLeft className="size-4" />Businesses</Link>
        <section className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-start sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1><Badge>{business.website_status}</Badge></div>
            <p className="mt-2 text-sm text-text-secondary">Business record · sales state belongs to the Lead domain.</p>
          </div>
          <div className="flex flex-wrap gap-2"><EnrichBusinessButton businessId={id} /><Button asChild variant="secondary"><Link href={`/meetings/new?business=${id}`}>Schedule meeting</Link></Button><Button asChild variant="secondary"><Link href={`/businesses/${id}/edit`}><Pencil className="size-4" />Edit</Link></Button><Button asChild><Link href={`/leads/new?business=${id}`}><UserPlus className="size-4" />Create lead</Link></Button></div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Overview</h2>
            <div className="mt-5 space-y-4 text-sm">
              <Info icon={<MapPin className="size-4" />} value={[business.address_line_1, business.address_line_2, business.city, business.state, business.postal_code, business.country].filter(Boolean).join(", ") || "No address recorded"} />
              <Info icon={<Phone className="size-4" />} value={business.phone || "No phone recorded"} />
              <Info icon={<Mail className="size-4" />} value={business.email || "No email recorded"} />
              <Info icon={<Globe className="size-4" />} value={business.website_url || "No website recorded"} />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Public business attributes</h2>
            <dl className="mt-5 grid grid-cols-2 gap-5 text-sm">
              <div><dt className="text-xs text-text-muted">Rating</dt><dd className="mt-1 font-medium">{business.rating ?? "—"}</dd></div>
              <div><dt className="text-xs text-text-muted">Reviews</dt><dd className="mt-1 font-medium">{business.review_count ?? "—"}</dd></div>
              <div><dt className="text-xs text-text-muted">Source</dt><dd className="mt-1 font-medium">{business.source_primary ?? "Manual"}</dd></div>
              <div><dt className="text-xs text-text-muted">Last updated</dt><dd className="mt-1 font-medium">{new Date(business.updated_at).toLocaleString()}</dd></div>
            </dl>
          </div>
        </section>

        <ContactList businessId={id} contacts={contacts} />

        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold">Meetings</h2><p className="mt-1 text-xs text-text-muted">Meetings scheduled with this business.</p></div><Link href={`/meetings/new?business=${id}`} className="text-xs font-medium text-primary">Schedule meeting</Link></div>
          {meetings.length ? meetings.map((meeting) => <Link key={meeting.id} href={`/meetings/${meeting.id}`} className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-surface-muted/60"><div className="min-w-0"><p className="truncate text-sm font-medium">{meeting.title}</p><p className="mt-1 text-xs text-text-muted">{meeting.status} · {new Date(meeting.start_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p></div><span className="shrink-0 text-xs text-text-muted">{meeting.contact?.full_name ?? "No contact"}</span></Link>) : <div className="px-5 py-10 text-center text-sm text-text-secondary">No meetings scheduled.</div>}
        </section>
      </div>
    </AppShell>
  );
}

function Info({ icon, value }: { icon: React.ReactNode; value: string }) {
  return <div className="flex items-start gap-3 text-text-secondary"><span className="mt-0.5 text-text-muted">{icon}</span><span className="break-all">{value}</span></div>;
}
