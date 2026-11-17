"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Guard from "@/components/Guard";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");

function studioFetch(path: string, init?: RequestInit) {
  const url = typeof window !== "undefined" && path.startsWith("/api/") ? path : `${API_BASE}${path}`;
  return fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });
}

interface Lecture {
  id: string;
  sectionId: string;
  position: number;
  title: string;
  videoUrl?: string | null;
  notes?: string | null;
  durationMinutes?: number | null;
  published: boolean;
}

interface Section {
  id: string;
  courseId: string;
  position: number;
  title: string;
  published: boolean;
  lectures: Lecture[];
}

interface Course {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  level: "beginner" | "intermediate" | "advanced";
  published: boolean;
  sectionCount?: number;
  lectureCount?: number;
  sections?: Section[];
}

export default function StudioPage() {
  return (
    <Guard requireAdmin>
      <StudioContent />
    </Guard>
  );
}

function StudioContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // New Course Modal
  const [showNewCourseModal, setShowNewCourseModal] = useState<boolean>(false);
  const [newCourseTitle, setNewCourseTitle] = useState<string>("");
  const [newCourseDescription, setNewCourseDescription] = useState<string>("");
  const [newCourseLevel, setNewCourseLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");

  // Single Lecture Form
  const [activeSectionForLecture, setActiveSectionForLecture] = useState<string | null>(null);
  const [lectureTitle, setLectureTitle] = useState<string>("");
  const [lectureVideoUrl, setLectureVideoUrl] = useState<string>("");
  const [lectureNotes, setLectureNotes] = useState<string>("");
  const [lectureDuration, setLectureDuration] = useState<number>(30);

  // Bulk Add Form
  const [activeSectionForBulk, setActiveSectionForBulk] = useState<string | null>(null);
  const [bulkLecturesText, setBulkLecturesText] = useState<string>("");

  // New Section
  const [newSectionTitle, setNewSectionTitle] = useState<string>("");
  const [showAddSectionInput, setShowAddSectionInput] = useState<boolean>(false);

  // Notification Toast
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await studioFetch("/api/v1/studio/courses");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.courses)) {
            if (data.courses.length > 0) {
              const firstId = data.courses[0].id;
              const fullRes = await studioFetch(`/api/v1/studio/courses/${firstId}`);
              if (fullRes.ok) {
                const fullData = await fullRes.json();
                setCourses([fullData.course, ...data.courses.slice(1)]);
              } else {
                setCourses(data.courses);
              }
              setActiveCourseId(firstId);
            } else {
              setCourses([]);
              setActiveCourseId("");
            }
            setIsBackendConnected(true);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // API unreachable
      }
      setCourses([]);
      setActiveCourseId("");
      setIsLoading(false);
    }

    loadData();
  }, []);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  // Create Course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    const payload = {
      title: newCourseTitle.trim(),
      description: newCourseDescription.trim() || undefined,
      level: newCourseLevel,
      published: true,
    };

    try {
      if (isBackendConnected) {
        const res = await studioFetch("/api/v1/studio/courses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setCourses([data.course, ...courses]);
          setActiveCourseId(data.course.id);
          setShowNewCourseModal(false);
          setNewCourseTitle("");
          setNewCourseDescription("");
          showToast(`Course "${data.course.title}" created & published!`);
          return;
        }
      }
    } catch {
      // fallback
    }

    const newId = "c-" + Date.now();
    const newCourse: Course = {
      id: newId,
      slug: newCourseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: newCourseTitle.trim(),
      description: newCourseDescription.trim() || null,
      level: newCourseLevel,
      published: true,
      sections: [
        {
          id: "s-" + Date.now(),
          courseId: newId,
          position: 1,
          title: "Week 01 - Introduction & Core Concepts",
          published: true,
          lectures: [],
        },
      ],
    };

    setCourses([newCourse, ...courses]);
    setActiveCourseId(newId);
    setShowNewCourseModal(false);
    setNewCourseTitle("");
    setNewCourseDescription("");
    showToast(`Course "${newCourse.title}" created & published!`);
  };

  // Add Section
  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim() || !activeCourse) return;

    const title = newSectionTitle.trim();

    try {
      if (isBackendConnected) {
        const res = await studioFetch(`/api/v1/studio/courses/${activeCourse.id}/sections`, {
          method: "POST",
          body: JSON.stringify({ title }),
        });
        if (res.ok) {
          const data = await res.json();
          const updated = {
            ...activeCourse,
            sections: [...(activeCourse.sections || []), data.section],
          };
          setCourses(courses.map((c) => (c.id === activeCourse.id ? updated : c)));
          setNewSectionTitle("");
          setShowAddSectionInput(false);
          showToast(`Section "${title}" added.`);
          return;
        }
      }
    } catch {
      // fallback
    }

    const newSection: Section = {
      id: "s-" + Date.now(),
      courseId: activeCourse.id,
      position: (activeCourse.sections?.length || 0) + 1,
      title,
      published: true,
      lectures: [],
    };

    const updatedCourse = {
      ...activeCourse,
      sections: [...(activeCourse.sections || []), newSection],
    };
    setCourses(courses.map((c) => (c.id === activeCourse.id ? updatedCourse : c)));
    setNewSectionTitle("");
    setShowAddSectionInput(false);
    showToast(`Section "${title}" added.`);
  };

  // Add Single Lecture
  const handleAddLecture = async (sectionId: string) => {
    if (!lectureTitle.trim() || !activeCourse) return;

    const input = {
      title: lectureTitle.trim(),
      videoUrl: lectureVideoUrl.trim() || undefined,
      notes: lectureNotes.trim() || undefined,
      durationMinutes: lectureDuration || 30,
      published: true,
    };

    try {
      if (isBackendConnected) {
        const res = await studioFetch(`/api/v1/studio/sections/${sectionId}/lectures`, {
          method: "POST",
          body: JSON.stringify(input),
        });
        if (res.ok) {
          const data = await res.json();
          const updatedSections = (activeCourse.sections || []).map((sec) =>
            sec.id === sectionId ? { ...sec, lectures: [...sec.lectures, data.lecture] } : sec
          );
          setCourses(courses.map((c) => (c.id === activeCourse.id ? { ...activeCourse, sections: updatedSections } : c)));
          setActiveSectionForLecture(null);
          setLectureTitle("");
          setLectureVideoUrl("");
          setLectureNotes("");
          showToast(`Lecture added.`);
          return;
        }
      }
    } catch {
      // fallback
    }

    const newLecture: Lecture = {
      id: "l-" + Date.now(),
      sectionId,
      position: 99,
      title: input.title,
      videoUrl: input.videoUrl || null,
      notes: input.notes || null,
      durationMinutes: input.durationMinutes,
      published: true,
    };

    const updatedSections = (activeCourse.sections || []).map((sec) => {
      if (sec.id === sectionId) {
        newLecture.position = sec.lectures.length + 1;
        return { ...sec, lectures: [...sec.lectures, newLecture] };
      }
      return sec;
    });

    setCourses(courses.map((c) => (c.id === activeCourse.id ? { ...activeCourse, sections: updatedSections } : c)));
    setActiveSectionForLecture(null);
    setLectureTitle("");
    setLectureVideoUrl("");
    setLectureNotes("");
    showToast(`Lecture added.`);
  };

  // Bulk Add Lectures
  const handleBulkAddLectures = async (sectionId: string) => {
    if (!bulkLecturesText.trim() || !activeCourse) return;

    const lines = bulkLecturesText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const lectureInputs = lines.map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      return {
        title: parts[0],
        videoUrl: parts[1] || undefined,
        durationMinutes: 30,
        published: true,
      };
    });

    try {
      if (isBackendConnected) {
        const res = await studioFetch(`/api/v1/studio/sections/${sectionId}/lectures/bulk`, {
          method: "POST",
          body: JSON.stringify({ lectures: lectureInputs }),
        });
        if (res.ok) {
          const data = await res.json();
          const updatedSections = (activeCourse.sections || []).map((sec) =>
            sec.id === sectionId ? { ...sec, lectures: [...sec.lectures, ...data.lectures] } : sec
          );
          setCourses(courses.map((c) => (c.id === activeCourse.id ? { ...activeCourse, sections: updatedSections } : c)));
          setActiveSectionForBulk(null);
          setBulkLecturesText("");
          showToast(`Added ${data.lectures.length} lectures.`);
          return;
        }
      }
    } catch {
      // fallback
    }

    const createdLectures: Lecture[] = lectureInputs.map((item, idx) => ({
      id: "l-" + Date.now() + "-" + idx,
      sectionId,
      position: idx + 1,
      title: item.title,
      videoUrl: item.videoUrl || null,
      notes: null,
      durationMinutes: item.durationMinutes,
      published: true,
    }));

    const updatedSections = (activeCourse.sections || []).map((sec) =>
      sec.id === sectionId ? { ...sec, lectures: [...sec.lectures, ...createdLectures] } : sec
    );

    setCourses(courses.map((c) => (c.id === activeCourse.id ? { ...activeCourse, sections: updatedSections } : c)));
    setActiveSectionForBulk(null);
    setBulkLecturesText("");
    showToast(`Added ${createdLectures.length} lectures.`);
  };

  // Delete Lecture
  const handleDeleteLecture = async (sectionId: string, lectureId: string) => {
    if (!confirm("Are you sure you want to delete this lecture?")) return;

    if (isBackendConnected) {
      try {
        await studioFetch(`/api/v1/studio/lectures/${lectureId}`, { method: "DELETE" });
      } catch {
        // fallback
      }
    }

    const updatedSections = (activeCourse.sections || []).map((sec) =>
      sec.id === sectionId ? { ...sec, lectures: sec.lectures.filter((l) => l.id !== lectureId) } : sec
    );
    setCourses(courses.map((c) => (c.id === activeCourse.id ? { ...activeCourse, sections: updatedSections } : c)));
    showToast("Lecture removed.");
  };

  // Delete Section
  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Delete this section and all its lectures?")) return;

    if (isBackendConnected) {
      try {
        await studioFetch(`/api/v1/studio/sections/${sectionId}`, { method: "DELETE" });
      } catch {
        // fallback
      }
    }

    const updatedSections = (activeCourse.sections || []).filter((sec) => sec.id !== sectionId);
    setCourses(courses.map((c) => (c.id === activeCourse.id ? { ...activeCourse, sections: updatedSections } : c)));
    showToast("Section removed.");
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading Studio...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", backgroundColor: "var(--bg-main)", padding: "2rem 2.5rem" }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            backgroundColor: "var(--bg-surface-elevated)",
            border: "1px solid var(--accent-emerald)",
            color: "var(--accent-emerald)",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            boxShadow: "var(--shadow-elevated)",
            zIndex: 100,
            fontSize: "0.85rem",
          }}
        >
          ✓ {notification}
        </div>
      )}

      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Course Studio
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Add courses, configure sections, and upload lectures with automatic publishing.
          </p>
        </div>

        <button
          onClick={() => setShowNewCourseModal(true)}
          style={{
            padding: "0.6rem 1.25rem",
            background: "var(--brand-gradient)",
            color: "#090C10",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.875rem",
            fontWeight: 600,
            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.35)",
            cursor: "pointer",
          }}
        >
          + Create New Course
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="responsive-curriculum-grid">
        {/* Left Column: Course Selector List */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", padding: "0.25rem 0.5rem" }}>
            Courses ({courses.length})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {courses.map((c) => {
              const isSelected = c.id === activeCourse?.id;
              const lectureCount = (c.sections || []).reduce((acc, s) => acc + (s.lectures?.length || 0), 0);
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCourseId(c.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0.75rem 0.85rem",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: isSelected ? "rgba(245, 158, 11, 0.12)" : "transparent",
                    border: `1px solid ${isSelected ? "rgba(245, 158, 11, 0.4)" : "transparent"}`,
                    color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    {c.sections?.length || 0} sections • {lectureCount} lectures
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Course Sections & Lectures */}
        {activeCourse && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Course Summary Card */}
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                padding: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>{activeCourse.title}</h2>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                      color: "var(--accent-emerald)",
                      fontWeight: 600,
                    }}
                  >
                    Published
                  </span>
                </div>
                {activeCourse.description && (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.4rem" }}>
                    {activeCourse.description}
                  </p>
                )}
              </div>

              <Link
                href="/coding"
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                Open Practice Compiler →
              </Link>
            </div>

            {/* Sections List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {(activeCourse.sections || []).map((section, sIdx) => (
                <div
                  key={section.id}
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    overflow: "hidden",
                  }}
                >
                  {/* Section Title Bar */}
                  <div
                    style={{
                      padding: "0.85rem 1.25rem",
                      backgroundColor: "var(--bg-surface-elevated)",
                      borderBottom: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(245, 158, 11, 0.15)",
                          color: "var(--brand-primary)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {sIdx + 1}
                      </span>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{section.title}</h3>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        ({section.lectures?.length || 0} lectures)
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <button
                        onClick={() => {
                          setActiveSectionForLecture(activeSectionForLecture === section.id ? null : section.id);
                          setActiveSectionForBulk(null);
                        }}
                        style={{
                          padding: "4px 10px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--brand-primary)",
                          color: "#090C10",
                        }}
                      >
                        + Add Lecture
                      </button>

                      <button
                        onClick={() => {
                          setActiveSectionForBulk(activeSectionForBulk === section.id ? null : section.id);
                          setActiveSectionForLecture(null);
                        }}
                        style={{
                          padding: "4px 10px",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        Bulk Add
                      </button>

                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        title="Delete Section"
                        style={{
                          padding: "4px 8px",
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Add Single Lecture Form */}
                  {activeSectionForLecture === section.id && (
                    <div
                      style={{
                        padding: "1.25rem",
                        backgroundColor: "rgba(245, 158, 11, 0.05)",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <h4 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--brand-primary)" }}>
                        Add Lecture to &quot;{section.title}&quot;
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                            Lecture Title *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 01. Time & Space Complexity"
                            value={lectureTitle}
                            onChange={(e) => setLectureTitle(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              backgroundColor: "var(--bg-main)",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.85rem",
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                            Video URL (YouTube, Vimeo, Cloud link)
                          </label>
                          <input
                            type="text"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={lectureVideoUrl}
                            onChange={(e) => setLectureVideoUrl(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              backgroundColor: "var(--bg-main)",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.85rem",
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          Lecture Notes & Resources (optional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Key takeaways, links, or practice references..."
                          value={lectureNotes}
                          onChange={(e) => setLectureNotes(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "7px 10px",
                            backgroundColor: "var(--bg-main)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.85rem",
                            resize: "vertical",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Duration (mins):</span>
                          <input
                            type="number"
                            min={1}
                            value={lectureDuration}
                            onChange={(e) => setLectureDuration(Number(e.target.value))}
                            style={{
                              width: "60px",
                              padding: "4px 6px",
                              backgroundColor: "var(--bg-main)",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.8rem",
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => setActiveSectionForLecture(null)}
                            style={{
                              padding: "5px 12px",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-secondary)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.8rem",
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAddLecture(section.id)}
                            style={{
                              padding: "5px 14px",
                              backgroundColor: "var(--brand-primary)",
                              color: "#090C10",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                            }}
                          >
                            Save Lecture
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bulk Add Form */}
                  {activeSectionForBulk === section.id && (
                    <div
                      style={{
                        padding: "1.25rem",
                        backgroundColor: "rgba(245, 158, 11, 0.05)",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <h4 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--brand-primary)" }}>
                        Bulk Import Lectures
                      </h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                        Paste one lecture per line. Optional: append <code>| https://video-url</code> to attach a video.
                      </p>
                      <textarea
                        rows={4}
                        placeholder={`01. Sliding Window Technique | https://youtube.com/watch?v=...\n02. Minimum Window Substring\n03. Longest Repeating Character Replacement`}
                        value={bulkLecturesText}
                        onChange={(e) => setBulkLecturesText(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          backgroundColor: "var(--bg-main)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-sm)",
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          marginBottom: "0.75rem",
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                        <button
                          onClick={() => setActiveSectionForBulk(null)}
                          style={{
                            padding: "5px 12px",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-secondary)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.8rem",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleBulkAddLectures(section.id)}
                          style={{
                            padding: "5px 14px",
                            backgroundColor: "var(--brand-primary)",
                            color: "#090C10",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          Import All
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lectures Rows */}
                  <div style={{ padding: "0.4rem" }}>
                    {!section.lectures || section.lectures.length === 0 ? (
                      <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        No lectures yet. Click <strong>&quot;+ Add Lecture&quot;</strong> to get started.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {section.lectures.map((lecture, lIdx) => (
                          <div
                            key={lecture.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.6rem 0.85rem",
                              backgroundColor: "rgba(9, 12, 16, 0.72)",
                              borderRadius: "var(--radius-sm)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", minWidth: "16px" }}>
                                {lIdx + 1}
                              </span>
                              <div>
                                <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{lecture.title}</div>
                                {lecture.notes && (
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                    {lecture.notes}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              {lecture.videoUrl ? (
                                <a
                                  href={lecture.videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    fontSize: "0.75rem",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    backgroundColor: "rgba(245, 158, 11, 0.12)",
                                    color: "var(--brand-primary)",
                                    fontWeight: 500,
                                  }}
                                >
                                  ▶ Video
                                </a>
                              ) : (
                                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Article/Code</span>
                              )}

                              {lecture.durationMinutes && (
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  {lecture.durationMinutes}m
                                </span>
                              )}

                              <button
                                onClick={() => handleDeleteLecture(section.id, lecture.id)}
                                title="Remove"
                                style={{
                                  color: "var(--text-muted)",
                                  fontSize: "0.85rem",
                                  padding: "2px 6px",
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Section */}
              {showAddSectionInput ? (
                <form
                  onSubmit={handleAddSection}
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--bg-surface)",
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed var(--border-subtle)",
                  }}
                >
                  <input
                    type="text"
                    placeholder="e.g. Week 03 - Tree Algorithms"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: "7px 10px",
                      backgroundColor: "var(--bg-main)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.85rem",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "6px 14px",
                      backgroundColor: "var(--brand-primary)",
                      color: "#090C10",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    Save Section
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddSectionInput(false)}
                    style={{
                      padding: "6px 12px",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.85rem",
                    }}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddSectionInput(true)}
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "transparent",
                    border: "1px dashed var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  + Add New Section
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Course Modal */}
      {showNewCourseModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              Create New Course
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              Enter course details. It will be immediately published to your curriculum.
            </p>

            <form onSubmit={handleCreateCourse}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master C++ & Data Structures"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief overview of course topics..."
                  value={newCourseDescription}
                  onChange={(e) => setNewCourseDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.875rem",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Difficulty Level
                </label>
                <select
                  value={newCourseLevel}
                  onChange={(e) => setNewCourseLevel(e.target.value as "beginner" | "intermediate" | "advanced")}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowNewCourseModal(false)}
                  style={{
                    padding: "7px 14px",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "7px 18px",
                    background: "var(--brand-gradient)",
                    color: "#090C10",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
