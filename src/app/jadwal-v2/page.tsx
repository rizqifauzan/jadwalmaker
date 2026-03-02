"use client";

import { useEffect, useMemo, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";
import { dayLabel } from "@/lib/utils/day";
import { createId } from "@/lib/utils/id";
import { DAYS_OF_WEEK, type Assignment, type BlockedSlot, type Classroom, type DayOfWeek, type ScheduleEntry, type Teacher, type TimeSlot } from "@/types";

interface DragPayload {
  kind: "assignment";
  assignmentId: string;
}

interface DragEntryPayload {
  kind: "entry";
  entryId: string;
  sourceClassroomId: string;
  sourceDay: DayOfWeek;
  sourceTimeSlotId: string;
  sourceSubjectName: string;
  sourceTeacherId: string;
}

interface ConflictIssue {
  id: string;
  level: "warning" | "error";
  message: string;
}

function DeleteIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
      <path
        d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function JadwalV2Page(): React.JSX.Element {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [activeClassroomId, setActiveClassroomId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const snapshot = storageRepo.getSnapshot();
    setClassrooms(snapshot.classrooms);
    setTeachers(snapshot.teachers);
    setAssignments(snapshot.assignments);
    setTimeSlots(snapshot.timeSlots);
    setBlockedSlots(snapshot.blockedSlots);
    const seenIds = new Set<string>();
    const normalizedEntries = snapshot.scheduleEntries.map((entry) => {
      if (!seenIds.has(entry.id)) {
        seenIds.add(entry.id);
        return entry;
      }

      const nextId = createId();
      seenIds.add(nextId);
      return { ...entry, id: nextId };
    });

    setEntries(normalizedEntries);
    if (normalizedEntries.length !== snapshot.scheduleEntries.length || normalizedEntries.some((entry, idx) => entry.id !== snapshot.scheduleEntries[idx]?.id)) {
      storageRepo.setScheduleEntries(normalizedEntries);
    }
    setActiveClassroomId(snapshot.classrooms[0]?.id ?? "");

    const compute = (): void => {
      setIsMobile(window.innerWidth < 900);
    };

    compute();
    window.addEventListener("resize", compute);
    setHydrated(true);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const teacherMap = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher])),
    [teachers],
  );

  const assignmentUsage = useMemo(() => {
    const usage = new Map<string, number>();

    for (const entry of entries) {
      const key = `${entry.classroomId}::${entry.subjectName.toLowerCase()}::${entry.teacherId}`;
      usage.set(key, (usage.get(key) ?? 0) + 1);
    }

    return usage;
  }, [entries]);

  const assignmentCards = useMemo(() => {
    return assignments
      .filter((assignment) => assignment.classroomId === activeClassroomId)
      .map((assignment) => {
        const key = `${assignment.classroomId}::${assignment.subjectName.toLowerCase()}::${assignment.teacherId}`;
        const used = assignmentUsage.get(key) ?? 0;
        const remaining = assignment.hoursPerWeek - used;
        return { assignment, remaining };
      })
      .filter((item) => item.remaining > 0);
  }, [assignments, activeClassroomId, assignmentUsage]);

  const entriesByCell = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const entry of entries) {
      const key = `${entry.day}::${entry.timeSlotId}::${entry.classroomId}`;
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return map;
  }, [entries]);

  const blockedSet = useMemo(
    () => new Set(blockedSlots.map((slot) => `${slot.day}::${slot.timeSlotId}`)),
    [blockedSlots],
  );

  const conflictAnalysis = useMemo(() => {
    const conflictedCells = new Set<string>();
    const issues: ConflictIssue[] = [];

    const byTeacherSlot = new Map<string, ScheduleEntry[]>();
    const byClassSlot = new Map<string, ScheduleEntry[]>();

    for (const entry of entries) {
      const teacherKey = `${entry.day}::${entry.timeSlotId}::${entry.teacherId}`;
      const classKey = `${entry.day}::${entry.timeSlotId}::${entry.classroomId}`;

      byTeacherSlot.set(teacherKey, [...(byTeacherSlot.get(teacherKey) ?? []), entry]);
      byClassSlot.set(classKey, [...(byClassSlot.get(classKey) ?? []), entry]);

      if (blockedSet.has(`${entry.day}::${entry.timeSlotId}`)) {
        conflictedCells.add(`${entry.day}::${entry.timeSlotId}::${entry.classroomId}`);
        issues.push({
          id: createId(),
          level: "warning",
          message: `Slot libur terisi: ${dayLabel(entry.day)} - ${timeSlots.find((slot) => slot.id === entry.timeSlotId)?.name ?? entry.timeSlotId} (${entry.subjectName}).`,
        });
      }
    }

    for (const group of byTeacherSlot.values()) {
      if (group.length <= 1) {
        continue;
      }

      for (const entry of group) {
        conflictedCells.add(`${entry.day}::${entry.timeSlotId}::${entry.classroomId}`);
      }

      const teacherName = teacherMap.get(group[0].teacherId)?.name ?? "Unknown";
      issues.push({
        id: createId(),
        level: "warning",
        message: `Bentrok guru: ${teacherName} mengajar ${group.length} kelas pada slot yang sama.`,
      });
    }

    for (const group of byClassSlot.values()) {
      if (group.length <= 1) {
        continue;
      }

      for (const entry of group) {
        conflictedCells.add(`${entry.day}::${entry.timeSlotId}::${entry.classroomId}`);
      }

      const className = classrooms.find((classroom) => classroom.id === group[0].classroomId)?.name ?? "Unknown";
      issues.push({
        id: createId(),
        level: "warning",
        message: `Bentrok kelas: ${className} memiliki ${group.length} mapel di slot yang sama.`,
      });
    }

    return { conflictedCells, issues };
  }, [blockedSet, classrooms, entries, teacherMap, timeSlots]);

  const canDropAssignment = (
    assignment: Assignment,
    targetClassroomId: string,
  ): string | null => {
    if (assignment.classroomId !== targetClassroomId) {
      return "Card harus di-drop ke kolom kelas yang sama.";
    }

    const teacher = teacherMap.get(assignment.teacherId);
    if (teacher?.maxHoursPerWeek) {
      const totalTeacherHours = entries.filter((entry) => entry.teacherId === assignment.teacherId).length;
      if (totalTeacherHours + 1 > teacher.maxHoursPerWeek) {
        return `Total jam ${teacher.name} melebihi batas mingguan.`;
      }
    }

    return null;
  };

  const canMoveEntry = (
    sourceEntry: ScheduleEntry,
    targetClassroomId: string,
  ): string | null => {
    if (sourceEntry.classroomId !== targetClassroomId) {
      return "Jadwal hanya bisa dipindah dalam kelas yang sama.";
    }

    return null;
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    targetClassroomId: string,
    targetDay: DayOfWeek,
    targetTimeSlotId: string,
  ): void => {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) {
      return;
    }

    let payload: DragPayload | DragEntryPayload;
    try {
      payload = JSON.parse(raw) as DragPayload | DragEntryPayload;
    } catch {
      setMessage("Data drag tidak valid.");
      return;
    }

    if (payload.kind === "assignment") {
      const assignment = assignments.find((item) => item.id === payload.assignmentId);
      if (!assignment) {
        setMessage("Penugasan tidak ditemukan.");
        return;
      }

      const error = canDropAssignment(assignment, targetClassroomId);
      if (error) {
        setMessage(error);
        return;
      }

      const key = `${assignment.classroomId}::${assignment.subjectName.toLowerCase()}::${assignment.teacherId}`;

      const used = assignmentUsage.get(key) ?? 0;
      if (used >= assignment.hoursPerWeek) {
        setMessage("Semua jam untuk assignment ini sudah terjadwal.");
        return;
      }

      const nextEntry: ScheduleEntry = {
        id: createId(),
        classroomId: targetClassroomId,
        day: targetDay,
        timeSlotId: targetTimeSlotId,
        subjectName: assignment.subjectName,
        teacherId: assignment.teacherId,
      };

      const nextEntries = [...entries, nextEntry];
      setEntries(nextEntries);
      storageRepo.setScheduleEntries(nextEntries);
      storageRepo.setScheduleMeta({ status: "draft_ok", lastUpdatedAt: new Date().toISOString() });
      setMessage("Jadwal berhasil ditambahkan.");
      return;
    }

    const sourceIndex = entries.findIndex(
      (entry) =>
        entry.id === payload.entryId &&
        entry.classroomId === payload.sourceClassroomId &&
        entry.day === payload.sourceDay &&
        entry.timeSlotId === payload.sourceTimeSlotId &&
        entry.subjectName === payload.sourceSubjectName &&
        entry.teacherId === payload.sourceTeacherId,
    );

    if (sourceIndex < 0) {
      setMessage("Jadwal yang dipindah tidak ditemukan.");
      return;
    }
    const sourceEntry = entries[sourceIndex];

    const moveError = canMoveEntry(sourceEntry, targetClassroomId);
    if (moveError) {
      setMessage(moveError);
      return;
    }

    if (sourceEntry.day === targetDay && sourceEntry.timeSlotId === targetTimeSlotId) {
      return;
    }

    const nextEntries = [...entries];
    nextEntries[sourceIndex] = {
      ...nextEntries[sourceIndex],
      day: targetDay,
      timeSlotId: targetTimeSlotId,
    };
    setEntries(nextEntries);
    storageRepo.setScheduleEntries(nextEntries);
    storageRepo.setScheduleMeta({ status: "draft_ok", lastUpdatedAt: new Date().toISOString() });
    setMessage("Jadwal berhasil dipindahkan.");
  };

  const deleteEntry = (target: {
    entryId: string;
    classroomId: string;
    day: DayOfWeek;
    timeSlotId: string;
    subjectName: string;
    teacherId: string;
  }): void => {
    const proceed = window.confirm("Hapus jadwal ini?");
    if (!proceed) {
      return;
    }

    const targetIndex = entries.findIndex(
      (entry) =>
        entry.id === target.entryId &&
        entry.classroomId === target.classroomId &&
        entry.day === target.day &&
        entry.timeSlotId === target.timeSlotId &&
        entry.subjectName === target.subjectName &&
        entry.teacherId === target.teacherId,
    );
    if (targetIndex < 0) {
      return;
    }

    const nextEntries = [...entries];
    nextEntries.splice(targetIndex, 1);
    setEntries(nextEntries);
    storageRepo.setScheduleEntries(nextEntries);
    storageRepo.setScheduleMeta({ status: "draft_ok", lastUpdatedAt: new Date().toISOString() });
    setMessage("Jadwal berhasil dihapus.");
  };

  if (!hydrated) {
    return (
      <div className="jadwal-v2-layout">
        <section className="panel jadwal-v2-left">
          <h2>Jadwal V2</h2>
          <p className="muted">Memuat data...</p>
        </section>
        <section className="panel jadwal-v2-right">
          <p className="muted">Memuat kalender...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="jadwal-v2-layout">
      <section className="panel jadwal-v2-left">
        <h2>Jadwal V2</h2>
        <p className="muted">Pilih kelas lalu drag card mapel ke grid di kanan.</p>
        {message && <p className="badge warn">{message}</p>}

        <div className="tabs" style={{ marginBottom: 12 }}>
          {classrooms.map((classroom) => (
            <button
              key={classroom.id}
              type="button"
              className={activeClassroomId === classroom.id ? "tab active" : "tab"}
              onClick={() => setActiveClassroomId(classroom.id)}
            >
              {classroom.name}
            </button>
          ))}
        </div>

        <div className="page-grid">
          {assignmentCards.length === 0 && <p className="muted">Tidak ada sisa jam assignment.</p>}
          {assignmentCards.map(({ assignment, remaining }) => {
            const teacherName = teacherMap.get(assignment.teacherId)?.name ?? "-";
            const payload: DragPayload = {
              kind: "assignment",
              assignmentId: assignment.id,
            };

            return (
              <article
                key={assignment.id}
                className="entry-chip"
                style={{ cursor: "grab", position: "relative", background: "#fff" }}
                draggable={!isMobile}
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/json", JSON.stringify(payload));
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <strong>{assignment.subjectName}</strong>
                    <div>{teacherName}</div>
                  </div>
                  <span className="badge ok" title="Sisa jam">
                    {remaining}x
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel jadwal-v2-right">
        <h2>Kalender Kelas</h2>
        {isMobile && (
          <p className="badge warn">
            Drag-drop belum dioptimalkan untuk mobile. Gunakan desktop.
          </p>
        )}

        <div className="calendar-wrap">
          <table className="v2-table">
            <thead>
              <tr>
                <th>Hari</th>
                <th>Jam</th>
                {classrooms.map((classroom) => (
                  <th key={`head-${classroom.id}`}>{classroom.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS_OF_WEEK.map((day, dayIndex) =>
                timeSlots.map((timeSlot, index) => {
                  const rowKey = `${day}-${timeSlot.id}`;
                  const rowClassName = [
                    index === 0 && dayIndex > 0 ? "v2-day-separator" : "",
                    index === timeSlots.length - 1 ? "v2-day-end" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr key={rowKey} className={rowClassName}>
                      {index === 0 && (
                        <td rowSpan={Math.max(timeSlots.length, 1)} className="v2-day-cell">
                          <strong>{dayLabel(day)}</strong>
                        </td>
                      )}
                      <td className="v2-time-cell">
                        <strong>{timeSlot.name}</strong>
                        <div className="muted">
                          {timeSlot.startTime} - {timeSlot.endTime}
                        </div>
                      </td>
                      {classrooms.map((classroom) => {
                        const cellKey = `${day}::${timeSlot.id}::${classroom.id}`;
                        const cellEntries = entriesByCell.get(cellKey) ?? [];
                        const blocked = blockedSet.has(`${day}::${timeSlot.id}`);

                        return (
                          <td
                            key={`${rowKey}-${classroom.id}`}
                            className="v2-drop-cell"
                            style={{
                              background: blocked ? "#fff4ef" : "#fff",
                            }}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => handleDrop(event, classroom.id, day, timeSlot.id)}
                          >
                            {blocked && <span className="badge error">Libur</span>}
                            <div className="calendar-slot">
                              {cellEntries.map((entry, entryIndex) => (
                                <article
                                  key={`${cellKey}::${entry.id}::${entryIndex}`}
                                  className={`entry-chip v2-scheduled-chip ${conflictAnalysis.conflictedCells.has(cellKey) ? "v2-conflict-chip" : ""}`}
                                  style={{ background: "#edf3ff" }}
                                  draggable={!isMobile}
                                  onDragStart={(event) => {
                                    const payload: DragEntryPayload = {
                                      kind: "entry",
                                      entryId: entry.id,
                                      sourceClassroomId: entry.classroomId,
                                      sourceDay: entry.day,
                                      sourceTimeSlotId: entry.timeSlotId,
                                      sourceSubjectName: entry.subjectName,
                                      sourceTeacherId: entry.teacherId,
                                    };
                                    event.dataTransfer.setData("application/json", JSON.stringify(payload));
                                  }}
                                >
                                  <div className="v2-scheduled-text">
                                    <strong>{entry.subjectName}</strong>
                                    <div>{teacherMap.get(entry.teacherId)?.name ?? "-"}</div>
                                  </div>
                                  <div
                                    title="Hapus"
                                    aria-label="Hapus"
                                    role="button"
                                    tabIndex={0}
                                    className="v2-delete-icon"
                                    onClick={() =>
                                      deleteEntry({
                                        entryId: entry.id,
                                        classroomId: entry.classroomId,
                                        day: entry.day,
                                        timeSlotId: entry.timeSlotId,
                                        subjectName: entry.subjectName,
                                        teacherId: entry.teacherId,
                                      })
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        deleteEntry({
                                          entryId: entry.id,
                                          classroomId: entry.classroomId,
                                          day: entry.day,
                                          timeSlotId: entry.timeSlotId,
                                          subjectName: entry.subjectName,
                                          teacherId: entry.teacherId,
                                        });
                                      }
                                    }}
                                  >
                                    <DeleteIcon />
                                  </div>
                                </article>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 14 }}>
          <h3 style={{ margin: "6px 0 10px" }}>Daftar Warning / Error</h3>
          {conflictAnalysis.issues.length === 0 ? (
            <span className="badge ok">Tidak ada warning/error.</span>
          ) : (
            <ul className="error-list">
              {conflictAnalysis.issues.map((issue) => (
                <li key={issue.id}>
                  <span className={issue.level === "error" ? "badge error" : "badge warn"}>
                    {issue.level.toUpperCase()}
                  </span>
                  <div>{issue.message}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
