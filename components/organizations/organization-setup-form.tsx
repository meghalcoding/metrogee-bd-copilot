"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function OrganizationSetupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const supabase = createClient();
    const { error: createError } = await supabase.rpc("create_organization", {
      p_name: name,
      p_slug: slug,
    });

    if (createError) {
      setError(
        createError.code === "23505"
          ? "That workspace URL is already in use."
          : "We could not create the workspace. Please check the details and try again.",
      );
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="organization-name">
          Organization name
        </label>
        <Input
          id="organization-name"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="MetroGee"
          required
          minLength={2}
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="organization-slug">
          Workspace URL
        </label>
        <Input
          id="organization-slug"
          value={slug}
          onChange={(event) => {
            setSlug(slugify(event.target.value));
            setSlugEdited(true);
          }}
          placeholder="metrogee"
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
        />
        <p className="text-xs text-text-secondary">
          Lowercase letters, numbers and single hyphens only.
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? "Creating workspace..." : "Create workspace"}
      </Button>
    </form>
  );
}
