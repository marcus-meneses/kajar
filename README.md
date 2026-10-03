# Kajar


## Configuration contract

Kajar loads deployment topology from `/app-config.js` before the application bundle. Its direct dependencies are `services.zeal.url` and `services.enhasa.url`; Blackbird generates the file from deployment values. `VITE_SERVICE_ZEAL_URL` and `VITE_SERVICE_ENHASA_URL` are development fallbacks only. Service URLs are not stored in browser storage or entered on the login form. Never place secrets in frontend configuration.

Kajar is the administration frontend for the Zeal backend. It is intended for SUP/backend operators, not tenant users. Zeal remains the authority for data validation, authorization, tenant guards, and persistence; Kajar is only the browser UI used to inspect and manage that backend state.

## What Kajar Manages

Kajar currently provides modules for:

- Dashboard: operational counts for core backend records.
- Tokens: refresh-token visibility and revocation for Zeal authentication.
- Permissions: route permission records used by Zeal.
- Customers: customers, users, employees, and customer contact relationships.
- Geography: countries, states, and cities.
- Taxonomy: species and breeds.
- Mirrors: product, service, and work-schedule mirror records.
- Fiscal categories: CNAE, NCM, NBS, CFOP, CEST, class trib, IPI, and ISSQN records.
- Tax engine: fiscal frames, frame taxes, exceptions, and tax rules.

## Runtime Dependencies

Kajar expects Zeal to be running and reachable from the browser.

Default local URLs:

- Kajar: `http://localhost:5174`
- Zeal: `http://localhost:3000`

When Kajar is opened from a remote host, it auto-selects the same hostname on port `3000` for Zeal instead of pointing the browser at `localhost`. The Zeal URL can also be edited on the login screen and is stored in local storage.

## Authentication

Kajar logs in through Zeal at `/auth/login` with `app: "kajar"`.

Stored browser keys:

- `kajar.accessToken`
- `kajar.refreshToken`
- `kajar.zealUrl`

If authentication fails or the token expires without recovery, Kajar clears local session state through the reconnect flow and asks the operator to sign in again.

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

The Vite dev server listens on all interfaces and uses port `5174` by default. If that port is busy, Vite may choose another port because `strictPort` is disabled in `vite.config.ts`.

## Configuration

Kajar can receive a default Zeal URL at build/dev time:

```bash
VITE_SERVICE_ZEAL_URL=http://localhost:3000 npm run dev
```

If `VITE_SERVICE_ZEAL_URL` is not set:

- local browser hostnames use `http://localhost:3000`;
- remote browser hostnames use `<current protocol>//<current hostname>:3000`.

## Scripts

```bash
npm run dev
```

Run the Vite development server.

```bash
npm run build
```

Type-check and build the production bundle.

```bash
npm run preview
```

Serve the built bundle with Vite preview.

```bash
npm run typecheck
```

Run TypeScript project checks without emitting files.

```bash
npm test
```

Compile testable utility modules and run the Node-based logic tests.

## Source Structure

Kajar is organized by feature module:

```text
src/
  customers/
  dashboard/
  fiscalCategories/
  geography/
  mirrors/
  permissions/
  shared/
  species/
  taxEngine/
  tokens/
```

Common contracts, API access, navigation, layout primitives, and utilities live under `src/shared/`.

Important shared files:

- `src/shared/api.ts`: Zeal API client.
- `src/shared/types.ts`: frontend copies of Zeal-facing contracts.
- `src/shared/components/navigation.tsx`: topbar/sidebar module navigation.
- `src/shared/components/AdminPrimitives.tsx`: reusable admin UI primitives.

More structure notes are in `docs/structure.md`.

## Adding A Module

1. Create `src/<module>/index.tsx`.
2. Put module-only components under `src/<module>/components/`.
3. Add API methods to `src/shared/api.ts`.
4. Add or extend contracts in `src/shared/types.ts`.
5. Add the module key and label in `src/shared/components/navigation.tsx`.
6. Render the module from `src/main.tsx`.
7. Add lightweight tests when logic can be tested outside the browser.
8. Run `npm test` and `npm run build`.

## Operational Notes

- Kajar assumes privileged access. ZEAL must still enforce SUP-only routes server-side.
- Token management deletes/revokes refresh-token records. Access tokens are JWTs and expire naturally.
- Single active session behavior is app-scoped by Zeal/Enhasa. A new Kajar login for the same user invalidates previous Kajar refresh sessions for that user.
- Kajar does not replace deployment bootstrap/reset scripts. Database bootstrap and seed operations belong to Zeal/Enhasa scripts.

## Troubleshooting

If login works locally but fails remotely, check the Zeal URL on the login screen. A remote browser cannot call `localhost:3000` on the server; it must call the server hostname or IP.

If API calls return `Route not found`, confirm that the Zeal server version includes the required route and that Kajar is pointed at that Zeal instance.

If requests fail with CORS, confirm Zeal allows the Kajar origin, usually `http://<host>:5174` in development.

### Environment files

Local configuration uses ignored mode files: `.env.development`, `.env.test`, and `.env.production`. Select the mode with `APP_ENV` (or `NODE_ENV` as a fallback). Resolution priority is process environment, `.env.<mode>.local`, `.env.local`, `.env.<mode>`, then legacy `.env`. `.env.example` documents keys only and is never loaded. Real mode files must not be committed.
