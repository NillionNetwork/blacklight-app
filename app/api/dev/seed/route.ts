import { NextRequest, NextResponse } from 'next/server'
import { seedMockNodes } from '@/lib/utils/mock'

// Dev-only endpoint to seed mock data
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Not available in production' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { walletAddress, count = 5 } = body

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'walletAddress is required' },
        { status: 400 }
      )
    }

    await seedMockNodes(walletAddress, count)

    return NextResponse.json({
      success: true,
      message: `Seeded ${count} mock nodes for ${walletAddress}`,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
