"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

export function DashboardDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentValue = searchParams.get("range") || "ALL";

  const handleValueChange = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val === "ALL") {
      params.delete("range");
    } else {
      params.set("range", val);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="w-full sm:w-[180px]">
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Date Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Time</SelectItem>
          <SelectItem value="THIS_MONTH">This Month</SelectItem>
          <SelectItem value="LAST_MONTH">Last Month</SelectItem>
          <SelectItem value="LAST_6_MONTHS">Last 6 Months</SelectItem>
          <SelectItem value="LAST_YEAR">Last Year</SelectItem>
          <SelectItem value="THIS_YEAR">This Year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
