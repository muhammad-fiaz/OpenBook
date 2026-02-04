import { Suspense } from "react";
import { getTransactions, getCategories } from "@/actions/queries";
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
import { TransactionFilters } from "@/components/dashboard/transaction-filters";

async function IncomeContent({ range, sort, order, categoryId, search }: { range?: string, sort?: string, order?: string, categoryId?: string, search?: string }) {
  const [transactions, categories] = await Promise.all([
    getTransactions(
      "INCOME", 
      range, 
      (sort as "date" | "amount") || "date",
      (order as "asc" | "desc") || "desc",
      categoryId,
      search
    ),
    getCategories("INCOME")
  ]);

  const totalIncome = transactions.reduce(
    (sum, tx) => sum + Number(tx.baseAmount),
    0,
  );

  return (
    <div className="space-y-6 h-full min-h-screen flex flex-col">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
            <h1 className="text-3xl font-bold tracking-tight">Income</h1>
            <p className="text-muted-foreground">Track all incoming revenue</p>
            </div>
            <Card className="px-6 py-3 w-full md:w-auto bg-muted/50 border-none shadow-none">
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Income</div>
                <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalIncome)}
                </div>
            </Card>
        </div>
        
        <TransactionFilters categories={categories.map(c => ({ id: c.id, name: c.name, color: c.color }))} />
      </div>

      <Card className="flex-1 min-h-125">
        <CardHeader>
          <CardTitle>Income Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Base (INR)</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-96 text-center">
                    <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground whitespace-normal">
                        <p className="text-lg font-medium">No income transactions found</p>
                        <p className="text-sm text-center">Try adjusting your filters or add a new transaction.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {new Date(tx.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      {tx.categoryName ? (
                        <span className="inline-flex items-center gap-1.5">
                          {tx.categoryColor && (
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              // biome-ignore lint/style/noInlineStyles: Dynamic category color
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
                    <TableCell className="text-right">
                      {formatCurrency(tx.baseAmount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tx.type} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const range = typeof params.range === "string" ? params.range : undefined;
  const sort = typeof params.sort === "string" ? params.sort : undefined;
  const order = typeof params.order === "string" ? params.order : undefined;
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;

  return (
    <Suspense
      fallback={
        <div className="h-full min-h-screen space-y-6 flex flex-col">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Income</h1>
              <p className="text-muted-foreground">Track all incoming revenue</p>
            </div>
          </div>
          <div className="flex-1">
             <TableSkeleton rows={8} />
          </div>
        </div>
      }
    >
      <IncomeContent range={range} sort={sort} order={order} categoryId={categoryId} search={search} />
    </Suspense>
  );
}
