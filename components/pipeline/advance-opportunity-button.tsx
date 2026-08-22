"use client";

import { useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { advanceOpportunityAction } from "@/app/actions/opportunities";
import { Button } from "@/components/ui/button";

export function AdvanceOpportunityButton({ opportunityId }: { opportunityId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => startTransition(() => advanceOpportunityAction(opportunityId))}>
      <ArrowRight className="size-3.5" />
      {pending ? "Moving..." : "Advance"}
    </Button>
  );
}
