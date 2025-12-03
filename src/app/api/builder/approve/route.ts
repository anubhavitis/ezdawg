import { NextRequest, NextResponse } from 'next/server';
import { getUserByWallet, updateBuilderApproval } from '@/backend/services/db.service';
import { verifySignature } from '@/backend/lib/signature';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, builderFee, signature, message } = body;

    if (!walletAddress || builderFee === undefined || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the signature
    const isValid = await verifySignature(walletAddress, message, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Get or create user
    const user = await getUserByWallet(walletAddress);
    if (!user) {
      return NextResponse.json(
        { error: 'Failed to get user' },
        { status: 500 }
      );
    }

    // Update builder approval
    const success = await updateBuilderApproval(user.id, true, builderFee);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update builder approval' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Builder approval updated successfully',
    });
  } catch (error: any) {
    console.error('Builder approval error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
