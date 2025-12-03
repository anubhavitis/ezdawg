"use client";

import { NavBar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isConnected) {
      router.push("/");
    }
  }, [mounted, isConnected, router]);

  if (!mounted || !isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container mx-auto px-4 max-w-7xl">
        <NavBar />
        <main className="pb-8">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
