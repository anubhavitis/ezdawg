"use client";

import { Address } from "viem";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import {
  useGetBalances,
  useAllMids,
  useSpotMetadata,
} from "@/lib/hyperliquid/hooks";
import { SpotBalance } from "@/lib/hyperliquid/types";
import { Header } from "../ui/header";
import { UnifiedDepositModal } from "./unified-deposit-modal";

interface SpotBalancesTableProps {
  address: Address;
}

interface SpotBalanceWithPnl extends SpotBalance {
  pnl?: number;
}

const createColumns = (
  allMids: any,
  spotMeta: any
): ColumnDef<SpotBalanceWithPnl>[] => [
  {
    accessorKey: "coin",
    header: "Asset",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("coin")}</div>;
    },
  },
  {
    accessorKey: "total",
    header: "Balance",
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
    id: "entryPrice",
    header: "Avg Buy Price",
    cell: ({ row }) => {
      const { coin, total, entryNtl } = row.original;
      const totalNum = parseFloat(total);
      const entryNtlNum = parseFloat(entryNtl);

      // USDC always $1
      if (coin === "USDC") {
        return <div className="font-mono text-muted-foreground">$1.00</div>;
      }

      // No entry price if entryNtl is 0
      if (entryNtlNum === 0 || totalNum === 0) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Calculate entry price
      const entryPrice = entryNtlNum / totalNum;

      return (
        <div className="font-mono text-muted-foreground">
          $
          {entryPrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
        </div>
      );
    },
  },
  {
    id: "currentPrice",
    header: "Current Price",
    cell: ({ row }) => {
      const { coin } = row.original;

      // USDC always $1
      if (coin === "USDC") {
        return <div className="font-mono">$1.00</div>;
      }

      // Find asset index from metadata
      if (!spotMeta) {
        return <div className="text-muted-foreground">—</div>;
      }

      const tokenInfo = spotMeta.tokens.find((t: any) => t.name === coin);
      if (!tokenInfo) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Find the spot pair (token paired with USDC)
      const spotPair = spotMeta.universe.find(
        (u: any) => u.tokens[0] === tokenInfo.index && u.tokens[1] === 0
      );

      if (!spotPair || !allMids) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Get current price
      const currentPrice = parseFloat(allMids[`@${spotPair.index}`] || "0");
      if (currentPrice === 0) {
        return <div className="text-muted-foreground">—</div>;
      }

      return (
        <div className="font-mono">
          $
          {currentPrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
        </div>
      );
    },
  },
  {
    id: "value",
    header: "Value",
    cell: ({ row }) => {
      const { coin, total, entryNtl } = row.original;
      const totalNum = parseFloat(total);
      const entryNtlNum = parseFloat(entryNtl);

      // USDC is 1:1 (neutral color)
      if (coin === "USDC") {
        return (
          <div className="font-mono">
            $
            {totalNum.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        );
      }

      // Find asset index from metadata
      if (!spotMeta) {
        return <div className="text-muted-foreground">—</div>;
      }

      const tokenInfo = spotMeta.tokens.find((t: any) => t.name === coin);
      if (!tokenInfo) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Find the spot pair (token paired with USDC)
      const spotPair = spotMeta.universe.find(
        (u: any) => u.tokens[0] === tokenInfo.index && u.tokens[1] === 0
      );

      if (!spotPair || !allMids) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Get current price
      const currentPrice = parseFloat(allMids[`@${spotPair.index}`] || "0");
      if (currentPrice === 0) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Calculate current value
      const currentValue = totalNum * currentPrice;

      // Determine color based on profit/loss
      let colorClass = "";
      if (entryNtlNum > 0) {
        colorClass =
          currentValue > entryNtlNum
            ? "text-green-600 dark:text-green-400"
            : currentValue < entryNtlNum
            ? "text-red-600 dark:text-red-400"
            : "";
      }

      return (
        <div className={`font-mono ${colorClass}`}>
          $
          {currentValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      );
    },
  },
  {
    id: "pnl",
    header: "P&L %",
    cell: ({ row }) => {
      const { coin, total, entryNtl } = row.original;
      const totalNum = parseFloat(total);
      const entryNtlNum = parseFloat(entryNtl);

      // Handle USDC or zero entryNtl
      if (coin === "USDC" || entryNtlNum === 0) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Find asset index from metadata
      if (!spotMeta) {
        return <div className="text-muted-foreground">—</div>;
      }

      const tokenInfo = spotMeta.tokens.find((t: any) => t.name === coin);
      if (!tokenInfo) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Find the spot pair (token paired with USDC)
      const spotPair = spotMeta.universe.find(
        (u: any) => u.tokens[0] === tokenInfo.index && u.tokens[1] === 0
      );

      if (!spotPair || !allMids) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Get current price
      const currentPrice = parseFloat(allMids[`@${spotPair.index}`] || "0");
      if (currentPrice === 0) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Calculate P&L %
      const currentValue = totalNum * currentPrice;
      const pnlPercent = ((currentValue - entryNtlNum) / entryNtlNum) * 100;

      // Color coding
      const colorClass =
        pnlPercent > 0
          ? "text-green-600 dark:text-green-400"
          : pnlPercent < 0
          ? "text-red-600 dark:text-red-400"
          : "text-muted-foreground";

      const prefix = pnlPercent > 0 ? "+" : "";

      return (
        <div className={`font-mono ${colorClass}`}>
          {prefix}
          {pnlPercent.toFixed(2)}%
        </div>
      );
    },
  },
];

export function SpotBalancesTable({ address }: SpotBalancesTableProps) {
  const { data, isLoading, error } = useGetBalances(address);
  const { data: allMids } = useAllMids();
  const { data: spotMeta } = useSpotMetadata();

  const columns = createColumns(allMids, spotMeta);

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
      <div className="flex items-center justify-between">
        <Header
          title="Spot Balances"
          description="Your current spot asset balances on Hyperliquid"
        />
        <UnifiedDepositModal />
      </div>
      <DataTable
        columns={columns}
        data={nonZeroBalances}
        searchKey="coin"
        searchPlaceholder="Search by asset..."
      />
    </div>
  );
}
