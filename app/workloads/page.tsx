"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { ConnectWallet } from "@/components/auth";
import { L1Notice } from "@/components/l1";
import { Spinner } from "@/components/ui/Spinner";
import { WorkloadList } from "@/components/workload/WorkloadList";
import { useWorkloads } from "@/lib/hooks/useWorkloads";

export default function WorkloadsPage() {
  const { address, isConnected } = useAppKitAccount();
  const { workloads, loading, refresh } = useWorkloads();

  // Show connect wallet if not connected
  if (!isConnected || !address) {
    return (
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 5rem)",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          TEE Workload Management
        </h1>
        <p
          style={{
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          Connect your wallet to manage your TEE workloads
        </p>
        <ConnectWallet />
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 5rem)",
        }}
      >
        <Spinner size="large" />
      </div>
    );
  }

  if (workloads.length === 0) {
    return (
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 5rem)",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          No Workloads Yet
        </h1>
        <p style={{ color: "rgba(255, 255, 255, 0.7)", marginBottom: "1rem" }}>
          You haven't registered any TEE workloads.
        </p>
        <L1Notice backToHome />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: "0.5rem" }}>TEE Workloads</h1>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.875rem" }}>
            {workloads.length} {workloads.length === 1 ? "workload" : "workloads"}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <L1Notice />
      </div>

      <WorkloadList workloads={workloads} onRefresh={refresh} />

    </div>
  );
}
