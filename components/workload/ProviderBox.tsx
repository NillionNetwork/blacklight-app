"use client";

import { Card } from "@/components/ui/Card";
import Image from "next/image";

interface ProviderBoxProps {
  name: string;
  logo: string;
  logoImage?: string;
  onClick: () => void;
  active?: boolean;
}

export function ProviderBox({
  name,
  logo,
  logoImage,
  onClick,
  active = false,
}: ProviderBoxProps) {
  return (
    <Card
      onClick={onClick}
      style={{
        padding: "1.5rem",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.2s",
        border: active
          ? "2px solid #8a89ff"
          : "1px solid rgba(255,255,255,0.1)",
        background: active
          ? "rgba(138, 137, 255, 0.1)"
          : "rgba(255, 255, 255, 0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        {logoImage ? (
          <Image
            src={logoImage}
            alt={name}
            width={48}
            height={48}
            style={{ objectFit: "contain", filter: active ? "none" : "grayscale(50%)" }}
          />
        ) : (
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: active ? "#8a89ff" : "rgba(255,255,255,0.5)",
            }}
          >
            {logo}
          </div>
        )}
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: "600",
            color: active ? "#8a89ff" : "rgba(255,255,255,0.9)",
          }}
        >
          {name}
        </span>
      </div>
    </Card>
  );
}
