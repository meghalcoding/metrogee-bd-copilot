"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContactForm } from "./contact-form";
import { archiveContactAction } from "@/app/actions/contacts";
import type { ContactRecord } from "@/lib/domains/contacts/types";

export function ContactList({ businessId, contacts }: { businessId: string; contacts: ContactRecord[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ContactRecord | undefined>();

  async function remove(contact: ContactRecord) {
    if (!window.confirm(`Archive ${contact.full_name}?`)) return;
    await archiveContactAction(contact.id, businessId);
  }

  if (adding || editing) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{editing ? "Edit contact" : "Add contact"}</h3>
        <ContactForm businessId={businessId} initial={editing} onCancel={() => { setAdding(false); setEditing(undefined); }} />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div><h2 className="text-sm font-semibold text-foreground">Contacts</h2><p className="mt-1 text-xs text-text-muted">{contacts.length} active contact{contacts.length === 1 ? "" : "s"}</p></div>
        <Button size="sm" onClick={() => setAdding(true)}><Plus className="size-4" />Add contact</Button>
      </div>
      {contacts.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-text-secondary">No contacts have been added to this business.</div>
      ) : (
        <div className="divide-y divide-border">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium text-foreground">{contact.full_name}</div>
                <div className="mt-1 text-xs text-text-secondary">{contact.job_title || "No title"}{contact.email ? ` · ${contact.email}` : ""}{contact.phone ? ` · ${contact.phone}` : ""}</div>
              </div>
              <div className="flex items-center gap-2">
                {contact.preferred_channel ? <Badge variant="neutral">{contact.preferred_channel}</Badge> : null}
                <Button variant="ghost" size="icon" onClick={() => setEditing(contact)} aria-label={`Edit ${contact.full_name}`}><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(contact)} aria-label={`Archive ${contact.full_name}`}><Trash2 className="size-4 text-danger" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
