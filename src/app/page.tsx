'use client';

import React, { useState } from "react";
import Link from "next/link";

interface CurriculumModule {
  id: string;
  badge: string;
  weeks: string;
  title: string;
  lectures: number;
  problems: number;
  description: string;
  topics: string[];
  visualizerAvailable?: boolean;
}

const CURRICULUM_MODULES: CurriculumModule[] = [
  {
    id: "mod-1",
    badge: "Module 1",
    weeks: "Weeks 1 - 2",
    title: "Programming Foundations, Complexity & Bit Manipulation",
    lectures: 14,
    problems: 25,
    description: "Build ironclad coding foundations, memory mental models, and mathematical intuition before diving into complex data structures.",
    topics: [
      "C++, Java & Python syntax nuances & memory layout",
      "Asymptotic notations: Big-O, Big-Omega, Big-Theta",
      "Time & Space complexity analysis of iterative & recursive code",
      "Bitwise operators, bit masking, single number, and subset generation with bits",
      "Basic mathematics for competitive programming & sieve of Eratosthenes",
    ],
  },
  {
    id: "mod-2",
    badge: "Module 2",
    weeks: "Weeks 3 - 5",
    title: "Arrays, Two Pointers, Sliding Window & Binary Search",
    lectures: 20,
    problems: 60,
    visualizerAvailable: true,
    description: "Master the most frequently asked patterns in Tier-1 technical interviews with real-time pointer visualization.",
    topics: [
      "Prefix Sums & 2D Matrix Prefix queries",
      "Two-Pointer Technique (opposite ends, same direction, fast & slow)",
      "Fixed & Variable Sliding Window patterns",
      "Kadane's Algorithm & Maximum Subarray variations",
      "Binary Search fundamentals & search space reduction (Search in Rotated Array, Peak Element)",
      "Binary Search on Answer (Book Allocation, Aggressive Cows, Painter's Partition)",
    ],
  },
  {
    id: "mod-3",
    badge: "Module 3",
    weeks: "Weeks 6 - 8",
    title: "Linked Lists, Recursion & Backtracking Masterclass",
    lectures: 22,
    problems: 75,
    visualizerAvailable: true,
    description: "Watch linked list pointer inversions and recursion trees unfold dynamically on screen instead of on paper.",
    topics: [
      "Singly & Doubly Linked List operations & memory allocation",
      "Pointer manipulation: Reverse Linked List, Palindrome Linked List",
      "Floyd's Tortoise & Hare algorithm (Cycle Detection & Starting Node)",
      "Merge K Sorted Lists & Flattening a Multi-level Linked List",
      "Recursion mental model & Call-Stack frame tracking",
      "Backtracking blueprints: N-Queens, Sudoku Solver, Subsets, Permutations & Combinations",
    ],
  },
  {
    id: "mod-4",
    badge: "Module 4",
    weeks: "Weeks 9 - 11",
    title: "Stacks, Queues, Binary Trees & Binary Search Trees",
    lectures: 24,
    problems: 80,
    visualizerAvailable: true,
    description: "Deconstruct non-linear data structures with dynamic SVG tree branching and monotonic stack visualization.",
    topics: [
      "Monotonic Stack pattern (Next Greater Element, Largest Rectangle in Histogram, Trapping Rain Water)",
      "LRU & LFU Cache implementation using doubly linked lists & hash maps",
      "Binary Tree Traversals (Inorder, Preorder, Postorder, Level-Order, Morris Traversal)",
      "Lowest Common Ancestor (LCA), Diameter of Tree, Maximum Path Sum",
      "Binary Search Tree (BST) validation, search, insert, and delete",
      "Heaps & Priority Queues (Min-Heap, Max-Heap, Top K Frequent Elements, Median from Data Stream)",
    ],
  },
  {
    id: "mod-5",
    badge: "Module 5",
    weeks: "Weeks 12 - 14",
    title: "Dynamic Programming & Graph Theory",
    lectures: 26,
    problems: 90,
    description: "Break down tough 60-minute MAANG interview hurdles into simple 5-step recursive-to-tabulation state transitions.",
    topics: [
      "Top-Down Memoization vs Bottom-Up Tabulation state machines",
      "1D DP: Climbing Stairs, House Robber, Coin Change, Longest Increasing Subsequence (LIS)",
      "2D DP: 0/1 Knapsack, Unbounded Knapsack, Longest Common Subsequence (LCS), Edit Distance",
      "DP on Trees & Partition DP",
      "Graph representations: Adjacency List & Matrix",
      "Graph Traversals: BFS & DFS with cycle detection",
      "Shortest Path algorithms: Dijkstra, Bellman-Ford & Floyd-Warshall",
      "Disjoint Set Union (DSU) & Minimum Spanning Tree (Kruskal / Prim)",
    ],
  },
  {
    id: "mod-6",
    badge: "Module 6",
    weeks: "Weeks 15 - 16",
    title: "System Design, OOPS & Placement Interview Drives",
    lectures: 14,
    problems: 30,
    description: "Transform your coding ability into real software engineering leadership with system architecture and mock interviews.",
    topics: [
      "Object-Oriented Programming (OOP) & SOLID design principles",
      "Low-Level Design (LLD) case studies: Parking Lot, Splitwise, BookMyShow",
      "High-Level Design (HLD) basics: Load balancers, caching, database sharding, microservices",
      "Resume Roasting & ATS-optimized portfolio project building",
      "1-on-1 Mock Technical & HR Interviews with FAANG engineers",
    ],
  },
];

