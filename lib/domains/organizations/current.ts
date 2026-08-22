import { createClient } from "@/lib/supabase/server";

export type CurrentOrganization = {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "admin" | "manager" | "bd_user" | "viewer";
};

export async function getUserOrganizations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations!inner(id, name, slug)")
    .order("joined_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      role: row.role as CurrentOrganization["role"],
    };
  });
}

export async function getCurrentOrganization() {
  const organizations = await getUserOrganizations();

  if (organizations.length === 0) return null;
  if (organizations.length === 1) return organizations[0];

  const supabase = await createClient();
  const { data: cookieValue } = await supabase.auth.getUser();
  const selectedId = cookieValue.user?.user_metadata?.current_organization_id;

  return organizations.find((organization) => organization.id === selectedId) ?? null;
}
