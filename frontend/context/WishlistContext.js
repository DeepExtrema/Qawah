"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiError, apiFetch } from "../lib/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user, loaded: authLoaded } = useAuth();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    if (!user) {
      setItems([]);
      setLoaded(true);
      return;
    }
    try {
      const { response, data } = await apiFetch("/api/wishlist");
      if (response.ok) {
        setItems(data.data || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    if (!authLoaded) return;
    refresh();
  }, [authLoaded, user?.id, user?._id]);

  function has(productId) {
    return items.some(
      (item) => String(item.productId) === String(productId) || String(item.product?._id) === String(productId)
    );
  }

  async function toggle(product) {
    if (!user) {
      setMessage("Log in to save lots.");
      return;
    }
    setMessage("");
    const on = has(product._id);
    try {
      if (on) {
        await apiFetch(`/api/wishlist/${product._id}`, { method: "DELETE" });
        setItems((current) =>
          current.filter(
            (item) =>
              String(item.productId) !== String(product._id) &&
              String(item.product?._id) !== String(product._id)
          )
        );
      } else {
        const { response, data } = await apiFetch("/api/wishlist", {
          method: "POST",
          body: JSON.stringify({ productId: product._id }),
        });
        if (!response.ok) {
          setMessage(apiError(data, "Could not save lot."));
          return;
        }
        setItems((current) => [
          { id: data.data?._id, productId: product._id, product },
          ...current.filter((item) => String(item.productId) !== String(product._id)),
        ]);
      }
    } catch {
      setMessage("Unable to update wishlist.");
    }
  }

  return (
    <WishlistContext.Provider
      value={{ items, has, toggle, loaded, refresh, message }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
