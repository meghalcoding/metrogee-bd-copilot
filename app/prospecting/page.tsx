import { AppShell } from "@/components/layout/app-shell";
import { ProspectingWorkbench } from "@/components/prospecting/prospecting-workbench";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listBusinessCategories } from "@/lib/domains/businesses/service";
import { CUSTOM_CATEGORY } from "@/lib/domains/prospecting/categories";
import type { ProspectingProvider } from "@/lib/domains/prospecting/types";

function configuredProviders(): ProspectingProvider[] {
  const providers: ProspectingProvider[] = ["osm_overpass"];
  if (process.env.GEOAPIFY_API_KEY) providers.push("geoapify");
  if (process.env.FOURSQUARE_API_KEY) providers.push("foursquare");
  if (process.env.MAPPLS_ACCESS_TOKEN) providers.push("mappls");
  return providers;
}

export default async function ProspectingPage() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const dbCategories = await listBusinessCategories(organization.id);
  // Append the custom/free-text option at the end
  const categories = [...dbCategories, CUSTOM_CATEGORY];
  return (
    <AppShell>
      <ProspectingWorkbench categories={categories} configuredProviders={configuredProviders()} />
    </AppShell>
  );
}
