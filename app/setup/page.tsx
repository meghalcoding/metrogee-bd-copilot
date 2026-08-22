import { redirect } from "next/navigation";
import { getUserOrganizations } from "@/lib/domains/organizations/current";
import { OrganizationSetupForm } from "@/components/organizations/organization-setup-form";

export default async function OrganizationSetupPage() {
  const organizations = await getUserOrganizations();

  if (organizations.length > 0) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-lg rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold text-primary">BD Operating System</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Create your workspace
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Set up the organization where your business-development work will live.
          </p>
        </div>
        <OrganizationSetupForm />
      </section>
    </main>
  );
}
