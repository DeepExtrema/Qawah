# QAHWA SUPPLY

A full-stack specialty-coffee storefront: a Next.js frontend, an Express REST API, and MongoDB.

The store sells single-origin coffee lots and brewing gear. Customers browse the catalogue,
review coffees they have actually bought, save favourites, apply discount codes, and check out
as a guest or a registered account. Administrators run the shop from the browser — inventory,
categories, discounts, product images, and an audit trail — without touching source code.

**This repository targets Tier 3.** Every Tier 3 requirement is mapped to the file that
implements it in [Tier 3 requirement map](#tier-3-requirement-map) below.

---

## Table of contents

- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Testing](#testing)
- [Tier 3 requirement map](#tier-3-requirement-map)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Payments](#payments)
- [Image uploads](#image-uploads)
- [Security notes](#security-notes)
- [Tier 3 user stories](#tier-3-user-stories)

---

## Quick start

Requires **Node.js 20+** and a MongoDB database (local `mongod` or a free MongoDB Atlas cluster).

### 1. Clone and configure

```bash
git clone https://github.com/DeepExtrema/Qawah.git
cd Qawah
```

Create the backend environment file from the template and fill in `MONGO_URI` and `JWT_SECRET`:

```bash
cp backend/.env.example backend/.env
```

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The frontend works with no configuration at all (it defaults to `http://localhost:5001`).
If your API runs elsewhere, `cp frontend/.env.example frontend/.env.local` and edit it.

### 2. Start the backend

```bash
cd backend && npm install && npm run seed && npm start
```

`npm run seed` loads the product catalogue and creates one customer and one admin account.
It prints those credentials to `backend/.seed-credentials.txt`, which is git-ignored.

The API listens on <http://localhost:5001>. Confirm it with <http://localhost:5001/api/health>.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend && npm install && npm run dev
```

The store opens at <http://localhost:3000>.

> **Admin access:** log in with the admin account from `backend/.seed-credentials.txt`, then use
> the admin bar. To promote another user, change their `role` to `admin` in MongoDB and have them
> log out and back in so a fresh JWT is issued with the new role.

---

## Environment variables

No secret is ever committed. `backend/.env` and `frontend/.env.local` are git-ignored; only the
`.env.example` templates are tracked. The server **refuses to start** if a required variable is
missing, rather than failing later with a confusing 500 — see [`backend/server.js`](backend/server.js).

### `backend/.env`

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MONGO_URI` | **yes** | — | MongoDB connection string. |
| `JWT_SECRET` | **yes** | — | Signs and verifies JWTs. Use a long random string. |
| `PORT` | no | `5001` | Port the API listens on. |
| `CLIENT_ORIGIN` | no | `http://localhost:3000` | Origin allowed through CORS. |
| `PUBLIC_API_URL` | no | `http://localhost:{PORT}` | Public origin of the API. Uploaded image URLs are built from it, so set it when deploying. |
| `STRIPE_SECRET_KEY` | no | _(blank)_ | Optional Stripe **test** key. Blank uses the built-in sandbox gateway. |

### `frontend/.env.local`

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | no | `http://localhost:5001` | Origin of the Express API. Not a secret — it is a public URL. Inlined at build time, so rebuild after changing. |

All environment reads are centralised in [`backend/utils/config.js`](backend/utils/config.js) and
[`frontend/lib/api.js`](frontend/lib/api.js), so no host name is hard-coded at any call site.

---

## Testing

```bash
cd backend  && npm test    # 21 tests
cd frontend && npm test    #  7 tests
```

Both suites use the built-in **`node --test`** runner — no test framework to install, and they
run on a clean clone with **no database and no network**. Test files are discovered automatically.

### What is tested, and why

| Test file | What it verifies | Why it matters |
| --- | --- | --- |
| [`backend/tests/orderTotals.test.js`](backend/tests/orderTotals.test.js) | Totals are summed from server-side prices; a `clientPrice` field sent by the browser is ignored. | This is the money path. A customer must not be able to set their own price by editing the request. |
| ″ | Percentage and fixed discounts apply correctly, and an amount-off is capped at the subtotal. | Stops a large fixed discount from producing a negative order total. |
| ″ | Each shipping option adds its correct cost. | Shipping is a priced line item, not a display label. |
| ″ | Cancellation is allowed only for `Processing`/`Paid` orders inside a 2-hour window. | Encodes the cancellation business rule so it cannot drift. |
| ″ | `roundMoney` rounds to whole cents. | Floating-point arithmetic must never produce fractional cents. |
| [`backend/tests/payments.test.js`](backend/tests/payments.test.js) | `dollarsToCents` rounds rather than truncates (`21.005 → 2101`). | Truncation silently loses money on every transaction. |
| ″ | The provider is `sandbox` with no key and `stripe` once `STRIPE_SECRET_KEY` is set. | Proves the app never needs live credentials to run. |
| ″ | A successful sandbox charge marks the order paid and records a payment reference. | The success path of checkout. |
| ″ | A decline sets `paymentStatus: "failed"`, returns `PAYMENT_DECLINED`, and leaves the order retryable. | The customer gets clear feedback and does not lose their order. |
| ″ | Charging an already-paid order returns early **without a second write**. | Prevents a double-click from double-charging. |
| ″ | A cancelled order cannot be charged. | Cancelled orders are terminal. |
| ″ | Calling the Stripe path with no key returns a clean `503`, not a crash. | An unconfigured optional integration must degrade, not take down the server. |
| [`backend/tests/validate.test.js`](backend/tests/validate.test.js) | Emails and discount codes are normalised; ratings outside 1–5 are rejected; object IDs and slugs are validated. | Validation is the boundary between untrusted input and the database. |
| [`frontend/lib/lowStock.test.mjs`](frontend/lib/lowStock.test.mjs) | `isLowStock` flags 1–8 only; 0 (sold out) and 9+ are excluded; missing/unparseable values never warn. | Off-by-one errors here show a false "almost gone" badge and mislead customers. |
| ″ | `lowStockLabel` uses singular copy for one bag and returns `null` when no badge should render. | Returning `null` lets the component skip the element entirely instead of rendering an empty node. |

**How the payment tests avoid a database:** `chargeSandbox` only ever calls `order.save()`, so the
tests pass a plain object with a `save()` method in place of a Mongoose document. No mocking
library, no in-memory MongoDB, no connection string — the suite runs anywhere.

---

## Tier 3 requirement map

Every requirement, and the file that implements it.

### Advanced customer features

| Feature | Backend | Frontend |
| --- | --- | --- |
| Product reviews and ratings | [`routes/reviewRoutes.js`](backend/routes/reviewRoutes.js), [`models/Review.js`](backend/models/Review.js) | [`app/products/[id]/page.js`](frontend/app/products/[id]/page.js) |
| Wishlist / favourites | [`routes/wishlistRoutes.js`](backend/routes/wishlistRoutes.js) | [`app/wishlist/page.js`](frontend/app/wishlist/page.js), [`components/WishlistButton.js`](frontend/components/WishlistButton.js) |
| Saved shipping addresses | [`routes/addressRoutes.js`](backend/routes/addressRoutes.js) | [`app/account/page.js`](frontend/app/account/page.js) |
| Recently viewed products | [`routes/recentRoutes.js`](backend/routes/recentRoutes.js) | [`components/RecentlyViewed.js`](frontend/components/RecentlyViewed.js) |
| Product recommendations | `GET /api/products/:id/recommendations` | [`app/products/[id]/page.js`](frontend/app/products/[id]/page.js) |
| Discount codes | [`services/DiscountService.js`](backend/services/DiscountService.js) | [`app/checkout/page.js`](frontend/app/checkout/page.js) |
| Multiple shipping options | [`services/orderTotals.js`](backend/services/orderTotals.js) | [`app/checkout/page.js`](frontend/app/checkout/page.js) |
| Guest checkout | [`middleware/optionalAuth.js`](backend/middleware/optionalAuth.js) | [`app/checkout/page.js`](frontend/app/checkout/page.js) |
| Saved carts | [`routes/cartRoutes.js`](backend/routes/cartRoutes.js), [`models/SavedCart.js`](backend/models/SavedCart.js) | [`context/CartContext.js`](frontend/context/CartContext.js) |
| Low-stock warnings | [`utils/validate.js`](backend/utils/validate.js) (`isLowStock`) | [`lib/lowStock.mjs`](frontend/lib/lowStock.mjs), [`components/LowStockBadge.js`](frontend/components/LowStockBadge.js) |
| Email-style order confirmation | `GET /api/orders/:id/confirmation` | [`app/orders/confirmation/[id]/page.js`](frontend/app/orders/confirmation/[id]/page.js) |
| Order cancellation rules | `canCancelOrder` in [`services/orderTotals.js`](backend/services/orderTotals.js) | [`app/orders/confirmation/[id]/page.js`](frontend/app/orders/confirmation/[id]/page.js) |

### Advanced administrator features

| Feature | Backend | Frontend |
| --- | --- | --- |
| Sales dashboard, revenue, order statistics | `GET /api/admin/stats` — MongoDB aggregation | [`app/admin/page.js`](frontend/app/admin/page.js) |
| Low-inventory alerts | `GET /api/admin/stats` (`lowInventory`) | [`app/admin/page.js`](frontend/app/admin/page.js) |
| Category management | `/api/admin/categories` (CRUD) | [`app/admin/categories/page.js`](frontend/app/admin/categories/page.js) |
| Customer management | `GET /api/admin/customers` | [`app/admin/customers/page.js`](frontend/app/admin/customers/page.js) |
| Discount-code management | `/api/admin/discounts` (CRUD) | [`app/admin/discounts/page.js`](frontend/app/admin/discounts/page.js) |
| Product-image management | `POST /api/admin/products/:id/image` | [`app/admin/products/page.js`](frontend/app/admin/products/page.js) |
| Bulk product updates | `POST /api/admin/products/bulk` | [`app/admin/inventory/page.js`](frontend/app/admin/inventory/page.js) |
| Inventory history | [`services/InventoryService.js`](backend/services/InventoryService.js), [`models/InventoryEvent.js`](backend/models/InventoryEvent.js) | [`app/admin/inventory/page.js`](frontend/app/admin/inventory/page.js) |
| Audit log | [`middleware/audit.js`](backend/middleware/audit.js), [`models/AuditLog.js`](backend/models/AuditLog.js) | [`app/admin/audit/page.js`](frontend/app/admin/audit/page.js) |

### Payment integration

| Requirement | Where |
| --- | --- |
| Test / sandbox environment only | Sandbox gateway by default; Stripe accepts a `sk_test_` key. [`services/PaymentService.js`](backend/services/PaymentService.js) |
| Never store card numbers | No card field exists in any schema. Only a `paymentIntentId` reference is stored. |
| Handle successful payments | `chargeSandbox` / `confirmStripePayment` |
| Handle declined or failed payments | `PAYMENT_DECLINED` → order set to `failed` and remains retryable |
| Never trust frontend prices | `OrderService.buildPricedItems` re-reads every price from the database |
| Verify totals on the backend | `computeTotals`; Stripe confirmation re-checks `amount_received` against the stored total |

### Technical quality

| Requirement | Where |
| --- | --- |
| Organised service layers | [`backend/services/`](backend/services) — `OrderService`, `PaymentService`, `InventoryService`, `DiscountService`, `ProductService` |
| Reusable frontend components | [`frontend/components/`](frontend/components) — `ProductImage`, `LowStockBadge`, `WishlistButton`, `AddToCartButton`, `Header`, `Footer` |
| Reusable backend logic | [`utils/validate.js`](backend/utils/validate.js), [`utils/asyncHandler.js`](backend/utils/asyncHandler.js), [`utils/config.js`](backend/utils/config.js) |
| Centralised error handling | [`middleware/errorHandler.js`](backend/middleware/errorHandler.js) — one handler; 5xx details are logged, never leaked to the client |
| Data validation | [`utils/validate.js`](backend/utils/validate.js), applied at every route boundary |
| Secure environment variables | [`utils/config.js`](backend/utils/config.js) + fail-fast startup check |
| Consistent API responses | Every endpoint returns `{ data }` on success and `{ error: { message, code } }` on failure |
| Thoughtful database design | Order line items embedded (immutable at purchase time); everything else referenced |
| Optimised queries | Compound indexes on `Review`, `WishlistItem`, `RecentlyViewed`, `SavedCart`, `AuditLog`; `.lean()` on read-only paths; aggregation for stats |
| Accessible forms | Every input is associated with a label — `htmlFor` where the control is separate, a wrapping `<label>` for checkboxes and file pickers; errors announced in text, not colour alone |
| Strong responsive design | Fluid grids in [`app/globals.css`](frontend/app/globals.css) |
| Client vs server components | Server components by default; `"use client"` only where state or effects are needed |

---

## Architecture

```text
┌──────────────────────┐   HTTP/JSON    ┌──────────────────────┐   Mongoose   ┌──────────┐
│   Next.js frontend   │ ─────────────► │   Express REST API   │ ───────────► │ MongoDB  │
│                      │                │                      │              │          │
│  app/      routes    │                │  routes/   HTTP+auth │              └──────────┘
│  components/ UI      │                │  services/ business  │
│  context/  state     │                │  models/   schema    │
│  lib/api.js  fetch   │ ◄───────────── │  middleware/ cross-  │
└──────────────────────┘  { data } |    │              cutting │
                          { error }     └──────────────────────┘
```

**The layering rule:** routes handle HTTP and authorisation, services hold business rules, models
define schema. Pricing lives in `services/orderTotals.js` — a dependency-free module, which is
why the money rules are directly unit-testable without a database.

### Request lifecycle

```text
Request
  → CORS (CLIENT_ORIGIN only)
  → express.json()
  → protect / adminOnly / optionalAuth      (authentication)
  → validate.js                             (input validation, throws AppError)
  → service layer                           (business rules)
  → model / MongoDB
  → res.json({ data })
  ↳ any thrown error → asyncHandler → errorHandler → { error: { message, code } }
```

Route handlers never contain `try/catch`. [`asyncHandler`](backend/utils/asyncHandler.js) wraps
each one so a rejected promise reaches the central error handler, which decides the status code
and — critically — replaces 5xx messages with a generic string so internal details never leak.

---

## Project structure

```text
Qawah/
├── backend/
│   ├── middleware/
│   │   ├── adminMiddleware.js      # admin-only guard
│   │   ├── audit.js                # writes AuditLog entries
│   │   ├── authMiddleware.js       # JWT verification (required)
│   │   ├── errorHandler.js         # single centralised error handler
│   │   └── optionalAuth.js         # attaches user if present — enables guest checkout
│   ├── models/                     # 12 Mongoose schemas
│   ├── routes/                     # HTTP layer, one file per resource
│   ├── services/                   # business logic
│   │   ├── DiscountService.js
│   │   ├── InventoryService.js
│   │   ├── OrderService.js
│   │   ├── PaymentService.js
│   │   ├── ProductService.js
│   │   └── orderTotals.js          # pure pricing — no DB, fully unit-tested
│   ├── tests/                      # node --test suites
│   ├── utils/
│   │   ├── AppError.js             # error + HTTP status + machine-readable code
│   │   ├── asyncHandler.js         # forwards async errors to the handler
│   │   ├── config.js               # every process.env read lives here
│   │   └── validate.js             # shared validators
│   ├── public/products/            # uploaded and seeded product images
│   ├── .env.example                # template — copy to .env
│   ├── seed.js                     # catalogue + demo accounts
│   └── server.js                   # app wiring, fail-fast config check
│
├── frontend/
│   ├── app/
│   │   ├── admin/                  # dashboard, products, inventory, categories,
│   │   │                           #   discounts, customers, audit
│   │   ├── account/  cart/  checkout/  coffee/  gear/  learn/
│   │   ├── orders/                 # history, detail, confirmation
│   │   ├── products/[id]/  wishlist/  subscribe/  wholesale/
│   │   ├── globals.css
│   │   └── layout.js
│   ├── components/                 # reusable UI
│   ├── context/                    # Auth, Cart, Wishlist providers
│   ├── lib/
│   │   ├── api.js                  # API origin + apiFetch + auth headers
│   │   ├── lots.js                 # catalogue helpers
│   │   └── lowStock.mjs            # low-stock rules (unit-tested)
│   └── .env.example
│
├── .gitignore
├── README.md
└── TIER3.md                        # requirement checklist
```

---

## API reference

All responses are JSON. Success is `{ "data": ... }` (some also include `message`).
Failure is `{ "error": { "message": "...", "code": "..." } }`.

Auth legend — **—** public · **A** authenticated · **G** guest-capable (token or email) · **ADM** admin only.

### Authentication — `/api/auth`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/register` | — | Create an account |
| `POST` | `/login` | — | Obtain a JWT |
| `GET` | `/me` | A | Current profile |
| `PUT` | `/me` | A | Update profile |

### Products — `/api/products`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | — | List products |
| `GET` | `/:id` | — | Product detail |
| `GET` | `/:id/reviews` | — | Reviews for a product |
| `GET` | `/:id/recommendations` | — | Related products |
| `POST` | `/` | ADM | Create |
| `PUT` | `/:id` | ADM | Update |
| `DELETE` | `/:id` | ADM | Delete |

### Orders — `/api/orders`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/` | G | Place an order — priced entirely on the server |
| `GET` | `/my-orders` | A | Signed-in customer's history |
| `GET` | `/:id` | G | Order detail |
| `GET` | `/:id/confirmation` | G | Email-style confirmation |
| `POST` | `/:id/cancel` | G | Cancel, subject to the 2-hour rule |
| `GET` | `/` | ADM | All orders |
| `PATCH` | `/:id/status` | ADM | Update status |

### Payments — `/api/payments`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/config` | — | Active provider (`sandbox` or `stripe`) |
| `POST` | `/sandbox` | G | Sandbox charge — `outcome: "success" \| "decline"` |
| `POST` | `/intent` | G | Create a Stripe PaymentIntent |
| `POST` | `/confirm` | G | Verify a Stripe payment server-side |

### Customer features

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` `POST` `DELETE` | `/api/wishlist`, `/api/wishlist/:productId` | A | Wishlist |
| `GET` `POST` `PUT` `DELETE` | `/api/addresses`, `/api/addresses/:id` | A | Saved addresses |
| `GET` `PUT` | `/api/cart` | G | Saved cart |
| `GET` `POST` | `/api/recent` | G | Recently viewed |
| `POST` | `/api/discounts/validate` | G | Validate a discount code |
| `GET` | `/api/shipping-options` | — | Shipping methods and prices |
| `GET` | `/api/reviews/eligible/:productId` | A | May this customer review it? |
| `POST` | `/api/reviews` | A | Submit a review |

### Admin — `/api/admin` *(all **ADM**)*

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/stats` | Revenue, order counts by status, low inventory |
| `GET` | `/customers` | All customers (passwords excluded) |
| `GET` `POST` `PUT` `DELETE` | `/categories`, `/categories/:id` | Category management |
| `GET` `POST` `PUT` `DELETE` | `/discounts`, `/discounts/:id` | Discount management |
| `POST` | `/products/bulk` | Bulk inventory update |
| `POST` | `/products/:id/image` | Upload a product image |
| `GET` | `/inventory` | Inventory event history |
| `GET` | `/audit` | Audit log |

---

## Data model

Twelve collections. Order line items are **embedded**; everything else is **referenced**.

| Model | Key fields | Notes |
| --- | --- | --- |
| `User` | `name`, `email` (unique), `password`, `role` | Password is a bcrypt hash. |
| `Product` | `name`, `slug`, `price`, `category`, `inventory`, `imageUrl`, plus coffee attributes (`roast`, `origin`, `process`, `altitude`, `varietal`, `agtron`, `score`) | `soldOut` is distinct from `inventory: 0`. |
| `Order` | `items[]`, `subtotal`, `discountAmount`, `shippingCost`, `tax`, `totalPrice`, `status`, `paymentStatus`, `paymentIntentId`, `confirmationToken` | Every money field is stored, not recomputed on read. |
| `Review` | `userId`, `productId`, `orderId`, `rating`, `body` | Unique on `(userId, productId)`. |
| `WishlistItem` | `userId`, `productId` | Unique compound index. |
| `Address` | `userId`, `line1`, `city`, `region`, `postal`, `country`, `isDefault` | |
| `RecentlyViewed` | `userId` **or** `sessionId`, `productId`, `viewedAt` | `sessionId` supports guests. |
| `SavedCart` | `userId` **or** `sessionId`, `items[]` | Survives sign-in. |
| `DiscountCode` | `code` (unique), `percent`, `amountOff`, `minSubtotal`, `expiresAt`, `maxUses`, `usageCount` | `usageCount` increments only once payment clears. |
| `Category` | `name`, `slug` (unique) | |
| `InventoryEvent` | `productId`, `delta`, `reason`, `orderId`, `userId` | Append-only history. |
| `AuditLog` | `actorId`, `action`, `entity`, `entityId`, `meta` | Append-only; indexed on `createdAt` and `(entity, entityId)`. |

**Why order items are embedded.** A line item is a record of what was bought at the price paid.
Referencing the live product would rewrite order history every time a price changed. Embedding
freezes `name`, `price`, `grind`, and `size` at purchase time.

**Why inventory is an event log.** `InventoryEvent` records every `delta` with a reason, so stock
level is auditable rather than just a number that changed. Cancelling an order writes a
compensating `restock` event instead of silently incrementing the count.

---

## Payments

**No card number ever reaches this server, and no schema has a field to store one.**

Two providers sit behind one interface in
[`services/PaymentService.js`](backend/services/PaymentService.js):

**Sandbox gateway (default).** Runs with no external account and no keys. The checkout page offers
an explicit *test success* and *test decline* button, so both the happy path and the failure path
are demonstrable. A decline sets `paymentStatus: "failed"` and leaves the order intact so the
customer can retry.

**Stripe adapter (optional).** Set `STRIPE_SECRET_KEY` to a `sk_test_` key and the API exposes
PaymentIntents. Card details go from the browser directly to Stripe; the server only ever handles
an intent id.

### How the totals are protected

The rule is that the client is never trusted with a price:

1. `OrderService.buildPricedItems` throws away any price the browser sent and re-reads
   `product.price` from the database for every line.
2. `computeTotals` derives subtotal, discount, shipping, and total from those server-side prices.
3. The charged amount is taken from the stored `order.totalPrice`, never from the request.
4. On Stripe confirmation, the intent is re-fetched from Stripe and three things are checked
   independently: it belongs to this order, its status is `succeeded`, and `amount_received`
   equals the stored total. A client claiming "paid" is never sufficient.

A discount's `usageCount` increments only after payment clears, so an abandoned checkout cannot
burn a limited-use code.

---

## Image uploads

`POST /api/admin/products/:id/image` — admin only, handled by `multer` in
[`routes/adminRoutes.js`](backend/routes/adminRoutes.js).

- **Type restriction:** PNG, JPEG, and WEBP only, rejected at the `fileFilter` stage.
- **Size restriction:** 5 MB, enforced by multer's `limits`.
- **Useful errors:** an oversized file returns `FILE_TOO_LARGE` with *"Image must be 5 MB or
  smaller."*; a wrong type returns `INVALID_IMAGE`; no file at all returns `NO_FILE`.
- **Stored as a URL:** the file is written to `backend/public/products/<slug>.<ext>` and the
  product's `imageUrl` is built from `PUBLIC_API_URL`, so the stored URL follows the deployment
  rather than pointing at `localhost`.
- **No credentials exposed:** files are served by the app's own static middleware, so no storage
  keys exist to leak.

---

## Security notes

- Passwords are hashed with **bcrypt**; the hash is never returned by any endpoint
  (`/api/admin/customers` explicitly selects `-password`).
- **JWT** authentication, with `adminOnly` layered on top for every admin route.
- Customers can only read their own orders. Guests use a random 24-byte `confirmationToken` or
  their order email — see `OrderService.canViewOrder`.
- The `confirmationToken` is stripped from API responses unless the order was just created
  (`publicOrder({ includeToken })`).
- **CORS** is restricted to `CLIENT_ORIGIN`.
- Every `:id` is validated as a 24-character hex ObjectId before it reaches a query.
- 5xx errors log a full stack trace **server-side** but return a generic message to the client.
- Secrets live only in git-ignored `.env` files; the server refuses to boot without them.

---

## Tier 3 user stories

### Customer

| Story | How it is satisfied |
| --- | --- |
| I can review a product I purchased | `GET /api/reviews/eligible/:productId` confirms the customer has a **paid or delivered** order containing that product before the review form appears; the unique `(userId, productId)` index prevents duplicates. |
| I can save products for later | Wishlist (`/api/wishlist`) and saved carts (`/api/cart`), both surviving sign-out. |
| I receive clear feedback when checkout fails | Declines return `PAYMENT_DECLINED` with actionable text; out-of-stock returns `OUT_OF_STOCK` naming the product. |
| I can use the application on a mobile device | Fluid grids and responsive navigation throughout `globals.css`. |

### Administrator

| Story | How it is satisfied |
| --- | --- |
| I can identify products with low inventory | `GET /api/admin/stats` returns a `lowInventory` list sorted lowest-first; `LowStockBadge` warns customers too. |
| I can view useful store statistics | Revenue, paid-order count, total orders, and a breakdown by status — computed with a MongoDB aggregation. |
| I can manage products without changing source code | Full CRUD, image upload, bulk inventory edits, and category management from `/admin`. |

### Engineer

| Story | How it is satisfied |
| --- | --- |
| I can test important application behaviour | 28 tests over pricing, discounts, cancellation, payments, and validation — no database required. |
| I can identify errors through clear logs | One error handler logs `METHOD /path` plus a stack trace; every client error carries a machine-readable `code`. |
| I can understand the project's folder structure | Routes / services / models / middleware / utils, one responsibility each — see [Project structure](#project-structure). |
| I can safely configure the project using environment variables | `.env.example` templates, all reads centralised in `config.js`, and a fail-fast startup check. |

---

## Tech stack

**Frontend** — Next.js 16 (App Router), React 19, React Context, CSS
**Backend** — Node.js, Express 5, Mongoose 9, bcrypt, jsonwebtoken, multer, dotenv, stripe (optional)
**Database** — MongoDB / MongoDB Atlas
**Testing** — `node --test` (built-in)

## Author

Madiha Sultan,
Taimoor Awan,
Jeremy Liang,
Faraibe,
Fujie,
