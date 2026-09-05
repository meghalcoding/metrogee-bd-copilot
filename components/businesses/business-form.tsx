"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBusinessAction, updateBusinessAction } from "@/app/actions/businesses";
import type { BusinessInput, BusinessRecord } from "@/lib/domains/businesses/types";

export function BusinessForm({ initial }: { initial?: BusinessRecord }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initial?.name ?? "");
  const [website, setWebsite] = useState(initial?.website_url ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [postalCode, setPostalCode] = useState(initial?.postal_code ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [categoryId, setCategoryId] = useState(initial?.primary_category_id ?? "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const input: BusinessInput = {
      name,
      website_url: website || null,
      phone: phone || null,
      email: email || null,
      city: city || null,
      state: state || null,
      postal_code: postalCode || null,
      country: country || "India",
      primary_category_id: categoryId || null,
      website_status: initial?.website_status ?? "WU",
    };

    try {
      const result = initial
        ? await updateBusinessAction(initial.id, input)
        : await createBusinessAction(input);

      router.push(`/businesses/${result.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save business.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Business name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} required />
        </Field>
        <Field label="Website">
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} type="url" placeholder="https://example.com" />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </Field>
        <Field label="City">
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        <Field label="State / Region">
          <Input value={state} onChange={(e) => setState(e.target.value)} />
        </Field>
        <Field label="Postal / ZIP code">
          <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="390001, 10001, SW1A 1AA" />
        </Field>
        <Field label="Country">
          <Input value={country} onChange={(e) => setCountry(e.target.value)} />
        </Field>
        <Field label="Category ID" hint="Category selection UI will be expanded in the category domain.">
          <Input value={categoryId} onChange={(e) => setCategoryId(e.target.value)} placeholder="Optional UUID" />
        </Field>
      </div>

      {error ? <p className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : initial ? "Save changes" : "Create business"}</Button>
      </div>
    </form>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}{required ? " *" : ""}</label>
      {children}
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
    </div>
  );
}
