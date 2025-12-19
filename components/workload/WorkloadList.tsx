"use client";

import type { Workload } from "@/types/workload";
import { WorkloadCard } from "./WorkloadCard";
import { Card } from "@/components/ui/Card";

interface WorkloadListProps {
  workloads: Workload[];
  onRefresh: () => void;
}

export function WorkloadList({ workloads, onRefresh }: WorkloadListProps) {
  if (workloads.length === 0) {
    return (
      <Card style={{ padding: "3rem", textAlign: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>
          <svg
            style={{ margin: "0 auto", height: "3rem", width: "3rem" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: "500",
            marginBottom: "0.5rem",
          }}
        >
          No workloads registered
        </h3>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem" }}>
          Get started by adding your first TEE workload
        </p>
      </Card>
    );
  }

  return (
    <div className="workload-list-grid">
      {workloads.map((workload) => (
        <WorkloadCard
          key={workload.id}
          workload={workload}
          onUpdate={onRefresh}
        />
      ))}
    </div>
  );
}
