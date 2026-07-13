# PetRadar Next.js Web

Parallel Next.js migration target for the user-facing PetRadar application. The Angular app in
`apps/web` remains the production behavior reference until feature parity and cutover are approved.

## Local development

1. Copy `.env.example` to `.env.local` and keep only non-secret browser configuration there.
2. Start the existing API at `http://localhost:3000`.
3. In PowerShell, run `$env:NX_DAEMON = 'false'`, then `corepack pnpm nx serve web-next`
   from the repository root.
4. Open `http://localhost:4300`.

The access token is held only in client memory. The refresh token remains an HttpOnly cookie managed
by the API; never add refresh tokens or secrets to a `NEXT_PUBLIC_` variable.
