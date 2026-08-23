# P2-E.3 Hotfix

This replaces three files from the P2-E.3 checkpoint.

Fixes:
- Invalid `Badge` variant `default` causing the production TypeScript failure.
- Removes unused `Pencil` import.
- Replaces internal `window.location.href` navigation with supported client navigation behavior for refresh and opens the ICS API in a new window.

Apply from the project root:

```powershell
Expand-Archive ".\P2-E3-HOTFIX.zip" -DestinationPath "." -Force
npm run lint
npm run build
```
