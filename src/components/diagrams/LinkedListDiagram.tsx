"use client";

import React from "react";
import type { DiagramLinkedList } from "@/lib/trace/diagram-parser";

interface LinkedListDiagramProps {
  lists: DiagramLinkedList[];
}

export function LinkedListDiagram({ lists }: LinkedListDiagramProps) {
  if (!lists || lists.length === 0) {
    return (
      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", padding: "1.5rem 1rem" }}>
        No linked list structures active in memory.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
      {lists.map((list, lIdx) => (
        <div key={lIdx} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Linked List: <strong style={{ color: "var(--text-primary)" }}>{list.name}</strong></span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {list.nodes.length} nodes
            </span>
          </div>

          {/* SVG & HTML Nodes Chain */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              overflowX: "auto",
              padding: "2.5rem 1rem 1.25rem",
              backgroundColor: "var(--bg-code)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              minHeight: "130px",
            }}
          >
            {list.nodes.map((node, nIdx) => {
              const hasPointers = node.pointers.length > 0;
              const isLast = nIdx === list.nodes.length - 1;

              return (
                <div key={node.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  {/* Single Node Container */}
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    {/* Floating Pointer Badges pointing down */}
                    {hasPointers && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-32px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          zIndex: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "3px",
                            backgroundColor: "var(--brand-primary)",
                            color: "#fff",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.4)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {node.pointers.join(", ")}
                        </div>
                        <span style={{ color: "var(--brand-primary)", fontSize: "0.75rem", lineHeight: 0.7 }}>▼</span>
                      </div>
                    )}

                    {/* Node Visual Box */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "stretch",
                        border: hasPointers ? "1.5px solid var(--brand-primary)" : "1px solid var(--border-strong)",
                        borderRadius: "6px",
                        backgroundColor: hasPointers ? "rgba(245, 158, 11, 0.15)" : "var(--bg-surface)",
                        overflow: "hidden",
                        boxShadow: hasPointers ? "0 0 12px rgba(245, 158, 11, 0.25)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* Node Value Cell */}
                      <div
                        style={{
                          padding: "8px 14px",
                          fontSize: "0.95rem",
                          fontWeight: 600,
                          fontFamily: "monospace",
                          color: "var(--text-primary)",
                          minWidth: "36px",
                          textAlign: "center",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        {node.val}
                      </div>

                      {/* Next Pointer Pin */}
                      <div
                        style={{
                          padding: "8px 10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            backgroundColor: node.nextId ? "var(--accent-cyan)" : "var(--accent-rose)",
                          }}
                        />
                      </div>
                    </div>

                    {/* Node ID label below */}
                    <span
                      style={{
                        marginTop: "4px",
                        fontSize: "0.65rem",
                        color: "var(--text-muted)",
                        fontFamily: "monospace",
                      }}
                    >
                      #{node.id}
                    </span>
                  </div>

                  {/* Connecting Arrow between nodes */}
                  {!isLast ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0 6px",
                      }}
                    >
                      <svg width="36" height="20" viewBox="0 0 36 20">
                        <defs>
                          <marker
                            id={`arrowhead-${node.id}`}
                            markerWidth="6"
                            markerHeight="6"
                            refX="5"
                            refY="3"
                            orient="auto"
                          >
                            <polygon points="0 0, 6 3, 0 6" fill="#F59E0B" />
                          </marker>
                        </defs>
                        <line
                          x1="2"
                          y1="10"
                          x2="30"
                          y2="10"
                          stroke="#F59E0B"
                          strokeWidth="2"
                          markerEnd={`url(#arrowhead-${node.id})`}
                        />
                      </svg>
                    </div>
                  ) : (
                    // Last node pointing to NULL
                    <div style={{ display: "flex", alignItems: "center", paddingLeft: "6px" }}>
                      <svg width="28" height="20" viewBox="0 0 28 20">
                        <defs>
                          <marker id="arrow-null" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                            <polygon points="0 0, 5 2.5, 0 5" fill="#64748B" />
                          </marker>
                        </defs>
                        <line x1="2" y1="10" x2="22" y2="10" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#arrow-null)" />
                      </svg>
                      <span
                        style={{
                          padding: "2px 5px",
                          borderRadius: "3px",
                          backgroundColor: "rgba(244, 63, 94, 0.1)",
                          color: "var(--accent-rose)",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          fontFamily: "monospace",
                          border: "1px dashed rgba(244, 63, 94, 0.25)",
                        }}
                      >
                        NULL
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
