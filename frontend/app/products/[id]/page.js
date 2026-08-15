import AddToCartButton from "../../../components/AddToCartButton";
import Link from "next/link";

export default async function ProductPage({ params }) {
  const { id } = await params;

  const response = await fetch(
    `http://localhost:5001/api/products/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return (
      <main>
        <h1>Product not found</h1>
        <Link href="/">Back to products</Link>
      </main>
    );
  }

  const product = await response.json();

  return (
    <main>
      <Link href="/">← Back to products</Link>

      <h1>{product.name}</h1>

      <p>{product.description}</p>

      <p>
        <strong>Category:</strong> {product.category}
      </p>

      <p>
        <strong>Price:</strong> ${product.price}
      </p>

      <p>
        <strong>Inventory:</strong> {product.inventory}
      </p>

      {product.inventory > 0 ? (
        <>
          <p>In stock</p>
          <AddToCartButton product={product} />
        </>
      ) : (
        <p>Sold out</p>
      )}
    </main>
  );
}