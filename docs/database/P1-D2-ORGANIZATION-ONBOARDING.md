# P1-D.2 — Organization onboarding

This slice adds:

- organization setup page at `/setup`
- deterministic organization creation via `create_organization`
- current organization domain helper
- automatic slug generation
- no-organization redirect in the Next.js proxy

Multiple organizations are intentionally not silently guessed. The current organization helper only resolves a single membership automatically; an explicit organization switcher will be introduced when multi-organization UI is built.

## Verification

Run:

- `npm run lint`
- `npm run build`

Then test:
1. authenticated user with no membership -> `/setup`
2. create organization -> `/`
3. `/setup` after membership -> `/`
