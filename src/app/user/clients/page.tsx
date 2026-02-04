import { Suspense } from "react";
import { getClients } from "@/actions/queries";
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
import { TableSkeleton } from "@/components/skeletons";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { DashboardDateFilter } from "@/components/dashboard/date-filter";

async function ClientsContent({ range }: { range?: string }) {
  const clients = await getClients(range);

  return (
    <div className="space-y-6 min-h-[calc(100vh-200px)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your client directory</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <DashboardDateFilter />
            <AddClientDialog />
        </div>
      </div>

      <Card className="min-h-125">
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
              <p className="text-lg font-medium">No clients found</p>
              <p className="text-sm">Add your first client or adjust filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email ?? "—"}</TableCell>
                    <TableCell>{client.company ?? "—"}</TableCell>
                    <TableCell>{client.phone ?? "—"}</TableCell>
                    <TableCell>{client.country ?? "—"}</TableCell>
                    <TableCell>{client.currency}</TableCell>
                    <TableCell className="text-right">
                      {client.invoiceCount}
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

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const range = typeof params.range === "string" ? params.range : undefined;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen space-y-6">
          <div className="flex justify-between items-center">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                <p className="text-muted-foreground">Manage your client directory</p>
             </div>
          </div>
          <TableSkeleton rows={5} />
        </div>
      }
    >
      <ClientsContent range={range} />
    </Suspense>
  );
}
