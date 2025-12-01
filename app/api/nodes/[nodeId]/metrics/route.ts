import { NextRequest, NextResponse } from 'next/server'
import { nodeService } from '@/lib/services/nodeService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params
    const metrics = await nodeService.getNodeMetrics(nodeId)

    return NextResponse.json({
      success: true,
      metrics,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
