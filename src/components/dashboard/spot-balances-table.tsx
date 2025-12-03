"use client";

import { Address } from "viem";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { useGetBalances } from "@/lib/hyperliquid/hooks";
import { SpotBalance } from "@/lib/hyperliquid/types";
import { Header } from "../ui/header";

interface SpotBalancesTableProps {
  address: Address;
}

const columns: ColumnDef<SpotBalance>[] = [
  {
    accessorKey: "coin",
    header: "Asset",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("coin")}</div>;
    },
  },
  {
    accessorKey: "hold",
    header: "Available",
    cell: ({ row }) => {
      const hold = parseFloat(row.getValue("hold") as string);
      return (
        <div className="font-mono">
          {hold.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      const total = parseFloat(row.getValue("total") as string);
      return (
        <div className="font-mono">
          {total.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
          })}
        </div>
      );
    },
  },
  {
    id: "locked",
    header: "Locked",
    cell: ({ row }) => {
      const hold = parseFloat(row.original.hold);
      const total = parseFloat(row.original.total);
      const locked = total - hold;
      return (
        <div className="font-mono text-muted-foreground">
          {locked.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
          })}
        </div>
      );
    },
  },
];

export function SpotBalancesTable({ address }: SpotBalancesTableProps) {
  const { data, isLoading, error } = useGetBalances(address);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Loading balances...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-destructive">Error loading balances</p>
      </div>
    );
  }

  if (!data?.balances || data.balances.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">No balances found</p>
      </div>
    );
  }

  // Filter out zero balances for cleaner display
  const nonZeroBalances = data.balances.filter(
    (balance) => parseFloat(balance.total) > 0
  );

  if (nonZeroBalances.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px] border border-gray-200 rounded-lg p-4 backdrop-blur-sm">
        <p className="text-muted-foreground">No active balances</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header
        title="Spot Balances"
        description="Your current spot asset balances on Hyperliquid"
      />
      <DataTable
        columns={columns}
        data={nonZeroBalances}
        searchKey="coin"
        searchPlaceholder="Search by asset..."
      />
    </div>
  );
}
