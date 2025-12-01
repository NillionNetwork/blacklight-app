import { NextRequest, NextResponse } from 'next/server'
import { nodeService } from '@/lib/services/nodeService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params
    const node = await nodeService.getNode(nodeId)

    if (!node) {
      return NextResponse.json({ success: false, error: 'Node not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      node,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params
    const deleted = await nodeService.performNodeAction(nodeId, 'delete')

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Node not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Node deleted successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
