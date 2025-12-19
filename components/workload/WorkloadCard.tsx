"use client";

import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Workload } from "@/types/workload";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { WorkloadForm } from "./WorkloadForm";

interface WorkloadCardProps {
  workload: Workload;
  onUpdate: () => void;
}

const providerLabels: Record<string, string> = {
  phala: "Phala",
  nillion: "Nillion",
  azure: "Azure",
  "google-cloud": "Google Cloud",
  aws: "AWS",
  "secret-network": "Secret Network",
};

export function WorkloadCard({ workload, onUpdate }: WorkloadCardProps) {
  const { address } = useAppKitAccount();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Get URL from config based on provider
  const getWorkloadUrl = () => {
    if (workload.provider === "phala") {
      return workload.config?.cvmUrl;
    }
    return null;
  };

  const workloadUrl = getWorkloadUrl();

  const handlePauseToggle = async () => {
    setIsToggling(true);
    try {
      const response = await fetch(`/api/workloads/${workload.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": address || "",
        },
        body: JSON.stringify({
          isActive: !workload.isActive,
        }),
      });

      if (response.ok) {
        toast.success(
          `Workload ${workload.isActive ? "paused" : "resumed"} successfully`
        );
        onUpdate();
      } else {
        toast.error(`Failed to ${workload.isActive ? "pause" : "resume"} workload`);
      }
    } catch (error) {
      console.error("Error toggling workload:", error);
      toast.error(`Error ${workload.isActive ? "pausing" : "resuming"} workload`);
    } finally {
      setIsToggling(false);
    }
  };

  const handleEdit = async (data: any) => {
    setIsEditing(true);
    try {
      const response = await fetch(`/api/workloads/${workload.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": address || "",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update workload");
      }

      toast.success("Workload updated successfully!");
      setShowEditModal(false);
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update workload");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/workloads/${workload.id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": address || "",
        },
      });

      if (response.ok) {
        toast.success("Workload deleted successfully");
        setShowDeleteConfirm(false);
        onUpdate();
      } else {
        toast.error("Failed to delete workload");
      }
    } catch (error) {
      console.error("Error deleting workload:", error);
      toast.error("Error deleting workload");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.2s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Workload Name & Provider - Top */}
        <div
          style={{
            marginBottom: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              marginBottom: '0.375rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
            }}
          >
            {providerLabels[workload.provider] || workload.provider}
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '0.5rem',
            }}
          >
            {workload.name}
          </div>

          {/* Workload ID */}
          <div
            style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              fontFamily: 'monospace',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>ID: {workload.id}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(workload.id);
                toast.success('Workload ID copied');
              }}
              title="Copy ID"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(138, 137, 255, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>

          {/* Created At & Heartbeat Interval */}
          <div
            style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.5)',
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Created:</span>{' '}
              {format(new Date(workload.createdAt), 'MMM d, yyyy')}
            </div>
            <div>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Heartbeat:</span>{' '}
              Every {workload.heartbeatInterval} min
            </div>
          </div>
        </div>

        {/* Status and Actions - Bottom */}
        <div style={{ marginTop: 'auto' }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
            }}
          >
            Verification Status
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              marginBottom: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  background: workload.isActive
                    ? 'rgba(74, 222, 128, 0.1)'
                    : 'rgba(156, 163, 175, 0.1)',
                  border: `1px solid ${
                    workload.isActive
                      ? 'rgba(74, 222, 128, 0.3)'
                      : 'rgba(156, 163, 175, 0.3)'
                  }`,
                  color: workload.isActive ? '#4ade80' : '#9ca3af',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: workload.isActive ? '#4ade80' : '#9ca3af',
                    boxShadow: workload.isActive
                      ? '0 0 6px rgba(74, 222, 128, 0.5)'
                      : 'none',
                  }}
                />
                {workload.isActive ? 'ACTIVE' : 'INACTIVE'}
              </div>

              {/* Visit Workload URL Button */}
              {workloadUrl && (
                <a
                  href={workloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: 'rgba(138, 137, 255, 0.1)',
                    border: '1px solid rgba(138, 137, 255, 0.3)',
                    color: '#8a89ff',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(138, 137, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(138, 137, 255, 0.1)';
                  }}
                >
                  Visit Workload
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              )}
            </div>

            {workload.lastHeartbeat && (
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                {format(new Date(workload.lastHeartbeat), 'MMM d, h:mm a')}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <Button
              variant="outline"
              size="small"
              onClick={handlePauseToggle}
              disabled={isToggling}
              style={{ flex: 1 }}
            >
              {isToggling
                ? workload.isActive
                  ? "Pausing..."
                  : "Resuming..."
                : workload.isActive
                ? "Pause"
                : "Resume"}
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => setShowEditModal(true)}
              disabled={isEditing}
              style={{ flex: 1 }}
            >
              Edit
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              size="small"
              className="button-destructive"
              style={{ flex: 1 }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Workload"
        >
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ marginBottom: "1rem" }}>
              Are you sure you want to delete{" "}
              <strong style={{ color: "#8a89ff" }}>{workload.name}</strong>?
            </p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem" }}>
              This action cannot be undone. The workload will stop receiving
              heartbeats and verification requests.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Button
              variant="outline"
              size="large"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              size="large"
              onClick={handleDelete}
              disabled={isDeleting}
              className="button-destructive"
              style={{ flex: 1 }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </Modal>
      )}

      {/* Edit Workload Modal */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => !isEditing && setShowEditModal(false)}
          title="Edit Workload"
        >
          <WorkloadForm
            onSubmit={handleEdit}
            onCancel={() => setShowEditModal(false)}
            isSubmitting={isEditing}
            initialValues={{
              provider: workload.provider,
              name: workload.name,
              config: workload.config,
              heartbeatInterval: workload.heartbeatInterval,
            }}
            isEditing={true}
          />
        </Modal>
      )}
    </>
  );
}
