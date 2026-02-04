"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  getRevenueReport,
  getExpenseReport,
  getProfitLossReport,
  getTopClients,
  getTopProducts,
  getARAgingDetailed,
  getCashFlowReport,
} from "@/actions/reports";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartSkeleton, CardSkeleton, TableSkeleton } from "@/components/skeletons";
import { formatCurrency } from "@/lib/financial";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RefreshCw,
} from "lucide-react";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

// biome-ignore lint: recharts formatter type workaround
const currencyFormatter = (value: any) => formatCurrency(Number(value ?? 0));

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

export default function ReportsPage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [activeTab, setActiveTab] = useState("profit-loss");
  const [loading, setLoading] = useState(false);

  const [plReport, setPLReport] = useState<any>(null);
  const [revenueReport, setRevenueReport] = useState<any>(null);
  const [expenseReport, setExpenseReport] = useState<any>(null);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [aging, setAging] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any>(null);

  async function loadReport() {
    setLoading(true);
    try {
      const [pl, rev, exp, clients, products, ar, cf] = await Promise.all([
        getProfitLossReport(startDate, endDate),
        getRevenueReport(startDate, endDate),
        getExpenseReport(startDate, endDate),
        getTopClients(startDate, endDate),
        getTopProducts(startDate, endDate),
        getARAgingDetailed(),
        getCashFlowReport(startDate, endDate),
      ]);
      setPLReport(pl);
      setRevenueReport(rev);
      setExpenseReport(exp);
      setTopClients(clients);
      setTopProducts(products);
      setAging(ar);
      setCashFlow(cf);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div className="space-y-6" {...fadeIn} transition={{ duration: 0.3 }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Business analytics and financial reports</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="startDate">From</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">To</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button onClick={loadReport} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Generating..." : "Generate Reports"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
                setEndDate(now.toISOString().slice(0, 10));
              }}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                setStartDate(new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10));
                setEndDate(now.toISOString().slice(0, 10));
              }}
            >
              This Year
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                setStartDate(new Date(now.getFullYear() - 1, 0, 1).toISOString().slice(0, 10));
                setEndDate(new Date(now.getFullYear() - 1, 11, 31).toISOString().slice(0, 10));
              }}
            >
              Last Year
            </Button>
          </div>
        </CardContent>
      </Card>

      {!plReport && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <p className="text-xl font-medium">Select a date range and generate reports</p>
          <p className="text-sm text-muted-foreground mt-1">Click &quot;Generate Reports&quot; to load your analytics</p>
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={`skel-${i}`} />
            ))}
          </div>
          <ChartSkeleton />
          <TableSkeleton rows={5} />
        </div>
      )}

      {plReport && !loading && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="profit-loss">P&L</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
            <TabsTrigger value="clients">Top Clients</TabsTrigger>
            <TabsTrigger value="products">Top Products</TabsTrigger>
            <TabsTrigger value="aging">AR Aging</TabsTrigger>
          </TabsList>

          {/* Profit & Loss */}
          <TabsContent value="profit-loss" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(plReport.totalIncome)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(plReport.totalExpenses)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${plReport.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(plReport.netProfit)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${plReport.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {plReport.profitMargin.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Profit & Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-87.5">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={plReport.monthly}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        // biome-ignore lint/style/noInlineStyles: Recharts custom style
                        contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                        formatter={currencyFormatter}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="#16a34a" name="Income" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
                      <Line dataKey="profit" stroke="#2563eb" strokeWidth={2} name="Net Profit" dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {plReport.topExpenseCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Expense Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-75">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={plReport.topExpenseCategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={110}
                          dataKey="total"
                          nameKey="category"
                          label={({ name, percent }: any) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                        >
                          {plReport.topExpenseCategories.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={currencyFormatter} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Revenue */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(revenueReport.totalRevenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(revenueReport.paidRevenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{revenueReport.invoiceCount}</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-87.5">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueReport.monthly}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={currencyFormatter} />
                      <Legend />
                      <Bar dataKey="total" fill="#2563eb" name="Total" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="paid" fill="#16a34a" name="Paid" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(expenseReport.totalExpense)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{expenseReport.transactionCount}</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>By Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-75">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseReport.byCategory}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="total"
                          nameKey="category"
                          label={({ name }: any) => name}
                        >
                          {expenseReport.byCategory.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={currencyFormatter} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-75">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={expenseReport.monthly}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip formatter={currencyFormatter} />
                        <Area type="monotone" dataKey="total" fill="#ef444433" stroke="#ef4444" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cash Flow */}
          <TabsContent value="cash-flow" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" /> Inflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(cashFlow.totalInflow)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-red-600" /> Outflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(cashFlow.totalOutflow)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Cash Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${cashFlow.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(cashFlow.netCashFlow)}
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-87.5">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={cashFlow.monthly}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={currencyFormatter} />
                      <Legend />
                      <Bar dataKey="inflow" fill="#16a34a" name="Inflow" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="outflow" fill="#ef4444" name="Outflow" radius={[4, 4, 0, 0]} />
                      <Line dataKey="net" stroke="#2563eb" strokeWidth={2} name="Net" dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Clients */}
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Clients by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {topClients.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No client data in this period</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead className="text-right">Total Billed</TableHead>
                          <TableHead className="text-right">Total Paid</TableHead>
                          <TableHead className="text-right">Invoices</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topClients.map((client, i) => (
                          <TableRow key={client.id}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{client.company ?? "—"}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(client.totalBilled)}</TableCell>
                            <TableCell className="text-right font-mono text-green-600">{formatCurrency(client.totalPaid)}</TableCell>
                            <TableCell className="text-right">{client.invoiceCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Products */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Products by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No product data in this period</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Qty Sold</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Quoted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProducts.map((product, i) => (
                          <TableRow key={product.id}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.sku ?? "—"}</TableCell>
                            <TableCell className="text-right font-mono">{product.totalQuantitySold.toFixed(1)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(product.totalRevenue)}</TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(product.totalQuoted)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AR Aging */}
          <TabsContent value="aging" className="space-y-4">
            {aging && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {aging.summary.map((bucket: any) => (
                    <Card key={bucket.bucket}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{bucket.bucket}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold">{formatCurrency(bucket.total)}</p>
                        <p className="text-xs text-muted-foreground">{bucket.count} invoice(s)</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Aging Summary Chart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={aging.summary}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="bucket" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip formatter={currencyFormatter} />
                          <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Outstanding Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Outstanding</TableHead>
                            <TableHead>Days Past Due</TableHead>
                            <TableHead>Bucket</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {aging.invoices.map((inv: any) => (
                            <TableRow key={inv.invoiceId}>
                              <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                              <TableCell>{inv.clientName}</TableCell>
                              <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(Number(inv.total), inv.originalCurrency)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-red-600">
                                {formatCurrency(Number(inv.outstanding), inv.originalCurrency)}
                              </TableCell>
                              <TableCell>{inv.daysPastDue}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                                  {inv.bucket}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
}
