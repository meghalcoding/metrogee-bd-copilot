"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { enrichBusinessAction } from "@/app/actions/business-enrichment";
import { Button } from "@/components/ui/button";

export function EnrichBusinessButton({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function run() {
    setPending(true);
    setMessage("");
    try {
      const result = await enrichBusinessAction(businessId);
      const parts = [];
      if (result.fieldsUpdated.length) parts.push(`Updated ${result.fieldsUpdated.join(", ")}`);
      if (result.matchedProviders.length) parts.push(`matched ${result.matchedProviders.join(", ")}`);
      if (Object.keys(result.providerErrors).length) parts.push(`${Object.keys(result.providerErrors).length} provider error(s)`);
      setMessage(parts.join(" · ") || "No new information found.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not enrich this business.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="secondary" onClick={run} disabled={pending}>
        <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Enriching..." : "Enrich from providers"}
      </Button>
      {message ? <span className="text-xs text-text-secondary">{message}</span> : null}
    </div>
  );
}
