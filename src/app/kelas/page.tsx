"use client";

import { useEffect, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";
import { createId } from "@/lib/utils/id";
import type { Classroom } from "@/types";

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
