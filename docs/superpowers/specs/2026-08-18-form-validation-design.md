# Structured validation for account creation and checkout

**Date:** 2026-08-18
**Status:** Approved

## Problem

Both of the flows that *create something* — registration and checkout — accept
input the system cannot use, and neither tells the customer what is missing in
a way they can act on.

**Registration** (`frontend/app/register/page.js`) delegates all validation to
the browser: `type="email"`, `required`, `minLength={6}`. That produces one
Chrome-styled bubble at a time, only on submit, and it disappears the moment
you click elsewhere. Password rules are invisible until you break them.

Worse, `backend/routes/authRoutes.js` never checks email *format* — only
presence. The `aaaaaa` a tester can type into the email box is rejected by
Chrome, not by the API. Any client that bypasses the browser creates a junk
account with an unreachable address, and that address is what order receipts
are sent to.

**Checkout** (`frontend/app/checkout/page.js`) has the right scaffolding —
`fieldErrors` state, `aria-invalid`, `aria-describedby`, a `.field-error`
class — but `validateForm()` only tests for empty strings. A postal code of
`!!!` and an email of `aaaaaa` both pass. Errors surface only after pressing
Pay, and if the offending field has scrolled out of view the button appears to
do nothing at all. There are no cross-field rules: local pickup still demands a
full street address, State is never required for US orders, and a postal code
is never checked against the selected country.

## Design

### 1. One pure rules module

`frontend/lib/formRules.mjs`, following the existing `waitlist.mjs` /
`lowStock.mjs` convention: no React, no `fetch`, so every rule is testable with
`node --test`.

```
emailProblem(value)                        -> "" | message
emailSuggestion(value)                     -> "" | "Did you mean ...?"
passwordChecks(password, { email, name })  -> [{ id, label, ok }]
passwordProblem(password, ctx)             -> "" | message
validateRegister(form)                     -> { fields, missing, valid }
validateCheckout(form, opts)               -> { fields, missing, notes, valid }
```

`fields` is a `{ fieldName: message }` map that drives inline errors.
`missing` is an ordered `[{ field, label, message }]` list that drives the
summary block. `notes` carries non-blocking advice (typo suggestions, "pickup
means we ignore the address").

Every message names the specific defect. "Invalid email" tells somebody
nothing; "an email address needs an @ — for example name@example.com" tells
them which key they missed.

### 2. Error presentation

A summary block above the submit button, `role="alert"`, listing each
outstanding item as a button that focuses its field. Inline `.field-error`
under each input, plus `aria-invalid` and an `is-bad` border.

**Timing:** validate on **blur** for the field just left, on **submit** for
everything, and then live-as-you-type *only* for fields already flagged. This
avoids scolding someone halfway through typing their address.

On failed submit, focus moves to the first invalid field.

### 3. Rules

**Registration**
- Name: present, 2–120 characters
- Email: structural checks with a specific message per defect; a non-blocking
  "did you mean gmail.com?" hint for common domain typos
- Password: minimum 8 characters, not one of the commonly guessed passwords
  (including `aaaaaaaa`, `12345678`, `password123`), and must not repeat the
  name or email local-part. Shown as a live checklist, not just an error.
- Confirm password: present and identical

**Checkout**
- Email and name as above
- Country becomes a `<select>` (it was free text, which made postal rules
  unenforceable) and moves *above* the address fields, since it determines them
- Postal code validated per country: US `12345`/`12345-6789`, CA `M5V 2T6`,
  GB `SW1A 1AA`, NL `1012 AB`, IE Eircode, PK/DE/FR/SA 5-digit, AU 4-digit.
  UAE has no postal system, so the field is optional there. Unknown countries
  get a loose length check.
- Region required only where it is part of the address: US (State), CA
  (Province), AU (State)
- **Incompatible-input case:** when a postal code unambiguously matches a
  different country's format, say so — "That looks like a Canadian postal code,
  but the country is set to United States." Ambiguous shapes (any 5 digits) are
  never guessed at.
- **Incompatible-input case:** local pickup drops the address requirement
  entirely and shows a note rather than an error if an address is present.
- Empty bag is reported in the summary alongside everything else.

### 4. The server mirrors the client

The browser is not a security boundary, so `backend/utils/validate.js` gains
`requireName`, `requirePassword` and `requirePostal(country)`, and
`AppError` gains an optional `fields` map that `errorHandler` passes through as
`error.fields`. `authRoutes.js` is rewritten to collect *all* problems and
return them at once, keyed by field, so the page pins each one to the right
input instead of showing a single sentence.

Login stays deliberately vague ("Invalid email or password"). Telling an
attacker which half was wrong turns the form into an account-enumeration
oracle.

`frontend/lib/api.js` gains `apiFieldErrors(data)` to read that map.

### 5. Tests

`frontend/lib/formRules.test.mjs` covers each rule and every cross-field case.
`backend/tests/validate.test.js` gains cases for the new server helpers.
Both run under the existing `npm test` (`node --test`) in each package.

### 6. The press that never lands (found during verification)

Adding on-blur validation introduced a bug that had to be designed around, and it
is worth recording because any future inline feedback will hit it again.

Blurring a field inserts that field's error message into the layout, pushing
everything below it down. When the blur is caused by pressing the submit button,
that insertion happens *between* pointerdown and pointerup. Measured on the
register form: the button's top moved from 612px to 632px mid-press. `mousedown`
landed on the button, `mouseup` landed on the form, and the browser fired `click`
on their nearest common ancestor -- the form -- so the button's handler never
ran. Pressing Register did nothing at all.

Two changes fix it:

- A `useRef` flag set on the submit button's `pointerdown`, which fires before
  `blur`, suppresses blur-driven error rendering for the duration of the press.
  It is a ref and not state precisely because setting state would re-render and
  cause the shift it exists to prevent.
- The handler is wired to the button's `onClick` as well as the form's
  `onSubmit`. Implicit submission (Enter inside a field) is specified to fire a
  click on the default submit button, so the button handler covers the keyboard
  path too; `preventDefault` there cancels the submission, so `onSubmit` does not
  fire afterwards and nothing runs twice.

## Out of scope

Address autocomplete, real deliverability checks (MX lookup), rate limiting on
registration, and password breach-database lookups. Each is worth doing; none
is needed to tell a customer what is missing.
