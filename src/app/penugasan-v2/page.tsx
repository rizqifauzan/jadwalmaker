"use client";

import { useEffect, useMemo, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";
import { createId } from "@/lib/utils/id";
import type { Assignment, Classroom, Teacher } from "@/types";

interface DraftRow {
  id: string;
  teacherId: string;
  subjectName: string;
  hoursPerWeek: string;
  saved: boolean;
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

export default function AssignmentsV2Page(): React.JSX.Element {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [activeTabClassId, setActiveTabClassId] = useState<string>(ALL_CLASSES);
  const [rows, setRows] = useState<DraftRow[]>(createEmptyRows());
  const [message, setMessage] = useState("");

  useEffect(() => {
    const nextClassrooms = storageRepo.getClassrooms();
    const nextTeachers = storageRepo.getTeachers();
    const nextAssignments = storageRepo.getAssignments();

    setClassrooms(nextClassrooms);
    setTeachers(nextTeachers);
    setAllAssignments(nextAssignments);

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
    const next = allAssignments.filter((assignment) => assignment.id !== id);
    setAllAssignments(next);
    storageRepo.setAssignments(next);
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

  return (
    <div className="page-grid two-col">
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
                    <td>
                      <select
                        value={row.teacherId}
                        onChange={(event) => updateRow(row.id, { teacherId: event.target.value })}
                      >
                        <option value="">Pilih guru</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
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
              {assignmentsForTab.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{classroomMap.get(assignment.classroomId) ?? "-"}</td>
                  <td>{assignment.subjectName}</td>
                  <td>{teacherMap.get(assignment.teacherId) ?? "-"}</td>
                  <td>{assignment.hoursPerWeek}</td>
                  <td>
                    <button
                      className="danger"
                      type="button"
                      onClick={() => deleteAssignment(assignment.id)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
