"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-transparent backdrop-blur-sm">
      <div className="mb-10 mx-auto max-w-7xl flex h-14 items-center justify-between ">
        <Link href="/" className="flex items-center">
          <span className="text-lg font-semibold">EZDAWG</span>
        </Link>

        <div className="flex items-center">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
