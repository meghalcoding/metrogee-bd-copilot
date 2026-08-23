# P2-D — Enrichment Intelligence & Provider Confidence

## Goal
Make enrichment explainable and safe: every provider match gets a match score, populated fields retain provider provenance, and conflicting provider values are preserved in enrichment metadata rather than silently overwriting CRM data.

## Behavior
- Existing CRM values are never overwritten by enrichment.
- Provider matches retain a `match_score`.
- Populated fields retain `{ provider, matchScore }` provenance.
- Conflicting values are recorded in `metadata_json.enrichment.conflicts`.
- Raw provider responses remain available for audit/debugging.
- No database migration is required.
