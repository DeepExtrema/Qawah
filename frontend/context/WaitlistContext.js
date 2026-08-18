"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiError, apiFetch } from "../lib/api";
import { useAuth } from "./AuthContext";
import { addJoined, hasJoined, removeJoined, waitlistKey } from "../lib/waitlist";

const WaitlistContext = createContext();

/*
 * The browser keeps its own copy of what it has joined. A guest has no account
 * to read the list back from, so without this the button would forget the
 * signup on the next page load.
 */
const STORAGE_KEY = "qahwa_waitlist";

function readStored() {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((entry) => entry?.productKey) : [];
  } catch {
    return [];
  }
}

function writeStored(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* private mode or a full quota - the session still works in memory */
  }
}

export function WaitlistProvider({ children }) {
  const { user, loaded: authLoaded } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [pendingKey, setPendingKey] = useState("");

  useEffect(() => {
    if (!authLoaded) return;
    let cancelled = false;

    async function load() {
      const local = readStored();
      if (!cancelled) setEntries(local);

      if (user) {
        try {
          const { response, data } = await apiFetch("/api/waitlist");
          if (!cancelled && response.ok && Array.isArray(data.data)) {
            const merged = data.data.reduce(
              (acc, row) => addJoined(acc, row),
              local
            );
            setEntries(merged);
            writeStored(merged);
          }
        } catch {
          /* offline API: the local record still drives the button */
        }
      }

      if (!cancelled) setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoaded, user]);

  function persist(update) {
    setEntries((current) => {
      const next = update(current);
      writeStored(next);
      return next;
    });
  }

  function has(product) {
    return hasJoined(entries, product);
  }

  function isPending(product) {
    const key = waitlistKey(product);
    return Boolean(key) && pendingKey === key;
  }

  /* The address a given lot was joined with, so leaving can identify a guest. */
  function emailFor(product) {
    const key = waitlistKey(product);
    const hit = entries.find((entry) => entry.productKey === key);
    return hit?.email || user?.email || "";
  }

  /* Returns { ok, error } so each button can show its own failure, rather
     than one shared message lighting up every card on the page. */
  async function join(product, email) {
    const key = waitlistKey(product);
    if (!key) return { ok: false, error: "This lot cannot be waitlisted." };

    const address = String(email || user?.email || "").trim();
    if (!address) {
      return { ok: false, error: "Enter an email so we can reach you." };
    }

    setPendingKey(key);
    try {
      const { response, data } = await apiFetch("/api/waitlist", {
        method: "POST",
        body: JSON.stringify({
          productKey: key,
          productName: product.name || "",
          email: address,
        }),
      });

      if (!response.ok) {
        return { ok: false, error: apiError(data, "Could not join the waitlist.") };
      }

      persist((current) =>
        addJoined(current, { productKey: key, email: data.data?.email || address })
      );
      return { ok: true, error: "" };
    } catch {
      // Never show "on list" for a signup that did not reach the server.
      return { ok: false, error: "Waitlist is unreachable. Please try again shortly." };
    } finally {
      setPendingKey("");
    }
  }

  async function leave(product) {
    const key = waitlistKey(product);
    if (!key) return { ok: false, error: "This lot cannot be waitlisted." };

    const address = emailFor(product);
    setPendingKey(key);
    try {
      const query = address ? `?email=${encodeURIComponent(address)}` : "";
      const { response, data } = await apiFetch(`/api/waitlist/${key}${query}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return { ok: false, error: apiError(data, "Could not leave the waitlist.") };
      }

      persist((current) => removeJoined(current, product));
      return { ok: true, error: "" };
    } catch {
      return { ok: false, error: "Waitlist is unreachable. Please try again shortly." };
    } finally {
      setPendingKey("");
    }
  }

  return (
    <WaitlistContext.Provider
      value={{ entries, has, isPending, emailFor, join, leave, loaded }}
    >
      {children}
    </WaitlistContext.Provider>
  );
}

export function useWaitlist() {
  return useContext(WaitlistContext);
}
