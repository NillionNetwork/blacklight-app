"use client";

import { useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import type { Workload } from "@/types/workload";

export function useWorkloads() {
  const { address, isConnected } = useAppKitAccount();
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkloads = async () => {
    if (!isConnected || !address) {
      setWorkloads([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/workloads", {
        headers: {
          "x-user-id": address,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkloads(
          data.workloads.map((w: any) => ({
            ...w,
            config: typeof w.config === "string" ? JSON.parse(w.config) : w.config,
            createdAt: new Date(w.createdAt),
            updatedAt: new Date(w.updatedAt),
            lastHeartbeat: w.lastHeartbeat ? new Date(w.lastHeartbeat) : undefined,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching workloads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkloads();
  }, [address, isConnected]);

  return { workloads, loading, refresh: fetchWorkloads };
}
