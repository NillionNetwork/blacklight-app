import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractPhalaHtx } from "@/lib/phala";
import type { WorkloadProvider, PhalaWorkloadConfig } from "@/types/workload";

// Blacklight is moving to Blacklight L1, so new workload registrations on the L2 are closed.
// Existing workloads can still be listed, edited, paused and deleted. Set to true to reopen.
const WORKLOAD_REGISTRATION_OPEN = false;

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workloads = await db.getWorkloadsByUser(userId);
  return NextResponse.json({ workloads });
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!WORKLOAD_REGISTRATION_OPEN) {
    return NextResponse.json(
      {
        error:
          "New workload registrations on the Blacklight L2 are closed, as Blacklight moves to Blacklight L1",
      },
      { status: 410 }
    );
  }

  try {
    const body = await request.json();
    const {
      provider,
      name,
      config,
    } = body;
    
    // Heartbeat interval comes from env var, not user input
    const heartbeatInterval = Number(process.env.DEFAULT_HEARTBEAT_INTERVAL) || 60;

    // Only Phala is supported for now
    if (provider !== "phala") {
      return NextResponse.json(
        { error: `${provider} support is coming soon` },
        { status: 400 }
      );
    }

    // Validate Phala workload
    if (provider === "phala") {
      if (!name) {
        return NextResponse.json(
          { error: "Name is required" },
          { status: 400 }
        );
      }

      const phalaConfig = config as PhalaWorkloadConfig;
      if (!phalaConfig?.cvmUrl) {
        return NextResponse.json(
          { error: "Phala workloads require cvmUrl" },
          { status: 400 }
        );
      }

      // Validate HTX extraction (already validated on client, but double-check)
      try {
        await extractPhalaHtx(phalaConfig.cvmUrl);
      } catch (error) {
        return NextResponse.json(
          { error: `Failed to extract HTX: ${error instanceof Error ? error.message : "Unknown error"}` },
          { status: 400 }
        );
      }

      // Check if user already has a workload with this URL
      const hasDuplicate = await db.hasWorkloadWithUrl(userId, phalaConfig.cvmUrl, provider);
      if (hasDuplicate) {
        return NextResponse.json(
          { error: "You have already registered a workload with this URL" },
          { status: 400 }
        );
      }

      // Create workload with config containing cvmUrl
      const workload = await db.createWorkload({
        userId,
        provider: provider as WorkloadProvider,
        name,
        config: config || {},
        heartbeatInterval: heartbeatInterval,
        isActive: true,
      });

      return NextResponse.json({ workload }, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating workload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


