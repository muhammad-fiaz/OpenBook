"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { searchEverything, type SearchResult } from "@/actions/search";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [data, setData] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (debouncedQuery.length < 2) {
      setData([]);
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const results = await searchEverything(debouncedQuery);
        setData(results);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [debouncedQuery]);

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-64 lg:w-80"
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type to search..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="p-4 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
          )}
          {!loading && query.length > 0 && data.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {data.length > 0 && (
            <>
              {["client", "invoice", "product", "project", "quote"].map((type) => {
                const items = data.filter((item) => item.type === type);
                if (items.length === 0) return null;

                return (
                  <CommandGroup key={type} heading={type.charAt(0).toUpperCase() + type.slice(1) + "s"}>
                    {items.map((item) => (
                      <CommandItem
                        key={`${item.type}-${item.id}`}
                        value={`${item.title} ${item.subtitle}`}
                        onSelect={() => handleSelect(item.url)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{item.title}</span>
                          {item.subtitle && (
                            <span className="text-xs text-muted-foreground">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
