/**
 * Lead scoring — pure client-safe module (no server-only imports).
 * Scores a ProspectResult 0–100 based on data richness signals.
 * No external API calls required.
 */

import type { ProspectResult } from "./types";

export type ScoredResult = ProspectResult & {
  score: number;
  scoreBreakdown: ScoreBreakdown;
};

export type ScoreBreakdown = {
  hasPhone: boolean;
  hasEmail: boolean;
  hasWebsite: boolean;
  hasAddress: boolean;
  hasRating: boolean;
  hasReviews: boolean;
  reviewTier: "none" | "few" | "established" | "popular";
  isOperational: boolean;
  hasTypes: boolean;
  hasCoordinates: boolean;
};

const SCORE_WEIGHTS = {
  hasPhone: 22,
  hasWebsite: 18,
  hasEmail: 15,
  hasAddress: 12,
  hasCoordinates: 5,
  hasTypes: 4,
  isOperational: 8,
  reviewTier: { none: 0, few: 4, established: 10, popular: 16 },
};

function reviewTier(result: ProspectResult): ScoreBreakdown["reviewTier"] {
  const count = result.reviewCount ?? 0;
  const rating = result.rating ?? 0;
  if (count >= 100 || (count >= 50 && rating >= 4)) return "popular";
  if (count >= 20 || rating >= 3.5) return "established";
  if (count > 0 || rating > 0) return "few";
  return "none";
}

function isOperational(result: ProspectResult): boolean {
  const status = result.businessStatus?.toUpperCase();
  if (!status) return true; // unknown → assume open
  return !["CLOSED", "CLOSED_PERMANENTLY", "DISUSED", "ABANDONED", "DEMOLISHED"].includes(status);
}

export function scoreProspect(result: ProspectResult): ScoredResult {
  const breakdown: ScoreBreakdown = {
    hasPhone: !!result.phone,
    hasEmail: !!result.email,
    hasWebsite: !!result.websiteUrl,
    hasAddress: !!result.formattedAddress,
    hasRating: result.rating != null,
    hasReviews: (result.reviewCount ?? 0) > 0,
    reviewTier: reviewTier(result),
    isOperational: isOperational(result),
    hasTypes: result.types.length > 0,
    hasCoordinates: result.latitude != null && result.longitude != null,
  };

  const score = Math.min(
    100,
    (breakdown.hasPhone ? SCORE_WEIGHTS.hasPhone : 0) +
      (breakdown.hasWebsite ? SCORE_WEIGHTS.hasWebsite : 0) +
      (breakdown.hasEmail ? SCORE_WEIGHTS.hasEmail : 0) +
      (breakdown.hasAddress ? SCORE_WEIGHTS.hasAddress : 0) +
      (breakdown.hasCoordinates ? SCORE_WEIGHTS.hasCoordinates : 0) +
      (breakdown.hasTypes ? SCORE_WEIGHTS.hasTypes : 0) +
      (breakdown.isOperational ? SCORE_WEIGHTS.isOperational : 0) +
      SCORE_WEIGHTS.reviewTier[breakdown.reviewTier],
  );

  return { ...result, score, scoreBreakdown: breakdown };
}

export function scoreLabel(score: number): { label: string; variant: "success" | "info" | "warning" | "neutral" } {
  if (score >= 70) return { label: "Strong", variant: "success" };
  if (score >= 45) return { label: "Good", variant: "info" };
  if (score >= 22) return { label: "Partial", variant: "warning" };
  return { label: "Thin", variant: "neutral" };
}
