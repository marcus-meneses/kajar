# Kajar Source Structure

Kajar is organized by feature module plus a shared area.

## Folders

- `src/<module>/index.tsx`: main exported module view.
- `src/<module>/components/`: components used only by that module.
- `src/shared/`: shared API client, domain types, layout components, and utilities.
- `src/shared/components/`: reusable visual/layout components.
- `src/shared/utils/`: framework-light utility functions.

Current modules:

- `dashboard`
- `customers`
- `fiscalCategories`
- `geography`
- `mirrors`
- `permissions`
- `species`
- `taxEngine`

## Guidelines

1. Add new backend administration areas as `src/<module>/index.tsx`.
2. Keep module-only components under `src/<module>/components/`.
3. Move code to `src/shared/` only when it is used by more than one module or is clearly cross-cutting.
4. Export shared code from `src/shared/index.ts` so imports stay stable.
5. Keep API calls in `src/shared/api.ts` and shared domain contracts in `src/shared/types.ts`.
6. Add lightweight tests for shared utilities and any module helpers that can be tested without a browser runtime.
7. Run `npm test` and `npm run build` before shipping changes.
