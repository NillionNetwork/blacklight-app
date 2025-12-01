import { NextRequest, NextResponse } from 'next/server'
import { nodeService } from '@/lib/services/nodeService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { publicKey, platform, walletAddress } = body

    // Validation
    if (!publicKey || !walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: publicKey, walletAddress' },
        { status: 400 }
      )
    }

    // Platform is optional, but validate if provided
    if (platform && !['linux', 'mac', 'windows'].includes(platform)) {
      return NextResponse.json(
        { success: false, error: 'Invalid platform. Must be linux, mac, or windows' },
        { status: 400 }
      )
    }

    const node = await nodeService.registerNode({
      publicKey,
      platform, // Optional
      walletAddress,
    })

    return NextResponse.json({
      success: true,
      node,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    )
  }
}
