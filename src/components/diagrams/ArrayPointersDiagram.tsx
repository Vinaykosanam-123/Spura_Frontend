"use client";

import React, { useState } from "react";
import type { DiagramArray } from "@/lib/trace/diagram-parser";

interface ArrayPointersDiagramProps {
  arrays: DiagramArray[];
}

export function ArrayPointersDiagram({ arrays }: ArrayPointersDiagramProps) {
  const [viewMode, setViewMode] = useState<"boxes" | "bars">("boxes");

  if (!arrays || arrays.length === 0) {
    return (
      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", padding: "1.5rem 1rem" }}>
        No active arrays in scope.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
      {arrays.map((arr) => {
        const pointersByIndex = new Map<number, typeof arr.pointers>();
        for (const p of arr.pointers) {
          const list = pointersByIndex.get(p.index) || [];
          list.push(p);
          pointersByIndex.set(p.index, list);
        }

        const maxVal = Math.max(
          1,
          ...arr.items.map((it) => {
            const num = parseFloat(it.value);
            return isNaN(num) ? 1 : Math.abs(num);
          })
        );

        return (
          <div key={arr.id} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Array: <strong style={{ color: "var(--text-primary)" }}>{arr.name}</strong>
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  (len: {arr.items.length})
                </span>
              </div>

              <div style={{ display: "flex", gap: "2px", backgroundColor: "var(--bg-code)", padding: "2px", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
                <button
                  onClick={() => setViewMode("boxes")}
                  style={{
                    padding: "2px 8px",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor: viewMode === "boxes" ? "var(--bg-surface)" : "transparent",
                    color: viewMode === "boxes" ? "var(--text-primary)" : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("bars")}
                  style={{
                    padding: "2px 8px",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor: viewMode === "bars" ? "var(--bg-surface)" : "transparent",
                    color: viewMode === "bars" ? "var(--text-primary)" : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  Bars
                </button>
              </div>
            </div>

            {/* Pointer Legend Badges */}
            {arr.pointers.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {arr.pointers.map((p, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.7rem",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      backgroundColor: `${p.color}18`,
                      color: p.color,
                      border: `1px solid ${p.color}40`,
                      fontWeight: 600,
                    }}
                  >
                    <span>▼ {p.name}</span>
                    <span style={{ color: "var(--text-secondary)" }}>= {p.index}</span>
                  </span>
                ))}
              </div>
            )}

            {/* GRID BOXES VIEW */}
            {viewMode === "boxes" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  overflowX: "auto",
                  padding: "2.75rem 1rem 1rem",
                  backgroundColor: "var(--bg-code)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  minHeight: "130px",
                }}
              >
                <div style={{ display: "flex", gap: "4px", margin: "0 auto" }}>
                  {arr.items.map((item) => {
                    const cellPointers = pointersByIndex.get(item.index) || [];
                    const hasPointers = cellPointers.length > 0;

                    const isInActiveRange =
                      arr.activeRange === undefined ||
                      (item.index >= arr.activeRange.start && item.index <= arr.activeRange.end);

                    const isMid = cellPointers.some((p) => p.name.toLowerCase() === "mid");

                    return (
                      <div
                        key={item.index}
                        style={{
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        {/* Downward Pointer Arrows Stack */}
                        {hasPointers && (
                          <div
                            style={{
                              position: "absolute",
                              top: "-38px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              zIndex: 10,
                            }}
                          >
                            <div style={{ display: "flex", gap: "2px" }}>
                              {cellPointers.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  style={{
                                    backgroundColor: p.color,
                                    color: "#fff",
                                    fontSize: "0.65rem",
                                    fontWeight: 700,
                                    padding: "1px 5px",
                                    borderRadius: "3px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {p.name}
                                </span>
                              ))}
                            </div>
                            <span
                              style={{
                                color: cellPointers[0].color,
                                fontSize: "0.8rem",
                                lineHeight: 0.7,
                              }}
                            >
                              ▼
                            </span>
                          </div>
                        )}

                        {/* Top Index Number */}
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontFamily: "monospace",
                            color: isInActiveRange ? "var(--text-muted)" : "rgba(100, 116, 139, 0.35)",
                            marginBottom: "3px",
                          }}
                        >
                          {item.index}
                        </span>

                        {/* Value Box */}
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "5px",
                            fontFamily: "monospace",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            backgroundColor: isMid
                              ? "rgba(45, 212, 191, 0.2)"
                              : hasPointers
                              ? "rgba(245, 158, 11, 0.2)"
                              : isInActiveRange
                              ? "var(--bg-surface)"
                              : "var(--bg-surface-elevated)",
                            color: isInActiveRange ? "var(--text-primary)" : "var(--text-muted)",
                            border: isMid
                              ? "1.5px solid var(--accent-teal, #2DD4BF)"
                              : hasPointers
                              ? "1.5px solid var(--brand-primary)"
                              : isInActiveRange
                              ? "1px solid var(--border-strong)"
                              : "1px dashed var(--border-subtle)",
                            boxShadow: isMid
                              ? "0 0 10px rgba(45, 212, 191, 0.25)"
                              : hasPointers
                              ? "0 0 10px rgba(245, 158, 11, 0.25)"
                              : "none",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {item.value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BARS VIEW */}
            {viewMode === "bars" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "4px",
                  overflowX: "auto",
                  padding: "0.75rem",
                  backgroundColor: "var(--bg-code)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  height: "140px",
                }}
              >
                {arr.items.map((item) => {
                  const num = parseFloat(item.value);
                  const validNum = isNaN(num) ? 1 : Math.max(1, Math.abs(num));
                  const heightPercent = Math.max(15, Math.round((validNum / maxVal) * 100));
                  const cellPointers = pointersByIndex.get(item.index) || [];
                  const hasPointers = cellPointers.length > 0;

                  return (
                    <div
                      key={item.index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: "100%",
                        justifyContent: "flex-end",
                        flex: 1,
                        minWidth: "24px",
                      }}
                    >
                      <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "var(--text-secondary)", marginBottom: "2px" }}>
                        {item.value}
                      </span>
                      <div
                        style={{
                          width: "100%",
                          height: `${heightPercent}%`,
                          backgroundColor: hasPointers ? cellPointers[0].color : "var(--brand-primary)",
                          borderRadius: "3px 3px 0 0",
                          transition: "height 0.2s ease",
                        }}
                      />
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "3px" }}>
                        {item.index}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
