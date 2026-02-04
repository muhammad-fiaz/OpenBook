import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function PageSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function FullPageSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card p-4">
      <div className="mb-8 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`sidebar-skel-${i.toString()}`} className="flex items-center gap-3 rounded-md px-3 py-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-auto space-y-2">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

export function NavbarSkeleton() {
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-9 w-64 rounded-md" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="mt-3 h-8 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={`card-skel-${i.toString()}`} />
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <ChartSkeleton />
        </div>
        <div className="col-span-3">
          <ChartSkeleton />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      <div className="p-4">
        <div className="mb-4 flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`th-skel-${i.toString()}`} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`tr-skel-${i.toString()}`} className="flex gap-4 border-t py-3">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={`td-skel-${i.toString()}-${j.toString()}`} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6">
      <Skeleton className="mb-4 h-5 w-32" />
      <div className="flex items-end gap-2 h-64">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={`chart-skel-${i.toString()}`}
            className="flex-1 rounded-t"
            // biome-ignore lint/style/noInlineStyles: Random height for skeleton
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`form-skel-${i.toString()}`} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-28 rounded-md" />
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`notif-skel-${i.toString()}`} className="flex items-start gap-4 rounded-lg border bg-card p-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      <div className="space-y-4">
        <FormSkeleton />
        <FormSkeleton />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-12 gap-4 rounded-xl border bg-card h-[70vh]">
        <div className="col-span-3 border-r p-4 space-y-3">
          <Skeleton className="h-9 w-full rounded-md" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`chat-room-skel-${i.toString()}`} className="flex items-center gap-3 p-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-9 flex items-center justify-center">
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
    </div>
  );
}

export function ListPageSkeleton({ title = true }: { title?: boolean }) {
  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      )}
      <TableSkeleton rows={8} />
    </div>
  );
}

export function InvoicePreviewSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-xl border bg-card p-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <TableSkeleton rows={3} />
      <div className="flex justify-end">
        <div className="w-48 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
