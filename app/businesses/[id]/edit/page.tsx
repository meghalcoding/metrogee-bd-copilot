import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { BusinessForm } from "@/components/businesses/business-form";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getBusiness } from "@/lib/domains/businesses/service";
import { requireUser } from "@/lib/auth/require-user";

export default async function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const business = await getBusiness(organization.id, id);
  if (!business) notFound();

  return <AppShell><div className="mx-auto max-w-4xl space-y-6"><div><p className="text-sm font-medium text-primary">Businesses</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Edit business</h1></div><div className="rounded-xl border border-border bg-surface p-5 sm:p-7"><BusinessForm initial={business} /></div></div></AppShell>;
}
