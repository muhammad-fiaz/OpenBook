"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownAZ, ArrowUpAZ, Calendar, DollarSign, Search, Filter } from "lucide-react";
import { DashboardDateFilter } from "./date-filter";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";

type Category = {
    id: string;
    name: string;
    color: string | null;
};

type Props = {
    categories?: Category[];
};

export function TransactionFilters({ categories = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "date";
  const currentOrder = searchParams.get("order") || "desc";
  const currentCategory = searchParams.get("categoryId") || "ALL";
  
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const [debouncedSearch] = useDebounce(searchValue, 500);

  useEffect(() => {
      const params = new URLSearchParams(searchParams);
      if (debouncedSearch) {
          params.set("search", debouncedSearch);
      } else {
          params.delete("search");
      }
      
      if ((searchParams.get("search") || "") !== debouncedSearch) {
           router.push(`?${params.toString()}`);
      }
  }, [debouncedSearch, router, searchParams]);

  const updateParams = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val && val !== "ALL") {
        params.set(key, val);
    } else {
        params.delete(key);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2 w-full">
         <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-9 w-full bg-background"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
         </div>
      </div>
      
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 w-full sm:w-auto">
      <DashboardDateFilter />
      
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
        {categories.length > 0 && (
            <div className="w-full sm:w-[180px]">
                <Select value={currentCategory} onValueChange={(val) => updateParams("categoryId", val)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span>All Categories</span>
                            </div>
                        </SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                <div className="flex items-center gap-2">
                                    {cat.color && (
                                        <div 
                                          className="h-2 w-2 rounded-full shrink-0" 
                                          // biome-ignore lint/style/noInlineStyles: Dynamic color required for user-defined categories
                                          style={{ backgroundColor: cat.color }}
                                        />
                                    )}
                                    <span>{cat.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
        
        <div className="w-full sm:w-[140px]">
        <Select value={currentSort} onValueChange={(val) => updateParams("sort", val)}>
            <SelectTrigger>
            <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="date">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Date</span>
                </div>
            </SelectItem>
            <SelectItem value="amount">
                <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Amount</span>
                </div>
            </SelectItem>
            </SelectContent>
        </Select>
        </div>

       <div className="w-full sm:w-[140px]">
        <Select value={currentOrder} onValueChange={(val) => updateParams("order", val)}>
            <SelectTrigger>
            <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="desc">
                <div className="flex items-center gap-2">
                    <ArrowDownAZ className="h-4 w-4" />
                    <span>Descending</span>
                </div>
            </SelectItem>
             <SelectItem value="asc">
                <div className="flex items-center gap-2">
                    <ArrowUpAZ className="h-4 w-4" />
                    <span>Ascending</span>
                </div>
            </SelectItem>
            </SelectContent>
        </Select>
      </div>
      </div>
      </div>
    </div>
  );
}
