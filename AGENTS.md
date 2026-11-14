<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- All data reads/writes go through the browser Supabase client with RLS (no server functions needed); orders only via RPC so the server computes price and stock.
- Global UI state (cart, auth, modals, search) lives in context providers in `src/lib/` mounted once in `__root.tsx`; dialogs are rendered once there and opened via `useUI()`.
- Supabase queries are defined as `queryOptions` in `src/lib/queries.ts` so cache keys stay consistent for invalidation.
- Pure business rules (sorting, stock clamping, validation) stay in plain functions covered by `src/test/store-rules.test.ts`.
- Admin product CRUD lives in `src/lib/admin-products.ts` (photos uploaded first, then variants/images/categories synced by id diff from `src/lib/product-form.ts`) because the frozen schema has no transactional product RPC.
