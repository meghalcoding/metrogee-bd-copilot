"use client";

import { useState, useTransition } from "react";
import { reopenOpportunityAction, closeOpportunityAction } from "@/app/actions/opportunities";
import { Button } from "@/components/ui/button";

export function CloseOpportunityButtons({ opportunityId, status }: { opportunityId: string; status: "OPEN" | "ON_HOLD" | "WON" | "LOST" }) {
  const [pending, startTransition] = useTransition();
  const [lostReason, setLostReason] = useState("");
  const [showLost, setShowLost] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "WON" || status === "LOST") {
    function reopen() {
      if (!window.confirm("Reopen this opportunity? It will return to OPEN without changing its current stage.")) return;
      setError(null);
      startTransition(async () => {
        try { await reopenOpportunityAction(opportunityId); }
        catch (e) { setError(e instanceof Error ? e.message : "Could not reopen opportunity."); }
      });
    }
    return <div className="space-y-2"><Button type="button" variant="secondary" disabled={pending} onClick={reopen}>{pending ? "Reopening..." : "Reopen opportunity"}</Button>{error ? <p className="text-xs text-danger">{error}</p> : null}</div>;
  }

  function markWon() {
    if (!window.confirm("Mark this opportunity as WON and close the deal?")) return;
    setError(null);
    startTransition(async () => {
      try { await closeOpportunityAction(opportunityId, "WON"); }
      catch (e) { setError(e instanceof Error ? e.message : "Could not close opportunity."); }
    });
  }

  function markLost() {
    if (!lostReason.trim()) { setError("Enter a lost reason first."); return; }
    setError(null);
    startTransition(async () => {
      try { await closeOpportunityAction(opportunityId, "LOST", lostReason); setShowLost(false); }
      catch (e) { setError(e instanceof Error ? e.message : "Could not close opportunity."); }
    });
  }

  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2"><Button type="button" variant="primary" disabled={pending} onClick={markWon}>{pending ? "Saving..." : "Mark won"}</Button><Button type="button" variant="danger" disabled={pending} onClick={() => { setError(null); setShowLost(true); }}>Mark lost</Button></div>
    {showLost ? <div className="rounded-lg border border-border bg-background p-4"><p className="text-sm font-semibold">Why was the opportunity lost?</p><p className="mt-1 text-xs text-text-secondary">This becomes part of the deal record.</p><input value={lostReason} onChange={(e) => setLostReason(e.target.value)} className="mt-3 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70" placeholder="Budget, timing, competitor..." /><div className="mt-3 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setShowLost(false)}>Cancel</Button><Button type="button" variant="danger" disabled={pending} onClick={markLost}>Confirm lost</Button></div></div> : null}
    {error ? <p className="text-xs text-danger">{error}</p> : null}
  </div>;
}
