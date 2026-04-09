"use client";

import { useEffect, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";
import { createId } from "@/lib/utils/id";
import type { Classroom } from "@/types";

const DUMMY_CLASSROOMS = [
  "7A", "7B", "7C", "7D", "7E",
  "8A", "8B", "8C", "8D", "8E",
  "9A", "9B", "9C", "9D", "9E",
  "10 IPA 1", "10 IPA 2", "10 IPS 1", "10 IPS 2", "10 BAHASA",
  "11 IPA 1", "11 IPA 2", "11 IPS 1", "11 IPS 2", "11 BAHASA",
  "12 IPA 1", "12 IPA 2", "12 IPS 1", "12 IPS 2", "12 BAHASA"
];

export default function ClassroomsPage(): React.JSX.Element {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    setClassrooms(storageRepo.getClassrooms());
  }, []);

  const save = (next: Classroom[]) => {
    setClassrooms(next);
    storageRepo.setClassrooms(next);
  };

  const generateClassrooms = (count: number) => {
    const startIndex = classrooms.length;
    const newClasses: Classroom[] = Array.from({ length: count }).map((_, i) => ({
      id: createId(),
      name: DUMMY_CLASSROOMS[(startIndex + i) % DUMMY_CLASSROOMS.length],
    }));
    save([...classrooms, ...newClasses]);
  };

  return (
    <div className="page-grid two-col">
      <section className="panel">
        <h2>Tambah Kelas</h2>
        <form
          className="page-grid"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              return;
            }

            save([...classrooms, { id: createId(), name: name.trim() }]);
            setName("");
          }}
        >
          <label>
            Nama Kelas
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: 7A"
              required
            />
          </label>
          <button className="primary" type="submit">
            Simpan Kelas
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Generate Kelas Otomatis</h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "1rem" }}>
          {[3, 5, 10].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => generateClassrooms(count)}
            >
              + {count} Kelas
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Daftar Kelas</h2>
        {classrooms.length === 0 ? (
          <p className="muted">Belum ada data kelas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {classrooms.map((classroom) => (
                <tr key={classroom.id}>
                  <td>{classroom.name}</td>
                  <td>
                    <button
                      className="danger"
                      type="button"
                      onClick={() => save(classrooms.filter((item) => item.id !== classroom.id))}
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
