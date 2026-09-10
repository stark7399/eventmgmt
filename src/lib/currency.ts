// New file: single shared currency formatter (Indian Rupees) so every page shows
// money the same way instead of each page hand-rolling its own "$" + toLocaleString.
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
