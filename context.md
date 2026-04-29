Project context

Stack decisions

- Frontend: React
- Content/catalog: [`dataset.md`](./dataset.md) (authoring) → [`src/data/products.json`](./src/data/products.json) (app); replace with a CMS when ready (see [flow-map.md](./flow-map.md))
- Checkout model: Guest only (no account requirement)

Product detail

- Product cards open a plain native `<dialog>` with a cloned card.
- The original grid card is hidden while the dialog is open and restored on close.
- No animation library is currently used for card/detail transitions.

Payments

- Provider: Stripe
- Integration: Payment Intents + Elements (or Checkout Sessions with ui_mode: "custom")
- Requirement: checkout stays on-site and is fully customizable
