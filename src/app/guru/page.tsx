"use client";

import { useEffect, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";
import { createId, toIntOrNull } from "@/lib/utils/id";
import type { Teacher } from "@/types";

const HARDCODED_TEACHERS = [
  "Budi Santoso", "Siti Aminah", "Eko Prasetyo", "Dewi Lestari", "Agus Salim",
  "Rina Supriati", "Hendro Siswanto", "Sri Wahyuni", "Ahmad Fauzi", "Nurul Hidayah",
  "Dwi Cahyono", "Ratna Sari", "Joko Anwar", "Kartika Putri", "Iwan Ramadhan",
  "Nita Thalia", "Rizky Firmansyah", "Fitriani", "Andi Saputra", "Maya Anggraini",
  "Doni Kusuma", "Reni Marlina", "Hasan Basri", "Lilis Karlina", "Arief Wibowo",
  "Sukmawati", "Yudi Pratama", "Nadia Vega", "Bambang Pamungkas", "Indah Permatasari"
];

const defaultForm = { name: "", maxHoursPerWeek: "", notes: "" };

export default function TeachersPage(): React.JSX.Element {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    setTeachers(storageRepo.getTeachers());
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
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.maxHoursPerWeek ?? "-"}</td>
                  <td>{teacher.notes || "-"}</td>
                  <td>
                    <button
                      className="danger"
                      type="button"
                      onClick={() =>
                        saveTeachers(teachers.filter((candidate) => candidate.id !== teacher.id))
                      }
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
