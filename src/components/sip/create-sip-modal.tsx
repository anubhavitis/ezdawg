"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSpotMetadata, useAllMids } from "@/lib/hyperliquid/hooks";
import { Loader2, Plus } from "lucide-react";

export function CreateSipModal() {
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [monthlyAmount, setMonthlyAmount] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { data: spotMeta, isLoading: isLoadingMeta } = useSpotMetadata();
  const { data: allMids, isLoading: isLoadingPrices } = useAllMids();

  // console.log("🚀 ~ CreateSipModal ~ allMids:", allMids);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate monthly amount
    const amount = parseFloat(monthlyAmount);
    if (isNaN(amount) || amount < 1000) {
      setError("Monthly investment must be at least 1000 USDC");
      return;
    }

    if (!selectedAsset) {
      setError("Please select an asset");
      return;
    }

    // TODO: Submit to backend
    console.log("Creating SIP:", { selectedAsset, monthlyAmount: amount });

    // Reset form and close modal
    setSelectedAsset("");
    setMonthlyAmount("");
    setOpen(false);
  };

  const isLoading = isLoadingMeta || isLoadingPrices;

  // Get sorted assets with prices
  const assetsWithPrices =
    spotMeta && allMids
      ? spotMeta.universe.map((asset: any) => ({
          name: asset.name,
          price: allMids[asset.name] || "N/A",
        }))
      : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Start new SIP
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New SIP</DialogTitle>
          <DialogDescription>
            Set up a systematic investment plan for spot assets on Hyperliquid.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Asset Selection */}
            <div className="space-y-2">
              <Label htmlFor="asset">Select Asset</Label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger id="asset">
                    <SelectValue placeholder="Choose an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetsWithPrices.map((asset) => (
                      <SelectItem key={asset.name} value={asset.name}>
                        {asset.name} - ${asset.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Monthly Investment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Monthly Investment (USDC)</Label>
              <Input
                id="amount"
                type="number"
                min="1000"
                step="1"
                placeholder="Min. 1000 USDC"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Minimum investment: 1000 USDC
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              Create SIP
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
