"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { l1Migration } from "@/config";

/** The one thing to do next: the L1 node app for this network, or the L1 docs if it has none. */
export function L1PrimaryAction() {
  const href = l1Migration.appUrl ?? l1Migration.docsUrl;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="l1-button l1-button-primary"
    >
      {l1Migration.appUrl
        ? `Try Blacklight L1 on ${l1Migration.networkLabel}`
        : "Learn about Blacklight L1"}
      <ArrowRight size={18} />
    </a>
  );
}

interface L1NoticeProps {
  /** Add a link back to the landing page, for pages a retired CTA used to lead to. */
  backToHome?: boolean;
}

/** Explains that L2 registrations are closed, and where to go instead. */
export function L1Notice({ backToHome = false }: L1NoticeProps) {
  return (
    <div className="l1-notice">
      <div className="l1-notice-label">Blacklight is moving to L1</div>
      <p>
        New node and app registrations on the Blacklight L2 are closed, as
        Blacklight moves to <b>Blacklight L1</b> on Ethereum.{" "}
        {l1Migration.appUrl
          ? `You can already run a Blacklight L1 node on ${l1Migration.networkLabel}.`
          : "The Blacklight L1 node app is coming soon."}
      </p>
      <p>
        Already running an L2 node? You can keep managing it, its stake and its
        rewards from the dashboard.
      </p>
      <div className="l1-notice-actions">
        <L1PrimaryAction />
        <Link href="/nodes" className="l1-button l1-button-secondary">
          Manage your L2 nodes
        </Link>
        {backToHome && (
          <Link href="/" className="l1-button l1-button-secondary">
            Back to home
          </Link>
        )}
      </div>
    </div>
  );
}

/** A scrolling banner across the top of every page, repeating the L1 notice. */
export function L1Banner() {
  const message = (
    <>
      Blacklight is moving to Blacklight L1 on Ethereum. New node and app
      registrations on the Blacklight L2 are closed; existing L2 nodes can still
      be managed from the dashboard.{" "}
      {l1Migration.appUrl ? (
        <a href={l1Migration.appUrl} target="_blank" rel="noopener noreferrer">
          Try Blacklight L1 on {l1Migration.networkLabel} →
        </a>
      ) : (
        "The Blacklight L1 node app is coming soon."
      )}
    </>
  );

  // Two identical halves, so translating the track by -50% loops without a seam. Only the first
  // copy is read out; the rest are visual repeats.
  return (
    <section className="l1-banner" aria-label="Blacklight L1 announcement">
      <div className="l1-banner-track">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="l1-banner-item" aria-hidden={i > 0}>
            {message}
          </span>
        ))}
      </div>
    </section>
  );
}
