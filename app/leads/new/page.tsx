import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LeadForm } from "@/components/leads/lead-form";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getBusiness } from "@/lib/domains/businesses/service";
import { requireUser } from "@/lib/auth/require-user";

export default async function NewLeadPage({ searchParams }: { searchParams: Promise<{ business?: string }> }) {
  await requireUser();
  const { business: businessId } = await searchParams;
  const organization = await getCurrentOrganization();
  if (!organization || !businessId) redirect("/businesses");
  const business = await getBusiness(organization.id, businessId);
  if (!business) redirect("/businesses");
  return <AppShell><div className="mx-auto max-w-3xl space-y-6"><div><p className="text-sm font-medium text-primary">New lead</p><h1 className="mt-1">Qualify {business.name}</h1><p className="mt-2 text-sm text-text-secondary">Create the organization-specific sales relationship without changing the underlying business record.</p></div><LeadForm businessId={business.id} /></div></AppShell>;
}
