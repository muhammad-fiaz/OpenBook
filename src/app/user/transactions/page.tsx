import { Suspense } from "react";
import { getTransactions } from "@/actions/queries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/financial";
import { TableSkeleton } from "@/components/skeletons";

async function TransactionsContent() {
  const transactions = await getTransactions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          All financial transactions in one place
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-screen text-center text-muted-foreground">
              <p className="text-lg font-medium">No transactions yet</p>
              <p className="text-sm">Log your income and expenses to see them here.</p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Base (INR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {new Date(tx.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tx.type} />
                    </TableCell>
                    <TableCell>
                      {tx.categoryName ? (
                        <span className="inline-flex items-center gap-1.5">
                          {tx.categoryColor && (
                            <span
                              className="h-2 w-2 rounded-full"
                              // biome-ignore lint/style/noInlineStyles: Dynamic color
                              style={{ backgroundColor: tx.categoryColor }}
                            />
                          )}
                          {tx.categoryName}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(tx.originalAmount, tx.originalCurrency)}
                    </TableCell>
                    <TableCell className={`text-right ${tx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "EXPENSE" ? "-" : "+"}
                      {formatCurrency(tx.baseAmount)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">All financial transactions</p>
          </div>
          <TableSkeleton rows={5} />
        </div>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}
