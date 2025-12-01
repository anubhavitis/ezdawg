import { NextRequest, NextResponse } from "next/server";
import * as agentService from "@/backend/services/agent.service";

/**
 * PATCH /api/agent - Mark agent as approved
 * Called after frontend successfully approves agent
 */
export async function PATCH(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    const success = await agentService.markAgentApproved(walletAddress);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to mark agent as approved" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Agent marked as approved",
    });
  } catch (error: any) {
    console.error("Mark approved error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
