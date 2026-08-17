export function isLowStock(inventory) {
  const n = Number(inventory);
  return n > 0 && n <= 8;
}

export function lowStockLabel(inventory) {
  if (!isLowStock(inventory)) return null;
  const n = Number(inventory);
  return `Only ${n} bag${n === 1 ? "" : "s"} left`;
}