interface ProblemHighlight {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  companies: string[];
  diagramLabel: string;
}

const FEATURED_PROBLEMS: ProblemHighlight[] = [
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    topic: "Arrays & Pointers",
    companies: ["Google", "Amazon", "Apple", "Microsoft"],
    diagramLabel: "Array & Pointer Visualizer",
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    topic: "Search Space Reduction",
    companies: ["Microsoft", "Meta", "Google"],
    diagramLabel: "Low/Mid/High Pointer Bounds",
  },
  {
    slug: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "Easy",
    topic: "Linked Lists",
    companies: ["Amazon", "Bloomberg", "Uber"],
    diagramLabel: "Node Pointer Inversion SVG",
  },
  {
    slug: "invert-binary-tree",
    title: "Invert Binary Tree",
    difficulty: "Easy",
    topic: "Binary Trees",
    companies: ["Google", "Twitter", "Amazon"],
    diagramLabel: "Recursive Node Swapping Tree",
  },
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    topic: "Stacks",
    companies: ["Meta", "Microsoft", "LinkedIn"],
    diagramLabel: "LIFO Stack Container Animation",
  },
];

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Is this course taught in Telugu or English?",
    answer: "The classes are conducted with Telugu & English bilingual explanation. Core technical terminology, code syntax, and interview communication are kept in English, while intuition, memory behavior, and logic deduction are explained natively in conversational Telugu so no student gets left behind.",
  },
  {
    question: "What if I miss a live session or have college semester exams?",
    answer: "Every single live class is recorded in crystal-clear 1080p HD and uploaded to your dashboard within 2 hours of class completion. You receive 2 full years of unlimited access to all recordings, slides, notes, and problem solution code with zero buffering.",
  },
  {
    question: "How is the diagrammatic visualizer different from standard platforms?",
    answer: "Most platforms only provide a pass/fail console string. SPURA visualizes runtime data structures in memory: watch your array pointers slide, linked list arrows re-link, and recursion trees branch out step-by-step so you develop true memory intuition.",
  },
  {
    question: "I am a complete beginner in 2nd or 3rd year. Can I join Batch 2.0?",
    answer: "Yes, absolutely! Week 1 and Week 2 start from the absolute ground up: programming syntax, time and space complexity, memory layouts, and problem-solving patterns. You do not need prior DSA experience—just a laptop and dedication.",
  },
  {
    question: "How does 1-on-1 TA doubt support work?",
    answer: "All Batch 2.0 students receive private access to our dedicated Discord support channels where Teaching Assistants (TAs) answer coding queries, debug runtime errors, and host daily live audio doubt-clearing rooms.",
  },
  {
    question: "What is the Batch 2.0 schedule and class timing?",
    answer: "Live sessions take place 4 to 5 days a week in the evening (usually 8:00 PM – 9:30 PM IST) so they do not conflict with college schedules or day jobs. Full schedule and calendar invites are shared upon enrollment.",
  },
];

