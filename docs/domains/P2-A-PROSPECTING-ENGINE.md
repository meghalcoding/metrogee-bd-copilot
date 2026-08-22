# P2-A — India Prospecting Engine

## Purpose

Give the BD user a controlled workflow for finding new Indian businesses by category and PIN code, reviewing results from multiple providers, and selectively importing businesses into the CRM.

## Workflow

1. Select an existing business category.
2. Enter a 6-digit Indian PIN code.
3. Choose a search radius.
4. Select one or more configured data providers.
5. Search providers in parallel.
6. Merge duplicate candidates across providers.
7. Review candidates.
8. Add or ignore each candidate.
9. Added candidates become tenant-scoped Business records.
10. Provider metadata and source references are retained so information is not lost.

## Providers

- OpenStreetMap / Overpass — default zero-key provider.
- Geoapify — optional OSM-based provider.
- Foursquare — optional global POI provider.
- Mappls — optional India-focused POI provider.

Provider adapters are isolated under `lib/domains/prospecting/providers/` so providers can be added or removed without redesigning the CRM.

## India location handling

PIN validation uses the India Post PIN directory. Coordinates are resolved through Geoapify when configured, otherwise the user-triggered search uses OpenStreetMap Nominatim with an identifiable User-Agent and must remain within the published Nominatim usage policy.

## Google Maps

The UI provides a Google Maps reference link for a candidate where useful. This checkpoint does **not** copy or scrape Google Maps content. Google Maps Platform terms prohibit extracting/scraping Maps content for use outside the service, so Google is not used as a hidden scraping source.

For classroom demonstrations, Google Maps can be opened manually from a candidate while the CRM stores only data returned by the selected permitted provider.

## Import behavior

The imported Business stores:

- normalized name
- address
- Indian PIN code where available
- country = India
- phone/email/website where available
- coordinates where available
- category
- rating/review count where the provider supplies them
- provider/source identifiers
- raw provider metadata in `metadata_json`
- a human-readable note containing additional provider information

The workflow intentionally stops at Business creation. The existing Business → Contact → Lead → Opportunity workflow remains the next step for the BD user.
