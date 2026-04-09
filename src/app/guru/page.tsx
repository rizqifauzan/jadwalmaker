"use client";

import { useEffect, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";
import { createId, toIntOrNull } from "@/lib/utils/id";
import type { Assignment, Teacher } from "@/types";

const HARDCODED_TEACHERS = [
  "Budi Santoso", "Siti Aminah", "Eko Prasetyo", "Dewi Lestari", "Agus Salim",
  "Rina Supriati", "Hendro Siswanto", "Sri Wahyuni", "Ahmad Fauzi", "Nurul Hidayah",
  "Dwi Cahyono", "Ratna Sari", "Joko Anwar", "Kartika Putri", "Iwan Ramadhan",
  "Nita Thalia", "Rizky Firmansyah", "Fitriani", "Andi Saputra", "Maya Anggraini",
  "Doni Kusuma", "Reni Marlina", "Hasan Basri", "Lilis Karlina", "Arief Wibowo",
  "Sukmawati", "Yudi Pratama", "Nadia Vega", "Bambang Pamungkas", "Indah Permatasari"
];

const defaultForm = { name: "", maxHoursPerWeek: "", notes: "" };

interface EditState {
  id: string;
  name: string;
  maxHoursPerWeek: string;
  notes: string;
}

export default function TeachersPage(): React.JSX.Element {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [deleteError, setDeleteError] = useState<string>("");
  const [batchText, setBatchText] = useState("");
  const [batchError, setBatchError] = useState("");

  useEffect(() => {
    setTeachers(storageRepo.getTeachers());
    setAssignments(storageRepo.getAssignments());
  }, []);

  const saveTeachers = (next: Teacher[]) => {
    setTeachers(next);
    storageRepo.setTeachers(next);
  };

  const generateTeachers = (count: number) => {
    const newTeachers: Teacher[] = Array.from({ length: count }).map((_, i) => ({
      id: createId(),
      name: HARDCODED_TEACHERS[i % HARDCODED_TEACHERS.length],
      maxHoursPerWeek: null,
      notes: "Auto generated",
    }));
    saveTeachers([...teachers, ...newTeachers]);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }

    const next: Teacher = {
      id: createId(),
      name: form.name.trim(),
      maxHoursPerWeek: toIntOrNull(form.maxHoursPerWeek),
      notes: form.notes.trim(),
    };

    saveTeachers([...teachers, next]);
    setForm(defaultForm);
  };

  const startEdit = (teacher: Teacher) => {
    setDeleteError("");
    setEditState({
      id: teacher.id,
      name: teacher.name,
      maxHoursPerWeek: teacher.maxHoursPerWeek?.toString() ?? "",
      notes: teacher.notes,
    });
  };

  const cancelEdit = () => setEditState(null);

  const saveEdit = () => {
    if (!editState || !editState.name.trim()) return;
    const next = teachers.map((t) =>
      t.id === editState.id
        ? {
            ...t,
            name: editState.name.trim(),
            maxHoursPerWeek: toIntOrNull(editState.maxHoursPerWeek),
            notes: editState.notes.trim(),
          }
        : t
    );
    saveTeachers(next);
    setEditState(null);
  };

  const parsedBatch = batchText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const onBatchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBatchError("");
    if (parsedBatch.length === 0) {
      setBatchError("Masukkan minimal satu nama guru.");
      return;
    }
    const newTeachers: Teacher[] = parsedBatch.map((name) => ({
      id: createId(),
      name,
      maxHoursPerWeek: null,
      notes: "",
    }));
    saveTeachers([...teachers, ...newTeachers]);
    setBatchText("");
  };

  const tryDelete = (teacher: Teacher) => {
    setDeleteError("");
    const isUsed = assignments.some((a) => a.teacherId === teacher.id);
    if (isUsed) {
      setDeleteError(
        `"${teacher.name}" tidak bisa dihapus karena masih digunakan di penugasan.`
      );
      return;
    }
    saveTeachers(teachers.filter((t) => t.id !== teacher.id));
  };

  return (
    <div className="page-grid two-col">
      <section className="panel">
        <h2>Tambah Guru</h2>
        <form onSubmit={onSubmit} className="page-grid">
          <label>
            Nama Guru
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Contoh: Budi Santoso"
              required
            />
          </label>
          <label>
            Max Jam/Minggu (Opsional)
            <input
              value={form.maxHoursPerWeek}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, maxHoursPerWeek: event.target.value }))
              }
              inputMode="numeric"
              placeholder="Contoh: 24"
            />
          </label>
          <label>
            Catatan
            <textarea
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Preferensi/request guru"
            />
          </label>
          <button className="primary" type="submit">
            Simpan Guru
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Tambah Batch (Banyak Guru Sekaligus)</h2>
        <form onSubmit={onBatchSubmit} className="page-grid">
          <label>
            Daftar Nama Guru
            <textarea
              value={batchText}
              onChange={(e) => {
                setBatchText(e.target.value);
                setBatchError("");
              }}
              rows={6}
              placeholder={`Ibu Umul Hana\nIbu Mina Chul Ula\nIbu Khoirul Hidayah\nBp. M. Nurul Amin`}
              style={{ fontFamily: "monospace", resize: "vertical" }}
            />
          </label>
          {parsedBatch.length > 0 && (
            <div>
              <p className="muted" style={{ marginBottom: "0.4rem" }}>
                {parsedBatch.length} guru akan ditambahkan:
              </p>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {parsedBatch.map((name, i) => (
                  <li key={i} style={{ fontSize: "0.875rem" }}>{name}</li>
                ))}
              </ul>
            </div>
          )}
          {batchError && <span className="badge error">{batchError}</span>}
          <button className="primary" type="submit" disabled={parsedBatch.length === 0}>
            Tambah {parsedBatch.length > 0 ? `${parsedBatch.length} ` : ""}Guru
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Generate Guru Otomatis</h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "1rem" }}>
          {[5, 10, 20, 30].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => generateTeachers(count)}
            >
              + {count} Guru
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Daftar Guru</h2>
        {deleteError && (
          <p className="badge error" style={{ marginBottom: "0.75rem" }}>
            {deleteError}
          </p>
        )}
        {teachers.length === 0 ? (
          <p className="muted">Belum ada data guru.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Max Jam/Minggu</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => {
                const isEditing = editState?.id === teacher.id;
                const isUsed = assignments.some((a) => a.teacherId === teacher.id);

                return (
                  <tr key={teacher.id}>
                    {isEditing ? (
                      <>
                        <td>
                          <input
                            value={editState.name}
                            onChange={(e) =>
                              setEditState((prev) => prev ? { ...prev, name: e.target.value } : prev)
                            }
                            style={{ width: "100%" }}
                            autoFocus
                          />
                        </td>
                        <td>
                          <input
                            value={editState.maxHoursPerWeek}
                            onChange={(e) =>
                              setEditState((prev) => prev ? { ...prev, maxHoursPerWeek: e.target.value } : prev)
                            }
                            inputMode="numeric"
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td>
                          <input
                            value={editState.notes}
                            onChange={(e) =>
                              setEditState((prev) => prev ? { ...prev, notes: e.target.value } : prev)
                            }
                            style={{ width: "100%" }}
                          />
                        </td>
                        <td style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          <button className="primary" type="button" onClick={saveEdit}>
                            Simpan
                          </button>
                          <button type="button" onClick={cancelEdit}>
                            Batal
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{teacher.name}</td>
                        <td>{teacher.maxHoursPerWeek ?? "-"}</td>
                        <td>{teacher.notes || "-"}</td>
                        <td style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => startEdit(teacher)}
                          >
                            Edit
                          </button>
                          <button
                            className="danger"
                            type="button"
                            title={isUsed ? "Guru masih digunakan di penugasan" : "Hapus guru"}
                            onClick={() => tryDelete(teacher)}
                          >
                            Hapus
                          </button>
                        </td>
                      </>
                    )}
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
