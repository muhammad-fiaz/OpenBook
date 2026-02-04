"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { exportAllData } from "@/actions/data-export";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DataManagement() {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      try {
        const data = await exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `openbook-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Export failed:", error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download a copy of your organization's data, including products, clients, invoices, and transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={isPending}>
            <Download className="mr-2 h-4 w-4" />
            {isPending ? "Exporting..." : "Export All Data (JSON)"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
          <CardDescription>
            Import data from a previous export (JSON format). New data will be created; existing data will be preserved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
                Import functionality is currently under development. Importing large datasets may cause conflicts.
            </AlertDescription>
          </Alert>
          <Button variant="outline" disabled>
            <Upload className="mr-2 h-4 w-4" />
            Import JSON (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
