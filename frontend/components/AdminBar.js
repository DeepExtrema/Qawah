"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/audit", label: "Audit" },
];

export default function AdminBar() {
  const pathname = usePathname();
  return (
    <div className="admin-bar">
      <div className="shell admin-bar-inner">
        <span className="cp">TRADE DESK</span>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              pathname === link.href ||
              (link.href !== "/admin" && pathname.startsWith(link.href))
                ? "nv-link is-active"
                : "nv-link"
            }
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