export default function Home() {
  const [activeModule, setActiveModule] = useState<string>("mod-1");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [demoStep, setDemoStep] = useState<number>(2);

  const demoSteps = [
    {
      step: 1,
      line: "left = 0, right = 3",
      msg: "Pointers initialized at opposite ends of sorted array.",
      leftIdx: 0,
      rightIdx: 3,
      sum: "2 + 15 = 17",
      status: "17 > 9 → Decrement right pointer",
    },
    {
      step: 2,
      line: "right = 2",
      msg: "Checking new pair: nums[0] + nums[2]",
      leftIdx: 0,
      rightIdx: 2,
      sum: "2 + 11 = 13",
      status: "13 > 9 → Decrement right pointer",
    },
    {
      step: 3,
      line: "right = 1",
      msg: "Checking new pair: nums[0] + nums[1]",
      leftIdx: 0,
      rightIdx: 1,
      sum: "2 + 7 = 9",
      status: "Match Found! Return indices [0, 1]",
    },
  ];

  const currentDemo = demoSteps[demoStep - 1];

  return (
    <div className="flex flex-col flex-1 bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* 1. TOP MARQUEE BANNER */}
      <div
        style={{
          backgroundColor: "rgba(245, 158, 11, 0.12)",
          borderBottom: "1px solid rgba(245, 158, 11, 0.25)",
          padding: "0.6rem 1rem",
          textAlign: "center",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "#FDE68A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
        }}
      >
        <span
          style={{
            backgroundColor: "#ef4444",
            color: "#ffffff",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "0.7rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          LIVE
        </span>
        <span>
          Batch 2.0 Admissions Open: 100+ Live Classes • Telugu &amp; English • 2-Year Replay • Early Bird at ₹2,399
        </span>
        <a
          href="#batch-2"
          style={{
            color: "#ffffff",
            textDecoration: "underline",
            fontWeight: 700,
            marginLeft: "0.25rem",
          }}
        >
          Enroll Now →
        </a>
      </div>

      {/* 2. HERO SECTION */}
      <section
        style={{
          position: "relative",
          padding: "4.5rem 1.5rem 3.5rem",
          maxWidth: "1200px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "350px",
            background: "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(234, 88, 12, 0.03) 50%, transparent 80%)",
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#FBBF24",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              padding: "6px 16px",
              borderRadius: "30px",
              marginBottom: "1.75rem",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              boxShadow: "0 0 15px rgba(245, 158, 11, 0.2)",
            }}
          >
            <span>✦</span>
            <span>India&apos;s 1st Visual Algorithmic Platform • Batch 2.0 Live</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
              fontWeight: 900,
              letterSpacing: "-0.035em",
              lineHeight: 1.15,
              marginBottom: "1.5rem",
              color: "#ffffff",
              maxWidth: "960px",
              margin: "0 auto 1.5rem",
            }}
          >
            Master Data Structures, Algorithms &amp;{" "}
            <span className="gradient-text">Top-Tier Tech Placements</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
              color: "var(--text-secondary)",
              maxWidth: "760px",
              margin: "0 auto 2rem",
              lineHeight: 1.65,
            }}
          >
            Stop memorizing syntax. SPURA gives you deep algorithmic intuition with live bilingual classes
            (Telugu &amp; English), 450+ curated interview problems, and our revolutionary diagrammatic compiler
            that visualizes memory pointers, linked lists, and recursion trees in real-time.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.85rem",
              padding: "8px 18px",
              borderRadius: "8px",
              backgroundColor: "rgba(15, 19, 25, 0.88)",
              border: "1px solid var(--border-strong)",
              marginBottom: "2.5rem",
              fontSize: "0.9rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#34D399", fontWeight: 700 }}>✓ Early Bird Offer: ₹2,399</span>
            <span style={{ color: "var(--text-muted)" }}>•</span>
            <span style={{ color: "var(--text-secondary)", textDecoration: "line-through" }}>₹5,999 (60% Off)</span>
            <span style={{ color: "var(--text-muted)" }}>•</span>
            <span style={{ color: "#FBBF24", fontWeight: 600 }}>Flexible ₹749/mo</span>
            <span style={{ color: "var(--text-muted)" }}>•</span>
            <span style={{ color: "var(--text-secondary)" }}>2-Year Replay Access</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.25rem",
              flexWrap: "wrap",
              marginBottom: "3.5rem",
            }}
          >
            <a
              href="#batch-2"
              className="glow-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.95rem 2rem",
                background: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
                color: "#000000",
                borderRadius: "var(--radius-md)",
                fontWeight: 700,
                fontSize: "1.05rem",
                letterSpacing: "-0.01em",
                boxShadow: "0 4px 20px rgba(245, 158, 11, 0.45)",
              }}
            >
              <span>🔥</span>
              <span>Enroll in Batch 2.0 — ₹2,399</span>
            </a>

            <Link
              href="/coding?problem=two-sum&tab=diagram"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.95rem 1.75rem",
                backgroundColor: "var(--bg-surface)",
                color: "#ffffff",
                borderRadius: "var(--radius-md)",
                fontWeight: 600,
                fontSize: "1.05rem",
                border: "1px solid var(--border-strong)",
              }}
            >
              <span>⚡</span>
              <span>Try Visualizer Free →</span>
            </Link>

            <Link
              href="/courses"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.95rem 1.5rem",
                backgroundColor: "transparent",
                color: "var(--text-secondary)",
                borderRadius: "var(--radius-md)",
                fontWeight: 600,
                fontSize: "0.95rem",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span>📚</span>
              <span>View 16-Week Syllabus</span>
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
              padding: "1.75rem",
              backgroundColor: "rgba(15, 19, 25, 0.85)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.2rem" }}>
                5,000+
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Engineers Mentored &amp; Placed
              </div>
            </div>

            <div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#F59E0B", marginBottom: "0.2rem" }}>
                480+
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Curated Company Bank Questions
              </div>
            </div>

            <div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#34D399", marginBottom: "0.2rem" }}>
                54+ Problems
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Visual Compiler &amp; 11 DSA Labs
              </div>
            </div>

            <div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#FBBF24", marginBottom: "0.2rem" }}>
                2 Full Years
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                100+ Hrs Live + 1080p Replay
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE VISUALIZER SHOWCASE */}
      <section
        style={{
          padding: "4.5rem 1.5rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--brand-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Visual Algorithmic Compiler
          </div>
          <h2 style={{ fontSize: "2.3rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.85rem" }}>
            Don&apos;t Just Memorize Code. <span className="gradient-text">See It Run in Memory.</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "680px", margin: "0 auto" }}>
            Most students fail DSA interviews because memory pointers, linked list arrows, and tree recursions are
            invisible. Our compiler transforms your code into step-by-step interactive diagrams.
          </p>
        </div>

        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-strong)",
            boxShadow: "var(--shadow-elevated)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.75rem 1.25rem",
              backgroundColor: "rgba(9, 12, 16, 0.85)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#EF4444" }} />
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#F59E0B" }} />
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10B981" }} />
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                Problem: Two Sum (Sorted Two Pointers Simulation)
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                onClick={() => setDemoStep((s) => Math.max(1, s - 1))}
                disabled={demoStep === 1}
                style={{
                  padding: "4px 10px",
                  fontSize: "0.75rem",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: demoStep === 1 ? "var(--text-muted)" : "var(--text-primary)",
                  borderRadius: "4px",
                  fontWeight: 600,
                }}
              >
                ◀ Prev Step
              </button>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                Step {demoStep} of 3
              </span>
              <button
                onClick={() => setDemoStep((s) => Math.min(3, s + 1))}
                disabled={demoStep === 3}
                style={{
                  padding: "4px 10px",
                  fontSize: "0.75rem",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: demoStep === 3 ? "var(--text-muted)" : "var(--text-primary)",
                  borderRadius: "4px",
                  fontWeight: 600,
                }}
              >
                Next Step ▶
              </button>
            </div>
          </div>

          <div className="responsive-grid-2col" style={{ minHeight: "340px", gap: 0 }}>
            <div
              style={{
                backgroundColor: "var(--bg-code)",
                padding: "1.5rem",
                borderRight: "1px solid var(--border-subtle)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "0.85rem",
                lineHeight: 1.7,
                color: "#e2e8f0",
              }}
            >
              <div style={{ color: "#64748b", marginBottom: "0.5rem" }}>{"// Two Pointers on Sorted Array"}</div>
              <div><span style={{ color: "#f43f5e" }}>def</span> <span style={{ color: "#FBBF24" }}>twoSum</span>(nums, target):</div>
              <div style={{ paddingLeft: "1.25rem", color: demoStep === 1 ? "#FBBF24" : "#e2e8f0", backgroundColor: demoStep === 1 ? "rgba(245, 158, 11, 0.15)" : "transparent" }}>
                left, right = 0, len(nums) - 1
              </div>
              <div style={{ paddingLeft: "1.25rem" }}>
                <span style={{ color: "#f43f5e" }}>while</span> left &lt; right:
              </div>
              <div style={{ paddingLeft: "2.5rem" }}>
                curr_sum = nums[left] + nums[right]
              </div>
              <div style={{ paddingLeft: "2.5rem", color: demoStep === 3 ? "#34D399" : "#e2e8f0", backgroundColor: demoStep === 3 ? "rgba(16, 185, 129, 0.15)" : "transparent" }}>
                <span style={{ color: "#f43f5e" }}>if</span> curr_sum == target:
              </div>
              <div style={{ paddingLeft: "3.75rem", color: demoStep === 3 ? "#34D399" : "#e2e8f0" }}>
                <span style={{ color: "#f43f5e" }}>return</span> [left, right]
              </div>
              <div style={{ paddingLeft: "2.5rem", color: demoStep < 3 ? "#FBBF24" : "#e2e8f0", backgroundColor: demoStep < 3 ? "rgba(245, 158, 11, 0.1)" : "transparent" }}>
                <span style={{ color: "#f43f5e" }}>elif</span> curr_sum &gt; target:
              </div>
              <div style={{ paddingLeft: "3.75rem" }}>
                right -= 1
              </div>
              <div style={{ paddingLeft: "2.5rem" }}>
                <span style={{ color: "#f43f5e" }}>else</span>:
              </div>
              <div style={{ paddingLeft: "3.75rem" }}>
                left += 1
              </div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(15, 19, 25, 0.85)",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--brand-primary)", textTransform: "uppercase" }}>
                    Live Array &amp; Pointers State
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
                    Target = 9
                  </span>
                </div>

                <div style={{ marginBottom: "1.75rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    nums: [2, 7, 11, 15]
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {[2, 7, 11, 15].map((val, idx) => {
                      const isLeft = idx === currentDemo.leftIdx;
                      const isRight = idx === currentDemo.rightIdx;
                      const isMatched = demoStep === 3 && (isLeft || isRight);

                      return (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ height: "20px", fontSize: "0.75rem", fontWeight: 700 }}>
                            {isLeft && <span style={{ color: "#2DD4BF" }}>left ↓</span>}
                            {isRight && <span style={{ color: "#F43F5E" }}>right ↓</span>}
                          </div>

                          <div
                            style={{
                              width: "100%",
                              height: "56px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.1rem",
                              fontWeight: 700,
                              borderRadius: "8px",
                              backgroundColor: isMatched
                                ? "rgba(16, 185, 129, 0.25)"
                                : isLeft || isRight
                                ? "rgba(245, 158, 11, 0.25)"
                                : "rgba(255, 255, 255, 0.05)",
                              border: `2px solid ${
                                isMatched
                                  ? "#10B981"
                                  : isLeft
                                  ? "#2DD4BF"
                                  : isRight
                                  ? "#F43F5E"
                                  : "var(--border-subtle)"
                              }`,
                              color: isMatched ? "#34D399" : "#ffffff",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {val}
                          </div>

                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                            [{idx}]
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "8px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Current Sum:</span>
                    <span style={{ fontWeight: 700, color: "#ffffff" }}>{currentDemo.sum}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: demoStep === 3 ? "#34D399" : "#FBBF24", fontWeight: 600 }}>
                    Verdict: {currentDemo.status}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Supports Arrays, Linked Lists, Trees, Stacks, Heaps, AVL, Tries, DP &amp; Graphs
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <Link
                    href="/visualize"
                    style={{
                      padding: "0.5rem 0.9rem",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid var(--border-subtle)",
                      color: "#ffffff",
                      borderRadius: "var(--radius-sm)",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                    }}
                  >
                    11 DSA Visualizers
                  </Link>
                  <Link
                    href="/coding?problem=two-sum&tab=diagram"
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "var(--brand-primary)",
                      color: "#090C10",
                      borderRadius: "var(--radius-sm)",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  >
                    Launch Compiler →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
            marginTop: "1.5rem",
          }}
        >
          {FEATURED_PROBLEMS.map((p) => (
            <Link
              key={p.slug}
              href={`/coding?problem=${p.slug}&tab=diagram`}
              className="glass-card"
              style={{
                padding: "1.1rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "0.65rem",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#F59E0B", textTransform: "uppercase" }}>
                    {p.topic}
                  </span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#10B981" }}>
                    {p.difficulty}
                  </span>
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#F8FAFC" }}>{p.title}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                  {p.diagramLabel}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                <span>{p.companies.slice(0, 3).join(" • ")}</span>
                <span style={{ color: "#FBBF24", fontWeight: 700 }}>Trace →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. WHY SPURA */}
      <section
        style={{
          padding: "4.5rem 1.5rem",
          maxWidth: "1200px",
          margin: "0 auto",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--brand-primary)",
              marginBottom: "0.5rem",
            }}
          >
            The SPURA Edge
          </div>
          <h2 style={{ fontSize: "2.3rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.85rem" }}>
            Why Students Succeed With Batch 2.0
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "620px", margin: "0 auto" }}>
            Engineered specifically to solve the biggest pitfalls in tech interview preparation: language barriers,
            lack of memory mental models, and zero doubt support.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <div className="glass-card" style={{ padding: "1.75rem" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.85rem" }}>🗣️</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem", color: "#ffffff" }}>
              Telugu &amp; English Intuition
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Never get stuck on confusing terminology. We explain complex paradigms like Dynamic Programming,
              Graph Traversal, and Recursion trees natively in clear conversational Telugu &amp; English.
            </p>
          </div>

          <div className="glass-card" style={{ padding: "1.75rem" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.85rem" }}>📹</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem", color: "#ffffff" }}>
              Interactive Live Classes + Zoho Meeting
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Attend live classes every evening where you can unmute, ask questions, and debug code live with the
              instructor. No stale pre-recorded videos.
            </p>
          </div>

          <div className="glass-card" style={{ padding: "1.75rem" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.85rem" }}>⚡</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem", color: "#ffffff" }}>
              In-Browser Visualizer Compiler
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              No local installation needed. Write code and watch your variables, pointers, linked list arrows,
              and binary tree branches animate step-by-step in memory.
            </p>
          </div>

          <div className="glass-card" style={{ padding: "1.75rem" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.85rem" }}>♾️</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem", color: "#ffffff" }}>
              2-Year Full Replay Access
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Have college semester exams or a hectic schedule? Every single class recording is archived in full
              1080p HD, accessible on-demand 24/7 with zero buffering for 2 full years.
            </p>
          </div>

          <div className="glass-card" style={{ padding: "1.75rem" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.85rem" }}>🤝</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem", color: "#ffffff" }}>
              Dedicated 1-on-1 TA Doubt Support
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Get unstuck fast. Private Discord channels with Teaching Assistants, code review support, and daily
              doubt-clearing audio rooms so you are never blocked.
            </p>
          </div>

          <div className="glass-card" style={{ padding: "1.75rem" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.85rem" }}>💼</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem", color: "#ffffff" }}>
              System Design &amp; Mock Interviews
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Go beyond basic DSA. Learn Object-Oriented Design (LLD), microservice scalability (HLD), participate in
              live resume roasting, and simulate realistic technical rounds.
            </p>
          </div>
        </div>
      </section>

      {/* 5. 16-WEEK CURRICULUM */}
      <section
        id="curriculum"
        style={{
          padding: "4.5rem 1.5rem",
          maxWidth: "1200px",
          margin: "0 auto",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--brand-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Structured 16-Week Roadmap
          </div>
          <h2 style={{ fontSize: "2.3rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.85rem" }}>
            Comprehensive Syllabus Designed for Placements
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "660px", margin: "0 auto" }}>
            From absolute programming basics to advanced Graph DP and System Design.
          </p>
        </div>

        <div className="responsive-curriculum-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {CURRICULUM_MODULES.map((m) => {
              const isSelected = activeModule === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  style={{
                    padding: "1rem 1.25rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: isSelected ? "rgba(245, 158, 11, 0.15)" : "var(--bg-surface)",
                    border: `1px solid ${isSelected ? "rgba(245, 158, 11, 0.6)" : "var(--border-subtle)"}`,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--brand-primary)", textTransform: "uppercase" }}>
                      {m.badge}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {m.weeks}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: isSelected ? "#ffffff" : "var(--text-primary)" }}>
                    {m.title}
                  </div>
                </div>
              );
            })}
          </div>

          {(() => {
            const current = CURRICULUM_MODULES.find((m) => m.id === activeModule) || CURRICULUM_MODULES[0];
            return (
              <div
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-strong)",
                  padding: "2rem",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backgroundColor: "rgba(245, 158, 11, 0.2)",
                        color: "#F59E0B",
                        padding: "3px 10px",
                        borderRadius: "4px",
                        marginRight: "0.5rem",
                      }}
                    >
                      {current.weeks}
                    </span>
                    {current.visualizerAvailable && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor: "rgba(16, 185, 129, 0.2)",
                          color: "#34D399",
                          padding: "3px 10px",
                          borderRadius: "4px",
                        }}
                      >
                        ⚡ Visualizer Supported
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    <span style={{ color: "#ffffff", fontWeight: 700 }}>{current.lectures}</span> Lectures •{" "}
                    <span style={{ color: "#ffffff", fontWeight: 700 }}>{current.problems}</span> Problems
                  </div>
                </div>

                <h3 style={{ fontSize: "1.45rem", fontWeight: 800, marginBottom: "0.75rem", color: "#ffffff" }}>
                  {current.title}
                </h3>

                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                  {current.description}
                </p>

                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    Key Concepts &amp; Practice Breakdown:
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {current.topics.map((t, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.6rem",
                          fontSize: "0.9rem",
                          color: "#cbd5e1",
                          lineHeight: 1.5,
                        }}
                      >
                        <span style={{ color: "var(--accent-emerald)", fontWeight: 700, marginTop: "2px" }}>✓</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                  <Link
                    href="/courses"
                    style={{
                      padding: "0.6rem 1.25rem",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid var(--border-subtle)",
                      color: "#ffffff",
                      borderRadius: "var(--radius-sm)",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                    }}
                  >
                    View All Lectures in Syllabus →
                  </Link>

                  <a
                    href="#batch-2"
                    style={{
                      padding: "0.6rem 1.25rem",
                      background: "var(--brand-gradient)",
                      color: "#090C10",
                      borderRadius: "var(--radius-sm)",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  >
                    Enroll in Batch 2.0 (₹2,399)
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 6. TRANSPARENT PRICING CARD */}
      <section
        id="batch-2"
        style={{
          padding: "4.5rem 1.5rem",
          maxWidth: "1000px",
          margin: "0 auto",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#FBBF24",
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              padding: "4px 12px",
              borderRadius: "20px",
              marginBottom: "1rem",
              border: "1px solid rgba(245, 158, 11, 0.3)",
            }}
          >
            <span>★</span>
            <span>Batch 2.0 Official Enrollment</span>
          </div>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
            Invest in Your Tech Career. <span className="gradient-text">Zero Compromises.</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "600px", margin: "0 auto" }}>
            Get everything you need to break into product-based software engineering at a fraction of traditional coaching fees.
          </p>
        </div>

        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            border: "2px solid rgba(245, 158, 11, 0.5)",
            boxShadow: "0 0 40px rgba(245, 158, 11, 0.25)",
            padding: "clamp(1.5rem, 4vw, 3rem)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              backgroundColor: "#F59E0B",
              color: "#000000",
              fontSize: "0.75rem",
              fontWeight: 800,
              padding: "6px 20px",
              borderBottomLeftRadius: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Early Bird Active
          </div>

          <div className="responsive-grid-2col" style={{ alignItems: "center" }}>
            <div>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--brand-primary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Complete Placement Preparation Batch 2.0
              </span>

              <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginTop: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "3.5rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em" }}>
                  ₹2,399
                </span>
                <span style={{ fontSize: "1.25rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                  ₹5,999
                </span>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#34D399",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                  }}
                >
                  60% OFF
                </span>
              </div>

              <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.75rem", lineHeight: 1.5 }}>
                Flexible monthly installment option available at <strong>₹749/month</strong>. One-time payment grants
                immediate access to all live classes, recordings, problem sheets, and compiler tools.
              </div>

              <Link
                href="/courses"
                className="glow-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  width: "100%",
                  padding: "1rem",
                  background: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
                  color: "#090C10",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: 800,
                  fontSize: "1.08rem",
                  boxShadow: "0 4px 20px rgba(245, 158, 11, 0.4)",
                  marginBottom: "0.75rem",
                }}
              >
                <span>🔥</span>
                <span>Enroll in Batch 2.0 Now — ₹2,399</span>
              </Link>

              <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                🔒 100% Secure Payment • Instant Batch Confirmation • UPI / Cards / NetBanking
              </div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(9, 12, 16, 0.82)",
                padding: "1.75rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#ffffff", marginBottom: "1rem" }}>
                What&apos;s Included in Batch 2.0:
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", fontSize: "0.85rem", color: "#cbd5e1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#34D399", fontWeight: 700 }}>✓</span>
                  <span>100+ Hours Live Interactive Classes (Telugu &amp; English)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#34D399", fontWeight: 700 }}>✓</span>
                  <span>2 Full Years Unlimited 1080p HD Recording Replay</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#34D399", fontWeight: 700 }}>✓</span>
                  <span>450+ Curated SDE Placement Questions (Blind 75 &amp; Striver)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#34D399", fontWeight: 700 }}>✓</span>
                  <span>In-Browser Compiler with Real-Time Diagram Visualizer</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#34D399", fontWeight: 700 }}>✓</span>
                  <span>Dedicated 1-on-1 TA Doubt Support on Discord</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#34D399", fontWeight: 700 }}>✓</span>
                  <span>Object-Oriented Design (LLD) &amp; System Architecture (HLD)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#34D399", fontWeight: 700 }}>✓</span>
                  <span>Resume Roasting &amp; FAANG-Style Mock Interviews</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#34D399", fontWeight: 700 }}>✓</span>
                  <span>Official SPURA Course Certificate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQS */}
      <section
        style={{
          padding: "4.5rem 1.5rem",
          maxWidth: "900px",
          margin: "0 auto",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--brand-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Got Questions?
          </div>
          <h2 style={{ fontSize: "2.3rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${isOpen ? "rgba(245, 158, 11, 0.4)" : "var(--border-subtle)"}`,
                  overflow: "hidden",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  style={{
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: isOpen ? "#ffffff" : "var(--text-primary)",
                  }}
                >
                  <span>{faq.question}</span>
                  <span style={{ fontSize: "1.2rem", color: "var(--brand-primary)", transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.15s ease" }}>
                    +
                  </span>
                </div>

                {isOpen && (
                  <div
                    style={{
                      padding: "0 1.5rem 1.25rem",
                      color: "var(--text-secondary)",
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      borderTop: "1px solid var(--border-subtle)",
                      paddingTop: "1rem",
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
