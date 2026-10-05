"use client";

import { L1Notice } from "@/components/l1";

// New node registrations on the L2 are closed, so the setup guide is retired. Existing nodes are
// managed from /nodes.
export default function SetupPage() {
  return (
    <div className="l1-page">
      <h1 style={{ fontSize: "2rem", margin: 0, textAlign: "center" }}>
        Node setup has moved to Blacklight L1
      </h1>
      <L1Notice backToHome />
    </div>
  );
}
