"use client";

import { useCart } from "../context/CartContext";
import NotifyButton from "./NotifyButton";

export default function AddToCartButton({
  product,
  label = "Add",
  className = "bt bt-sm",
  disabled = false,
}) {
  const { addToCart } = useCart();

  // A sold-out lot is a waitlist signup, not a purchase. This used to relabel
  // itself "Notify" while keeping addToCart as its handler and staying
  // disabled, so the label promised something the button could not do.
  if (product?.soldOut) {
    return <NotifyButton product={product} className={className} />;
  }

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || !product}
      onClick={() => addToCart(product)}
    >
      {label}
    </button>
  );
}
