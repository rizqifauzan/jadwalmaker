"use client";

import { useEffect, useMemo, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";
import { createId } from "@/lib/utils/id";
import type { Assignment, Classroom, Teacher, ScheduleEntry } from "@/types";
import { TeacherCombobox } from "@/components/ui/teacher-combobox";

interface DraftRow {
  id: string;
  teacherId: string;
  subjectName: string;
  hoursPerWeek: string;
  saved: boolean;
}

interface EditState {
  assignmentId: string;
  teacherId: string;
  subjectName: string;
  hoursPerWeek: string;
  /** How many schedule entries already consume this assignment */
  usedCount: number;
}

const ALL_CLASSES = "__ALL_CLASSES__";

const createEmptyRows = (count = 5): DraftRow[] =>
  Array.from({ length: count }).map(() => ({
    id: createId(),
    teacherId: "",
    subjectName: "",
    hoursPerWeek: "",
    saved: false,
  }));

const isRowEmpty = (row: DraftRow): boolean =>
  !row.teacherId && !row.subjectName.trim() && !row.hoursPerWeek.trim();

function SaveIcon(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4h11l3 3v13H5V4zm2 2v4h8V6H7zm0 8v4h10v-4H7z"
        fill="currentColor"
      />
    </svg>
  );
}

function EditIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4l9.5-9.5-4-4L4 16v4zm15.7-11.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0l-1.6 1.6 4 4 1.6-1.6z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function AssignmentsV2Page(): React.JSX.Element {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [activeTabClassId, setActiveTabClassId] = useState<string>(ALL_CLASSES);
  const [rows, setRows] = useState<DraftRow[]>(createEmptyRows());
  const [message, setMessage] = useState("");

  // Edit state — one row at a time
  const [editState, setEditState] = useState<EditState | null>(null);

  useEffect(() => {
    const nextClassrooms = storageRepo.getClassrooms();
    const nextTeachers = storageRepo.getTeachers();
    const nextAssignments = storageRepo.getAssignments();
    const nextEntries = storageRepo.getScheduleEntries();

    setClassrooms(nextClassrooms);
    setTeachers(nextTeachers);
    setAllAssignments(nextAssignments);
    setScheduleEntries(nextEntries);

    const firstClassroomId = nextClassrooms[0]?.id ?? "";
    setSelectedClassroomId(firstClassroomId);
    setActiveTabClassId(firstClassroomId || ALL_CLASSES);
    setRows(createEmptyRows());
  }, []);

  const assignmentsForSelectedClass = useMemo(
    () => allAssignments.filter((assignment) => assignment.classroomId === selectedClassroomId),
    [allAssignments, selectedClassroomId],
  );

  const assignmentsForTab = useMemo(() => {
    if (activeTabClassId === ALL_CLASSES) {
      return allAssignments;
    }
    return allAssignments.filter((assignment) => assignment.classroomId === activeTabClassId);
  }, [allAssignments, activeTabClassId]);

  const teacherMap = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher.name])),
    [teachers],
  );
  const classroomMap = useMemo(
    () => new Map(classrooms.map((classroom) => [classroom.id, classroom.name])),
    [classrooms],
  );

  /**
   * Map: assignmentId → count of schedule entries that use it.
   * Matched by classroomId + subjectName (case-insensitive) + teacherId.
   */
  const usageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const assignment of allAssignments) {
      const count = scheduleEntries.filter(
        (e) =>
          e.classroomId === assignment.classroomId &&
          e.subjectName.toLowerCase() === assignment.subjectName.toLowerCase() &&
          e.teacherId === assignment.teacherId,
      ).length;
      map.set(assignment.id, count);
    }
    return map;
  }, [allAssignments, scheduleEntries]);

  const hasUnsavedDraft = rows.some((row) => !row.saved && !isRowEmpty(row));
  const unsavedCount = rows.filter((row) => !row.saved && !isRowEmpty(row)).length;

  const resetRows = (): void => {
    setRows(createEmptyRows());
  };

  const onClassChange = (nextClassroomId: string): void => {
    if (hasUnsavedDraft) {
      const proceed = window.confirm(
        "Ada draft yang belum disimpan. Ganti kelas akan mereset draft. Lanjutkan?",
      );
      if (!proceed) {
        return;
      }
    }

    setSelectedClassroomId(nextClassroomId);
    setActiveTabClassId(nextClassroomId || ALL_CLASSES);
    resetRows();
    setMessage("");
  };

  const updateRow = (id: string, patch: Partial<DraftRow>): void => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch, saved: false } : row)));
  };

  const validateRow = (
    row: DraftRow,
    options: { checkDraftDuplicates: boolean },
  ): string | null => {
    if (isRowEmpty(row)) {
      return "Baris kosong, tidak disimpan.";
    }

    if (!row.teacherId || !row.subjectName.trim()) {
      return "Guru dan mapel wajib diisi.";
    }

    const hours = Number.parseInt(row.hoursPerWeek, 10);
    if (Number.isNaN(hours) || hours <= 0) {
      return "Jumlah jam harus lebih dari 0.";
    }

    const subjectLower = row.subjectName.trim().toLowerCase();
    const duplicateInSaved = assignmentsForSelectedClass.some(
      (assignment) => assignment.subjectName.toLowerCase() === subjectLower,
    );

    if (duplicateInSaved) {
      return `Mapel ${row.subjectName.trim()} sudah ada di kelas ini.`;
    }

    if (options.checkDraftDuplicates) {
      const duplicateInDraft = rows.some(
        (candidate) =>
          candidate.id !== row.id &&
          !isRowEmpty(candidate) &&
          candidate.subjectName.trim().toLowerCase() === subjectLower,
      );

      if (duplicateInDraft) {
        return `Mapel ${row.subjectName.trim()} duplikat di draft baris lain.`;
      }
    }

    return null;
  };

  const saveRow = (rowId: string): void => {
    const row = rows.find((item) => item.id === rowId);
    if (!row) {
      return;
    }

    const error = validateRow(row, { checkDraftDuplicates: true });
    if (error) {
      setMessage(error);
      return;
    }

    const nextAssignment: Assignment = {
      id: createId(),
      classroomId: selectedClassroomId,
      subjectName: row.subjectName.trim(),
      teacherId: row.teacherId,
      hoursPerWeek: Number.parseInt(row.hoursPerWeek, 10),
    };

    const nextAll = [...allAssignments, nextAssignment];
    setAllAssignments(nextAll);
    storageRepo.setAssignments(nextAll);

    setRows((prev) =>
      prev.map((candidate) =>
        candidate.id === row.id
          ? {
              id: createId(),
              teacherId: "",
              subjectName: "",
              hoursPerWeek: "",
              saved: true,
            }
          : candidate,
      ),
    );

    setMessage("Baris berhasil disimpan.");
  };

  const saveAllRows = (): void => {
    const candidateRows = rows.filter((row) => !isRowEmpty(row));
    if (candidateRows.length === 0) {
      setMessage("Tidak ada baris yang bisa disimpan.");
      return;
    }

    const subjectSeen = new Set<string>();
    for (const row of candidateRows) {
      const error = validateRow(row, { checkDraftDuplicates: false });
      if (error) {
        setMessage(`Simpan semua gagal: ${error}`);
        return;
      }

      const subjectLower = row.subjectName.trim().toLowerCase();
      if (subjectSeen.has(subjectLower)) {
        setMessage(`Simpan semua gagal: mapel ${row.subjectName.trim()} duplikat di draft.`);
        return;
      }
      subjectSeen.add(subjectLower);
    }

    const newAssignments: Assignment[] = candidateRows.map((row) => ({
      id: createId(),
      classroomId: selectedClassroomId,
      subjectName: row.subjectName.trim(),
      teacherId: row.teacherId,
      hoursPerWeek: Number.parseInt(row.hoursPerWeek, 10),
    }));

    const nextAll = [...allAssignments, ...newAssignments];
    setAllAssignments(nextAll);
    storageRepo.setAssignments(nextAll);
    resetRows();
    setMessage(`${newAssignments.length} baris berhasil disimpan.`);
  };

  const deleteAssignment = (id: string): void => {
    if (editState?.assignmentId === id) setEditState(null);
    const next = allAssignments.filter((assignment) => assignment.id !== id);
    setAllAssignments(next);
    storageRepo.setAssignments(next);
  };

  const generateAssignments = (): void => {
    if (classrooms.length === 0 || teachers.length === 0) {
      setMessage("Data kelas dan guru harus ada untuk generate penugasan.");
      return;
    }

    const COMMON_SUBJECTS = [
      { name: "Matematika", hours: 4 },
      { name: "B. Indonesia", hours: 4 },
      { name: "B. Inggris", hours: 4 },
      { name: "IPA", hours: 4 },
      { name: "IPS", hours: 3 },
      { name: "Seni Budaya", hours: 2 },
      { name: "Penjaskes", hours: 2 },
      { name: "Agama", hours: 2 },
    ];

    const generated: Assignment[] = [];
    let teacherIndex = 0;

    for (const classroom of classrooms) {
      for (const subj of COMMON_SUBJECTS) {
        const exists = allAssignments.some(
          (a) =>
            a.classroomId === classroom.id &&
            a.subjectName.toLowerCase() === subj.name.toLowerCase()
        );

        if (!exists) {
          generated.push({
            id: createId(),
            classroomId: classroom.id,
            subjectName: subj.name,
            teacherId: teachers[teacherIndex % teachers.length].id,
            hoursPerWeek: subj.hours,
          });
          teacherIndex++;
        }
      }
    }

    if (generated.length === 0) {
      setMessage("Seluruh penugasan dasar sudah lengkap di semua kelas.");
      return;
    }

    const nextAll = [...allAssignments, ...generated];
    setAllAssignments(nextAll);
    storageRepo.setAssignments(nextAll);
    setMessage(`${generated.length} penugasan berhasil di-generate secara otomatis.`);
  };

  const addRow = (): void => {
    setRows((prev) => [
      ...prev,
      {
        id: createId(),
        teacherId: "",
        subjectName: "",
        hoursPerWeek: "",
        saved: false,
      },
    ]);
  };

  /* ── Edit handlers ──────────────────────────────────────────── */
  const startEdit = (assignment: Assignment): void => {
    setEditState({
      assignmentId: assignment.id,
      teacherId: assignment.teacherId,
      subjectName: assignment.subjectName,
      hoursPerWeek: String(assignment.hoursPerWeek),
      usedCount: usageMap.get(assignment.id) ?? 0,
    });
    setMessage("");
  };

  const cancelEdit = (): void => setEditState(null);

  const commitEdit = (): void => {
    if (!editState) return;

    const { assignmentId, teacherId, subjectName, hoursPerWeek, usedCount } = editState;
    const target = allAssignments.find((a) => a.id === assignmentId);
    if (!target) return;

    const hours = Number.parseInt(hoursPerWeek, 10);
    if (Number.isNaN(hours) || hours <= 0) {
      setMessage("Jumlah jam harus lebih dari 0.");
      return;
    }

    if (usedCount > 0) {
      // ── Sudah terpakai di jadwal ──────────────────────────────
      // Guru & mapel dikunci, jam boleh naik/turun asal >= usedCount
      if (
        teacherId !== target.teacherId ||
        subjectName.trim().toLowerCase() !== target.subjectName.toLowerCase()
      ) {
        setMessage("Penugasan ini sudah terpakai di jadwal. Guru dan mapel tidak bisa diubah.");
        return;
      }
      if (hours < usedCount) {
        setMessage(
          `Tidak bisa mengurangi di bawah ${usedCount} jam — sudah terpakai ${usedCount}x di jadwal.`,
        );
        return;
      }
    } else {
      // ── Belum terpakai: validasi duplikat mapel ────────────────
      if (!teacherId || !subjectName.trim()) {
        setMessage("Guru dan mapel wajib diisi.");
        return;
      }
      const subjectLower = subjectName.trim().toLowerCase();
      const duplicate = allAssignments.some(
        (a) =>
          a.id !== assignmentId &&
          a.classroomId === target.classroomId &&
          a.subjectName.toLowerCase() === subjectLower,
      );
      if (duplicate) {
        setMessage(`Mapel "${subjectName.trim()}" sudah ada di kelas ini.`);
        return;
      }
    }

    const nextAll = allAssignments.map((a) =>
      a.id === assignmentId
        ? { ...a, teacherId, subjectName: subjectName.trim(), hoursPerWeek: hours }
        : a,
    );

    setAllAssignments(nextAll);
    storageRepo.setAssignments(nextAll);
    setEditState(null);
    setMessage("Penugasan berhasil diperbarui.");
  };

  return (
    <div className="page-grid two-col">
      {/* ── Panel kiri: Tambah draft ────────────────────────────── */}
      <section className="panel">
        <h2>Tambah Penugasan</h2>
        {classrooms.length === 0 ? (
          <p className="muted">Isi data kelas terlebih dahulu.</p>
        ) : (
          <label>
            Pilih Kelas
            <select
              value={selectedClassroomId}
              onChange={(event) => onClassChange(event.target.value)}
            >
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <p className="muted">Draft belum tersimpan: {unsavedCount}</p>
        {message && <p className="badge warn">{message}</p>}

        {teachers.length === 0 ? (
          <p className="muted">Isi data guru terlebih dahulu.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Guru</th>
                  <th>Mapel</th>
                  <th>Jam/Minggu</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ minWidth: 200 }}>
                      <TeacherCombobox
                        teachers={teachers}
                        value={row.teacherId}
                        onChange={(teacherId) => updateRow(row.id, { teacherId })}
                        placeholder="Pilih guru"
                      />
                    </td>
                    <td>
                      <input
                        value={row.subjectName}
                        onChange={(event) =>
                          updateRow(row.id, { subjectName: event.target.value })
                        }
                        placeholder="Nama mapel"
                      />
                    </td>
                    <td>
                      <input
                        value={row.hoursPerWeek}
                        onChange={(event) =>
                          updateRow(row.id, { hoursPerWeek: event.target.value })
                        }
                        inputMode="numeric"
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="primary"
                        onClick={() => saveRow(row.id)}
                        title="Simpan baris"
                        aria-label="Simpan baris"
                      >
                        <SaveIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={addRow}>
                + Tambah Record
              </button>
              <button type="button" className="primary" onClick={saveAllRows}>
                Simpan Semua
              </button>
            </div>
          </>
        )}
      </section>

      {/* ── Generate ────────────────────────────────────────────── */}
      <section className="panel">
        <h2>Generate Penugasan Otomatis</h2>
        <p className="muted" style={{ marginBottom: "1rem" }}>
          Buat draft penugasan dasar (Matematika, B. Inggris, dll) secara otomatis untuk semua kelas. Guru akan di-assign secara acak/merata.
        </p>
        <button type="button" onClick={generateAssignments}>
          Generate Penugasan Demo
        </button>
      </section>

      {/* ── Penugasan Tersimpan ─────────────────────────────────── */}
      <section className="panel">
        <h2>Penugasan Tersimpan</h2>
        <div className="tabs" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className={activeTabClassId === ALL_CLASSES ? "tab active" : "tab"}
            onClick={() => setActiveTabClassId(ALL_CLASSES)}
          >
            Semua Kelas
          </button>
          {classrooms.map((classroom) => (
            <button
              key={classroom.id}
              type="button"
              className={activeTabClassId === classroom.id ? "tab active" : "tab"}
              onClick={() => {
                setActiveTabClassId(classroom.id);
                setSelectedClassroomId(classroom.id);
              }}
            >
              {classroom.name}
            </button>
          ))}
        </div>

        {assignmentsForTab.length === 0 ? (
          <p className="muted">Belum ada penugasan tersimpan.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Kelas</th>
                <th>Mapel</th>
                <th>Guru</th>
                <th>Jam/Minggu</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {assignmentsForTab.map((assignment) => {
                const isEditing = editState?.assignmentId === assignment.id;

                if (isEditing && editState) {
                  const isLocked = editState.usedCount > 0;
                  return (
                    <tr key={assignment.id} style={{ background: "var(--primary-soft)" }}>
                      {/* Kelas — read-only saat edit */}
                      <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        {classroomMap.get(assignment.classroomId) ?? "-"}
                        {isLocked && (
                          <div style={{ marginTop: 4 }}>
                            <span className="badge warn" style={{ fontSize: 11 }}>
                              🔒 Terpakai {editState.usedCount}x di jadwal
                            </span>
                          </div>
                        )}
                      </td>
                      {/* Mapel */}
                      <td>
                        <input
                          value={editState.subjectName}
                          disabled={isLocked}
                          onChange={(e) =>
                            setEditState({ ...editState, subjectName: e.target.value })
                          }
                          style={{ width: "100%", opacity: isLocked ? 0.55 : 1 }}
                          autoFocus={!isLocked}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                      </td>
                      {/* Guru */}
                      <td style={{ minWidth: 200, opacity: isLocked ? 0.55 : 1, pointerEvents: isLocked ? "none" : "auto" }}>
                        <TeacherCombobox
                          teachers={teachers}
                          value={editState.teacherId}
                          onChange={(teacherId) =>
                            setEditState({ ...editState, teacherId })
                          }
                        />
                      </td>
                      {/* Jam */}
                      <td>
                        <input
                          value={editState.hoursPerWeek}
                          onChange={(e) =>
                            setEditState({ ...editState, hoursPerWeek: e.target.value })
                          }
                          inputMode="numeric"
                          style={{ width: 60 }}
                          autoFocus={isLocked}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        {isLocked && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            min. {editState.usedCount}
                          </div>
                        )}
                      </td>
                      {/* Aksi */}
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            className="primary"
                            onClick={commitEdit}
                            title="Simpan perubahan"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                          >
                            <CheckIcon /> Simpan
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            title="Batal edit"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                          >
                            <XIcon /> Batal
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={assignment.id}>
                    <td>{classroomMap.get(assignment.classroomId) ?? "-"}</td>
                    <td>{assignment.subjectName}</td>
                    <td>{teacherMap.get(assignment.teacherId) ?? "-"}</td>
                    <td>{assignment.hoursPerWeek}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => startEdit(assignment)}
                          title="Edit penugasan"
                          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          <EditIcon /> Edit
                        </button>
                        <button
                          className="danger"
                          type="button"
                          onClick={() => deleteAssignment(assignment.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
