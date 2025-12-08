"use client";

import { useAccount } from "wagmi";
import { useUserFills, useSpotMetadata } from "@/lib/hyperliquid/hooks";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

// Helper function to map spot pair index to asset name
const getAssetName = (coin: string, spotMeta: any) => {
  if (!spotMeta) return coin;

  // Parse spot pair index from "@151" format
  const spotPairIndex = parseInt(coin.replace("@", ""));

  // Find the spot pair in universe
  const spotPair = spotMeta.universe?.find((u: any) => u.index === spotPairIndex);
  if (!spotPair) return coin;

  // Get the first token index (the asset, second is usually USDC at index 0)
  const tokenIndex = spotPair.tokens[0];

  // Find the token name
  const token = spotMeta.tokens?.find((t: any) => t.index === tokenIndex);
  return token?.name || coin;
};

export function RecentOrdersTable() {
  const { address } = useAccount();

  const { data: fills, isLoading, error } = useUserFills(address);
  const { data: spotMeta } = useSpotMetadata();

  // Calculate order count for badge
  const orderCount = fills?.length || 0;

  // Define table columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "time",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {format(new Date(row.original.time), "MMM d, h:mm a")}
        </span>
      ),
    },
    {
      accessorKey: "coin",
      header: "Asset",
      cell: ({ row }) => (
        <span className="font-medium">
          {getAssetName(row.original.coin, spotMeta)}
        </span>
      ),
    },
    {
      accessorKey: "usdcAmount",
      header: () => <div className="text-right">Amount (USDC)</div>,
      cell: ({ row }) => {
        const price = parseFloat(row.original.px);
        const tokens = parseFloat(row.original.sz);
        const usdcAmount = price * tokens;
        return <div className="text-right">${usdcAmount.toFixed(2)}</div>;
      },
    },
    {
      accessorKey: "sz",
      header: () => <div className="text-right">Tokens</div>,
      cell: ({ row }) => {
        const tokens = parseFloat(row.original.sz);
        return <div className="text-right">{tokens.toFixed(6)}</div>;
      },
    },
    {
      accessorKey: "px",
      header: () => <div className="text-right">Price</div>,
      cell: ({ row }) => {
        const price = parseFloat(row.original.px);
        return (
          <div className="text-right text-muted-foreground text-sm">
            ${price.toFixed(2)}
          </div>
        );
      },
    },
  ];

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="recent-orders">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <span>Recent Orders</span>
            {orderCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {orderCount}
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-dashed py-8">
              <p className="text-center text-destructive text-sm">
                Failed to load recent orders. Please try again later.
              </p>
            </div>
          ) : !fills || fills.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8">
              <p className="text-center text-muted-foreground text-sm">
                No recent orders yet. Orders will appear here once SIPs execute.
              </p>
            </div>
          ) : (
            <DataTable columns={columns} data={fills} initialPageSize={10} />
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
