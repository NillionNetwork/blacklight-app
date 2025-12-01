import { NextRequest, NextResponse } from 'next/server'
import { nodeService } from '@/lib/services/nodeService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const activity = await nodeService.getNodeActivity(nodeId, limit)

    return NextResponse.json({
      success: true,
      activity,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
