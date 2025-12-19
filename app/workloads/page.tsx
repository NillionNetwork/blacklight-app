"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { useState } from "react";
import { toast } from "sonner";
import { ConnectWallet } from "@/components/auth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { WorkloadList } from "@/components/workload/WorkloadList";
import { WorkloadForm } from "@/components/workload/WorkloadForm";
import { useWorkloads } from "@/lib/hooks/useWorkloads";

export default function WorkloadsPage() {
  const { address, isConnected } = useAppKitAccount();
  const { workloads, loading, refresh } = useWorkloads();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreate = async (data: any) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/workloads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": address,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create workload");
      }

      toast.success("Workload created successfully!");
      setShowAddModal(false);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create workload");
    } finally {
      setIsCreating(false);
    }
  };

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
          You haven't registered any TEE workloads yet.
        </p>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          Add Your First Workload
        </Button>

        {/* Add Workload Modal */}
        {showAddModal && (
          <Modal
            isOpen={showAddModal}
            onClose={() => !isCreating && setShowAddModal(false)}
            title="Add New Workload"
          >
            <WorkloadForm
              onSubmit={handleCreate}
              onCancel={() => setShowAddModal(false)}
              isSubmitting={isCreating}
            />
          </Modal>
        )}
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
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          + Add Workload
        </Button>
      </div>

      <WorkloadList workloads={workloads} onRefresh={refresh} />

      {/* Add Workload Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => !isCreating && setShowAddModal(false)}
          title="Add New Workload"
        >
          <WorkloadForm
            onSubmit={handleCreate}
            onCancel={() => setShowAddModal(false)}
            isSubmitting={isCreating}
          />
        </Modal>
      )}
    </div>
  );
}
