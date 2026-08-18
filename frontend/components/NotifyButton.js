"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWaitlist } from "../context/WaitlistContext";
import { notifyLabel } from "../lib/waitlist";

/*
 * The sold-out counterpart to AddToCartButton: joins the restock waitlist.
 *
 * A signed-in customer joins in one click with the address on their account.
 * A guest gets a small inline form, because requiring an account here would
 * lose exactly the customer the waitlist exists to keep.
 */
export default function NotifyButton({
  product,
  className = "bt bt-sm",
  variant = "card",
}) {
  const { user } = useAuth();
  const { has, isPending, join, leave, loaded } = useWaitlist();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const inputRef = useRef(null);

  const joined = has(product);
  const pending = isPending(product);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!product) return null;

  async function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    setError("");

    if (joined) {
      const result = await leave(product);
      if (!result.ok) setError(result.error);
      else setConfirmed(false);
      return;
    }

    if (!user) {
      setOpen((current) => !current);
      return;
    }

    const result = await join(product);
    if (result.ok) setConfirmed(true);
    else setError(result.error);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    setError("");

    const result = await join(product, email);
    if (result.ok) {
      setOpen(false);
      setEmail("");
      setConfirmed(true);
    } else {
      setError(result.error);
    }
  }

  return (
    <span className={`notify notify-${variant}`}>
      <button
        type="button"
        className={`${className} ${joined ? "is-on" : ""}`.trim()}
        // `loaded` gates only the first paint, so the button is never
        // permanently disabled the way the old placeholder was.
        disabled={!loaded || pending}
        aria-pressed={joined}
        aria-expanded={open || undefined}
        aria-label={
          joined
            ? `Leave the waitlist for ${product.name}`
            : `Email me when ${product.name} is back`
        }
        onClick={handleClick}
      >
        {notifyLabel({ joined, pending })}
      </button>

      {open && !joined && (
        <form
          className="notify-form b"
          onSubmit={handleSubmit}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          <label className="cp" htmlFor={`notify-email-${product._id}`}>
            EMAIL ME WHEN IT IS ROASTED
          </label>
          <input
            id={`notify-email-${product._id}`}
            ref={inputRef}
            className="input"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <div className="notify-actions">
            <button type="submit" className="bt bt-sm bp" disabled={pending}>
              {pending ? "Joining…" : "Join"}
            </button>
            <button
              type="button"
              className="bt bt-sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {confirmed && !error && (
        <span className="cp notify-note" role="status">
          ON THE LIST · WE WILL EMAIL YOU
        </span>
      )}
      {error && (
        <span className="field-error notify-note" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
