"use client";

import React from "react";
import type { DiagramStack } from "@/lib/trace/diagram-parser";

interface StackQueueDiagramProps {
  stacks: DiagramStack[];
}

export function StackQueueDiagram({ stacks }: StackQueueDiagramProps) {
  if (!stacks || stacks.length === 0) {
    return (
      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", padding: "1.5rem 1rem" }}>
        No active stack structures in memory.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
      {stacks.map((st, idx) => (
        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Stack: <strong style={{ color: "var(--text-primary)" }}>{st.name}</strong>
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {st.items.length} items
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              minHeight: "180px",
              padding: "1rem",
              backgroundColor: "var(--bg-code)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column-reverse",
                alignItems: "center",
                width: "140px",
                minHeight: "150px",
                borderLeft: "2px solid var(--brand-primary)",
                borderRight: "2px solid var(--brand-primary)",
                borderBottom: "3px solid var(--brand-primary)",
                borderRadius: "0 0 6px 6px",
                padding: "4px",
                gap: "3px",
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                position: "relative",
              }}
            >
              {st.items.length === 0 ? (
                <div
                  style={{
                    margin: "auto",
                    color: "var(--text-muted)",
                    fontSize: "0.75rem",
                    fontStyle: "italic",
                  }}
                >
                  (Empty Stack)
                </div>
              ) : (
                st.items.map((val, itIdx) => {
                  const isTop = itIdx === st.items.length - 1;
                  return (
                    <div
                      key={itIdx}
                      style={{
                        position: "relative",
                        width: "100%",
                        padding: "6px 8px",
                        textAlign: "center",
                        backgroundColor: isTop ? "rgba(245, 158, 11, 0.2)" : "var(--bg-surface)",
                        border: isTop ? "1.5px solid var(--brand-primary)" : "1px solid var(--border-subtle)",
                        borderRadius: "4px",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        fontFamily: "monospace",
                        color: "var(--text-primary)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {val}
                      {isTop && (
                        <div
                          style={{
                            position: "absolute",
                            right: "-65px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--brand-primary)",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          ◀ TOP
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
