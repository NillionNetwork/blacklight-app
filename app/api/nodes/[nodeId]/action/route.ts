import { NextRequest, NextResponse } from 'next/server'
import { nodeService } from '@/lib/services/nodeService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params
    const body = await request.json()
    const { action } = body

    if (!action || !['start', 'stop', 'restart', 'delete'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be start, stop, restart, or delete' },
        { status: 400 }
      )
    }

    await nodeService.performNodeAction(nodeId, action)

    return NextResponse.json({
      success: true,
      message: `Node ${action} action completed successfully`,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
