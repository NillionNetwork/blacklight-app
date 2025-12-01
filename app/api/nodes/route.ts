import { NextRequest, NextResponse } from 'next/server'
import { nodeService } from '@/lib/services/nodeService'

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address')

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 401 })
    }

    const nodes = await nodeService.getNodesForWallet(walletAddress)

    return NextResponse.json({
      success: true,
      nodes,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
