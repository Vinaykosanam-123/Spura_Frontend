"use client";

import React from "react";
import type { DiagramTree, DiagramTreeNode } from "@/lib/trace/diagram-parser";

interface BinaryTreeDiagramProps {
  trees: DiagramTree[];
}

export function BinaryTreeDiagram({ trees }: BinaryTreeDiagramProps) {
  if (!trees || trees.length === 0) {
    return (
      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", padding: "1.5rem 1rem" }}>
        No binary tree structures active in memory.
      </div>
    );
  }

  const layoutTree = (rootId: string, nodes: Record<string, DiagramTreeNode>) => {
    const positioned: Record<string, { x: number; y: number; node: DiagramTreeNode }> = {};
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

    const assignCoords = (nodeId: string, x: number, y: number, spread: number) => {
      const node = nodes[nodeId];
      if (!node) return;

      positioned[nodeId] = { x, y, node };

      if (node.leftId && nodes[node.leftId]) {
        const lx = x - spread;
        const ly = y + 60;
        lines.push({ x1: x, y1: y, x2: lx, y2: ly });
        assignCoords(node.leftId, lx, ly, Math.max(26, spread * 0.55));
      }

      if (node.rightId && nodes[node.rightId]) {
        const rx = x + spread;
        const ry = y + 60;
        lines.push({ x1: x, y1: y, x2: rx, y2: ry });
        assignCoords(node.rightId, rx, ry, Math.max(26, spread * 0.55));
      }
    };

    assignCoords(rootId, 220, 36, 90);
    return { positioned, lines };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
      {trees.map((tree, tIdx) => {
        const { positioned, lines } = layoutTree(tree.rootId, tree.nodes);
        const nodeCount = Object.keys(tree.nodes).length;

        return (
          <div key={tIdx} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
              <span>Binary Tree: <strong style={{ color: "var(--text-primary)" }}>{tree.name}</strong></span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{nodeCount} nodes</span>
            </div>

            <div
              style={{
                backgroundColor: "var(--bg-code)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                overflowX: "auto",
                padding: "0.75rem",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <svg
                width="440"
                height="220"
                viewBox="0 0 440 220"
                className="w-full max-w-[440px] h-auto"
                style={{ overflow: "visible" }}
              >
                {lines.map((l, lIdx) => (
                  <line
                    key={lIdx}
                    x1={l.x1}
                    y1={l.y1}
                    x2={l.x2}
                    y2={l.y2}
                    stroke="var(--border-strong)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ))}

                {Object.values(positioned).map(({ x, y, node }) => {
                  const hasPointers = node.pointers.length > 0;
                  return (
                    <g key={node.id} transform={`translate(${x}, ${y})`}>
                      {hasPointers && (
                        <circle r="22" fill="rgba(245, 158, 11, 0.2)" stroke="#F59E0B" strokeWidth="1.5" />
                      )}

                      <circle
                        r="18"
                        fill={hasPointers ? "#D97706" : "var(--bg-surface)"}
                        stroke={hasPointers ? "#FBBF24" : "var(--border-strong)"}
                        strokeWidth="1.5"
                      />

                      <text
                        textAnchor="middle"
                        dy="4"
                        fill={hasPointers ? "#FFFFFF" : "var(--text-primary)"}
                        fontSize="12"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {node.val}
                      </text>

                      {hasPointers && (
                        <g transform="translate(0, -25)">
                          <rect
                            x="-24"
                            y="-12"
                            width="48"
                            height="14"
                            rx="3"
                            fill="#F59E0B"
                          />
                          <text
                            textAnchor="middle"
                            dy="-2"
                            fill="#090C10"
                            fontSize="8"
                            fontWeight="700"
                            fontFamily="sans-serif"
                          >
                            {node.pointers[0]}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
