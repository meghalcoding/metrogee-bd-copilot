"use client";

import { useState } from "react";
import { setIntegrationEnabledAction, disconnectIntegrationAction } from "@/app/actions/integrations";
import { Button } from "@/components/ui/button";
import type { IntegrationDefinition } from "@/lib/domains/integrations/types";
import type { IntegrationRecord } from "@/lib/domains/integrations/types";

export function IntegrationCard({
  definition,
  connection,
}: {
  definition: IntegrationDefinition;
  connection: IntegrationRecord | null;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const enabled = connection?.enabled === true;
  const status = connection?.status ?? "DISCONNECTED";

  async function toggle() {
    setPending(true);
    setError("");
    try {
      await setIntegrationEnabledAction(definition.provider, !enabled);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update integration.");
    } finally {
      setPending(false);
    }
  }

  async function disconnect() {
    setPending(true);
    setError("");
    try {
      await disconnectIntegrationAction(definition.provider);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not disconnect integration.");
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">{definition.displayName}</h2>
          <p className="mt-1 text-sm text-text-secondary">{definition.description}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${
          status === "CONNECTED" ? "bg-success/10 text-success" :
          status === "ERROR" ? "bg-danger/10 text-danger" :
          "bg-surface-muted text-text-secondary"
        }`}>
          {status === "CONNECTED" ? "Connected" : status === "DISABLED" ? "Disabled" : status === "ERROR" ? "Error" : "Not connected"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {definition.capabilities.map((capability) => (
          <span key={capability} className="rounded-md border border-border bg-background px-2 py-1 text-xs text-text-secondary">
            {capability}
          </span>
        ))}
      </div>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      <div className="mt-5 flex items-center gap-2">
        <Button disabled={pending} onClick={toggle}>
          {pending ? "Saving..." : enabled ? "Disable" : "Connect"}
        </Button>
        {connection ? (
          <Button variant="secondary" disabled={pending} onClick={disconnect}>
            Disconnect
          </Button>
        ) : null}
      </div>

      {enabled ? (
        <p className="mt-3 text-xs text-text-muted">
          Connection is registered. Provider authentication will be added in the provider-specific integration phase.
        </p>
      ) : null}
    </article>
  );
}
