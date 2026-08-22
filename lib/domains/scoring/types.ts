export type ScoreFactor = {
  key: string;
  label: string;
  points: number;
  explanation: string;
};

export type LeadScore = {
  score: number;
  label: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  factors: ScoreFactor[];
};
