import { AppShell } from "@/components/layout/app-shell";
import { BusinessForm } from "@/components/businesses/business-form";
import { requireUser } from "@/lib/auth/require-user";

export default async function NewBusinessPage() {
  await requireUser();
  return <AppShell><div className="mx-auto max-w-4xl space-y-6"><div><p className="text-sm font-medium text-primary">Businesses</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">New business</h1><p className="mt-2 text-sm text-text-secondary">Create a tenant-scoped factual business record.</p></div><div className="rounded-xl border border-border bg-surface p-5 sm:p-7"><BusinessForm /></div></div></AppShell>;
}
