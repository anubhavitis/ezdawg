import { NextRequest, NextResponse } from 'next/server';
import { getUserByWallet, getAgentWallet } from '@/backend/services/db.service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing wallet address' },
        { status: 400 }
      );
    }

    // Get user
    const user = await getUserByWallet(walletAddress);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get agent wallet
    const agentWallet = await getAgentWallet(user.id);
    if (!agentWallet) {
      return NextResponse.json({
        agentApproved: false,
        builderApproved: false,
        builderFee: 0,
      });
    }

    return NextResponse.json({
      agentApproved: agentWallet.approved,
      builderApproved: agentWallet.builder_approved,
      builderFee: agentWallet.builder_fee,
    });
  } catch (error: any) {
    console.error('Agent status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
