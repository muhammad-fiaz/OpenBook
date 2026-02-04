import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  SENT: { label: "Sent", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  PARTIALLY_PAID: { label: "Partial", className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  PAID: { label: "Paid", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  SUCCESS: { label: "Success", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  REFUNDED: { label: "Refunded", className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  PARTIALLY_REFUNDED: { label: "Part. Refunded", className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  INCOME: { label: "Income", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  EXPENSE: { label: "Expense", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "" };

  return (
    <Badge variant="outline" className={cn("border-0 font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
