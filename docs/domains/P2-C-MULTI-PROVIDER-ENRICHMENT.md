# P2-C — Multi-Provider Business Enrichment

## Purpose

Enrich an existing CRM Business from every configured prospecting provider without creating duplicate businesses or overwriting existing CRM fields with weaker/null values.

## Behavior

- Uses the Business's primary category and coordinates (or Indian PIN geocoding as fallback).
- Searches a small 2 km radius around the existing business.
- Matches provider results conservatively by name, phone, website and address.
- Fills only currently empty Business fields.
- Preserves every matched provider's raw result in `metadata_json.enrichment`.
- Records provider provenance in `business_sources`.
- Records an enrichment summary in Notes.
- Provider failures do not prevent successful providers from contributing data.
- No database migration required.

## Next

P2-D can build enrichment scheduling/refresh policies and provider-specific field confidence, followed by the broader integrations layer.
