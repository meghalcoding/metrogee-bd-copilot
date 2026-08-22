"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { qualifyLeadForOpportunityAction } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";

export function QualifyLeadAndContinue({ leadId, returnTo }: { leadId: string; returnTo: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await qualifyLeadForOpportunityAction(leadId);
        router.push(returnTo);
        router.refresh();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Could not qualify lead.");
      }
    });
  }

  return (
    <Button type="button" onClick={handleClick} disabled={pending}>
      {pending ? "Qualifying..." : "Qualify lead & continue"}
      <ArrowRight className="size-4" />
    </Button>
  );
}
