import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const workload = await db.getWorkload(id);
  if (!workload) {
    return NextResponse.json({ error: "Workload not found" }, { status: 404 });
  }

  if (workload.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ workload });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const workload = await db.getWorkload(id);
  if (!workload) {
    return NextResponse.json({ error: "Workload not found" }, { status: 404 });
  }

  if (workload.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updates: any = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.config !== undefined) updates.config = body.config;
  if (body.heartbeatInterval !== undefined)
    updates.heartbeatInterval = parseInt(body.heartbeatInterval);
  if (body.isActive !== undefined) updates.isActive = body.isActive;

  const updated = await db.updateWorkload(id, updates);
  return NextResponse.json({ workload: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const workload = await db.getWorkload(id);
  if (!workload) {
    return NextResponse.json({ error: "Workload not found" }, { status: 404 });
  }

  if (workload.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.deleteWorkload(id);
  return NextResponse.json({ success: true });
}


