"use client";

import { useCart } from "../context/CartContext";

export default function AddToCartButton({
  product,
  label = "Add",
  className = "bt bt-sm",
  disabled = false,
}) {
  const { addToCart } = useCart();
  const isDisabled = disabled || !product || product.soldOut;

  return (
    <button
      type="button"
      className={className}
      disabled={isDisabled}
      onClick={() => addToCart(product)}
    >
      {product?.soldOut ? "Notify" : label}
    </button>
  );
}
