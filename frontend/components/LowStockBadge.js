import { lowStockLabel } from "../lib/lowStock";

export default function LowStockBadge({ inventory, className = "" }) {
  const label = lowStockLabel(inventory);
  if (!label) return null;
  return (
    <span className={`ch ch-acc low-stock ${className}`.trim()} role="status">
      {label}
    </span>
  );
}
