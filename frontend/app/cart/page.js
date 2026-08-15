"use client";

import Link from "next/link";
import { useCart } from "../../context/CartContext";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    subtotal,
  } = useCart();

  if (cart.length === 0) {
    return (
      <main>
        <h1>Your Cart</h1>

        <p>Your cart is empty.</p>

        <Link href="/">
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Your Cart</h1>

      {cart.map((item) => (
        <div key={item._id}>
          <h2>{item.name}</h2>

          <p>Price: ${item.price}</p>

          <div>
            <button onClick={() => decreaseQuantity(item._id)}>
              -
            </button>

            <span> {item.quantity} </span>

            <button onClick={() => increaseQuantity(item._id)}>
              +
            </button>
          </div>

          <p>
            Item total: ${(item.price * item.quantity).toFixed(2)}
          </p>

          <button onClick={() => removeFromCart(item._id)}>
            Remove
          </button>

          <hr />
        </div>
      ))}

      <h2>Subtotal: ${subtotal.toFixed(2)}</h2>

      <Link href="/checkout">
        Proceed to Checkout
      </Link>

      <br />
      <br />

      <Link href="/">
        Continue Shopping
      </Link>
    </main>
  );
}