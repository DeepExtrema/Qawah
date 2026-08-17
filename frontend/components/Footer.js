import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-col">
          <span className="cp">QAHWA SUPPLY</span>
          <span>Yemeni-lineage coffee, roasted Tuesdays in Brooklyn.</span>
          <span className="cp">SHIPS WEDNESDAY · FREE OVER $40</span>
        </div>
        <div className="footer-col">
          <span className="cp">SHOP</span>
          <Link href="/coffee">Coffee</Link>
          <Link href="/gear">Gear</Link>
          <Link href="/subscribe">Subscribe</Link>
          <Link href="/cart">Bag</Link>
          <Link href="/wishlist">Saved lots</Link>
        </div>
        <div className="footer-col">
          <span className="cp">LEARN</span>
          <Link href="/learn">Brew guides</Link>
          <Link href="/learn">Ibrik &amp; qahwa</Link>
          <Link href="/learn">Qishr</Link>
        </div>
        <div className="footer-col">
          <span className="cp">TRADE</span>
          <Link href="/wholesale">Wholesale</Link>
          <Link href="/login">Trade login</Link>
          <Link href="/account">Account</Link>
          <Link href="/register">Open an account</Link>
        </div>
      </div>
    </footer>
  );
}
