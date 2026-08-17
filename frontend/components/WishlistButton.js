"use client";

import { useWishlist } from "../context/WishlistContext";

export default function WishlistButton({ product, className = "" }) {
  const { has, toggle, loaded } = useWishlist();
  if (!product?._id) return null;
  const on = has(product._id);

  return (
    <button
      type="button"
      className={`heart-btn ${on ? "is-on" : ""} ${className}`.trim()}
      aria-pressed={on}
      aria-label={on ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      disabled={!loaded}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(product);
      }}
    >
      {on ? "♥" : "♡"}
    </button>
  );
}
