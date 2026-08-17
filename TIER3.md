# QAHWA SUPPLY — Tier 3 checklist

Every advanced feature is a complete vertical slice (API + data + UI), not a stub.

For where each item is implemented, see the
[Tier 3 requirement map](README.md#tier-3-requirement-map) in the README.

## Customer
- [x] Product reviews and ratings (purchased lots only)
- [x] Wishlist / favorites
- [x] Saved shipping addresses
- [x] Recently viewed products
- [x] Product recommendations
- [x] Discount codes
- [x] Multiple shipping options (roast-day / standard / pickup)
- [x] Guest checkout
- [x] Saved carts
- [x] Low-stock warnings
- [x] Email-style order confirmation
- [x] Order cancellation rules

## Administrator
- [x] Sales dashboard
- [x] Revenue calculations
- [x] Order statistics
- [x] Low-inventory alerts
- [x] Category management
- [x] Customer management
- [x] Discount-code management
- [x] Product-image management (type/size limits, useful errors, store URL, no leaked credentials)
- [x] Bulk product updates
- [x] Inventory history
- [x] Audit log

## Payments
- [x] Test/sandbox only — built-in sandbox gateway by default, optional Stripe test-mode adapter
      behind `STRIPE_SECRET_KEY` (see README → Payments)
- [x] Do not store card numbers
- [x] Successful payments
- [x] Declined / failed payments with clear customer feedback
- [x] Never trust frontend prices; verify totals on the backend

## Technical quality
- [x] Organized service layers
- [x] Reusable frontend components
- [x] Reusable backend logic
- [x] Centralized error handling
- [x] Data validation
- [x] Secure environment variables
- [x] Consistent API responses
- [x] Thoughtful database design
- [x] Optimized queries
- [x] Accessible forms
- [x] Strong responsive design
- [x] Appropriate Next.js client vs server components

## Testing
- [x] Backend route / validation tests
- [x] Frontend component or utility tests
- [x] README: what was tested, why, what it verifies, how to run
