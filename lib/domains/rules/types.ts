export type RecommendedActionType = "CALL_OR_MESSAGE" | "FOLLOW_UP" | "REVIEW_LEAD" | "REVIEW_OPPORTUNITY" | "COMPLETE_TASK";
export type RecommendedPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type RecommendedAction = {
  id: string;
  ruleId: string;
  type: RecommendedActionType;
  priority: RecommendedPriority;
  title: string;
  reason: string;
  dueAt: string | null;
  leadId: string | null;
  opportunityId: string | null;
  businessId: string | null;
  taskId: string | null;
  score: number | null;
  sourceRecords: string[];
  href: string;
};
