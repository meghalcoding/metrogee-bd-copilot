"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { completeTaskAction } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => startTransition(() => completeTaskAction(taskId))}
    >
      <Check className="size-3.5" />
      {pending ? "Completing..." : "Complete"}
    </Button>
  );
}
