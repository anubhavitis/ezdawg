import { NextRequest, NextResponse } from "next/server";
import { executeUserSIPs } from "@/backend/services/sip-executor.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const api_key = request.headers.get("api_key");
  const userAddress = request.headers.get("user_address");
  if (!userAddress) {
    return NextResponse.json(
      { error: "User address is required" },
      { status: 400 }
    );
  }

  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error("[Cron] CRON_SECRET not configured");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  if (api_key !== expectedSecret) {
    console.warn("[Cron] Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[Cron] Executing SIPs for user ${userAddress}...`);

  try {
    const result = await executeUserSIPs(userAddress);

    return NextResponse.json({
      success: true,
      message: "SIP execution completed",
      ...result,
    });
  } catch (error: any) {
    console.error("[Cron] Execution failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
