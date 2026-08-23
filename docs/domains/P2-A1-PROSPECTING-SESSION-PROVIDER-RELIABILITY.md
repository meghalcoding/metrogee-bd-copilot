# P2-A.1 — Prospecting Session & Provider Reliability

- Prospecting results persist in browser `sessionStorage` while the tab/session remains active.
- Navigating to a Business and returning to Prospecting restores the current search.
- Starting a new Search intentionally replaces the previous results.
- Add/Exists/Ignored state is preserved.
- Provider result counts distinguish successful zero-result searches from provider failures.
- A failing provider no longer hides successful results from other providers.
- A provider error is shown with the provider name and message.
- Clear current search explicitly removes the saved prospecting session.

No database migration is required.
