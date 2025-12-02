"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isConnected) {
      router.push("/dashboard");
    }
  }, [mounted, isConnected, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-3">
          <Image
            className="mx-auto"
            src="/logo.png"
            alt="ezdawg"
            width={100}
            height={100}
          />
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight">
            ezdawg
          </h1>
          <p className="text-base text-muted-foreground">
            Automated Hyperliquid trading
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <ConnectButton />
          </div>

          <div className="text-center space-y-4 pt-8 border-t">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect your wallet to access the platform
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
