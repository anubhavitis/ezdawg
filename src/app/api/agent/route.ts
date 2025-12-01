import { NextRequest, NextResponse } from "next/server";
import * as agentService from "@/backend/services/agent.service";

/**
 * POST /api/agent - Create new agent for wallet
 * Thin controller - delegates to agent service
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    const result = await agentService.createAgent(walletAddress);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to create agent" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Agent creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent?walletAddress=0x... - Get existing agent
 * Returns only address and approval status (NEVER private key)
 */
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.nextUrl.searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    const result = await agentService.getAgent(walletAddress);

    if (!result) {
      return NextResponse.json({ agentAddress: null, approved: false });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Get agent error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
