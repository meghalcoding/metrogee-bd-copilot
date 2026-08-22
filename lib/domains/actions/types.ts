import type { RecommendedAction } from "@/lib/domains/rules/types";

export type ActionCenterData = {
  recommendations: RecommendedAction[];
  openTaskCount: number;
  overdueTaskCount: number;
  dueTodayTaskCount: number;
  highPriorityTaskCount: number;
};
