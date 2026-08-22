import Link from "next/link";
import { ArrowRight, Clock3, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecommendedAction } from "@/lib/domains/rules/types";

const priorityVariant = { URGENT: "danger", HIGH: "danger", NORMAL: "neutral", LOW: "neutral" } as const;

export function RecommendedActionCard({ action }: { action: RecommendedAction }) {
  return <article className="rounded-xl border border-border bg-surface p-5 shadow-sm shadow-slate-950/[0.02]">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{action.type.replaceAll("_", " ")}</Badge>
          <Badge variant={priorityVariant[action.priority]}>{action.priority}</Badge>
          {action.score != null ? <span className="text-xs font-semibold text-text-secondary">Score {action.score}</span> : null}
        </div>
        <h3 className="mt-3 text-sm font-semibold">{action.title}</h3>
        <p className="mt-1 text-sm text-text-secondary">{action.reason}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1"><Lightbulb className="size-3.5" />Rule {action.ruleId}</span>
          {action.dueAt ? <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{new Date(action.dueAt).toLocaleString()}</span> : null}
        </div>
      </div>
      <Link href={action.href} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted">
        Review <ArrowRight className="size-4" />
      </Link>
    </div>
    <details className="mt-4 border-t border-border pt-3 text-xs text-text-muted">
      <summary className="cursor-pointer font-medium text-text-secondary">Why is this recommended?</summary>
      <p className="mt-2">Matched rule <span className="font-mono">{action.ruleId}</span>. Source records: {action.sourceRecords.join(", ")}.</p>
    </details>
  </article>;
}
