"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";

const CartContext = createContext();

function snapshot(cart) {
  return cart.map((item) => ({
    productId: item._id,
    quantity: item.quantity,
    grind: item.grind || "",
    size: item.size || "",
    name: item.name || "",
  }));
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const { response, data } = await apiFetch("/api/cart");
        if (!cancelled && response.ok && Array.isArray(data.data?.items) && data.data.items.length) {
          setCart(data.data.items);
        }
      } catch {
        /* keep empty local cache */
      } finally {
        if (!cancelled) {
          setHydrated(true);
          skipSave.current = false;
        }
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || skipSave.current) return undefined;
    const timer = setTimeout(() => {
      apiFetch("/api/cart", {
        method: "PUT",
        body: JSON.stringify({ items: snapshot(cart) }),
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [cart, hydrated]);

  function addToCart(product) {
    if (!product || product.soldOut) return;

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item._id === product._id);

      if (existing) {
        return currentCart.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: item.quantity + (product.quantity || 1),
                grind:
                  product.grind !== undefined ? product.grind : item.grind,
                size: product.size !== undefined ? product.size : item.size,
                price:
                  typeof product.price === "number" ? product.price : item.price,
              }
            : item
        );
      }

      const isCoffee = product.category === "coffee";

      return [
        ...currentCart,
        {
          ...product,
          quantity: product.quantity || 1,
          grind:
            product.grind !== undefined
              ? product.grind
              : product.grindDefault ?? (isCoffee ? "Whole bean" : null),
          size: product.size !== undefined ? product.size : product.sizeLabel,
        },
      ];
    });
  }

  function removeFromCart(id) {
    setCart((currentCart) => currentCart.filter((item) => item._id !== id));
  }

  function increaseQuantity(id) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item._id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  function decreaseQuantity(id) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item._id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  }

  function setQuantity(id, n) {
    const qty = Math.max(0, Number(n) || 0);

    if (qty === 0) {
      setCart((currentCart) => currentCart.filter((item) => item._id !== id));
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item._id === id ? { ...item, quantity: qty } : item
      )
    );
  }

  function setGrind(id, grind) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item._id === id ? { ...item, grind } : item
      )
    );
  }

  function clearCart() {
    setCart([]);
  }

  const subtotal = cart.reduce(
    (total, item) => total + Number(item.price || 0) * item.quantity,
    0
  );

  const count = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        setQuantity,
        setGrind,
        clearCart,
        subtotal,
        count,
        hydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
