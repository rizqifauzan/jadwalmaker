"use client";

import { useEffect, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";
import { createId } from "@/lib/utils/id";
import type { TimeSlot } from "@/types";

const defaultForm = { name: "", startTime: "", endTime: "" };

export default function TimeSlotsPage(): React.JSX.Element {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  useEffect(() => {
    setTimeSlots(storageRepo.getTimeSlots());
  }, []);

  const save = (next: TimeSlot[]) => {
    setTimeSlots(next);
    storageRepo.setTimeSlots(next);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.startTime || !form.endTime) {
      setError("Semua field wajib diisi.");
      return;
    }

    if (form.startTime >= form.endTime) {
      setError("jam_mulai harus lebih kecil dari jam_selesai.");
      return;
    }

    const next: TimeSlot = {
      id: createId(),
      name: form.name.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
    };

    save([...timeSlots, next]);
    setForm(defaultForm);
  };

  return (
    <div className="page-grid two-col">
      <section className="panel">
        <h2>Tambah Jam Pelajaran</h2>
        <form onSubmit={onSubmit} className="page-grid">
          <label>
            Nama
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Contoh: Jam 1"
              required
            />
          </label>
          <div className="form-row">
            <label>
              Jam Mulai
              <input
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, startTime: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Jam Selesai
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
                required
              />
            </label>
          </div>
          {error && <span className="badge error">{error}</span>}
          <button className="primary" type="submit">
            Simpan Jam Pelajaran
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Daftar Jam Pelajaran</h2>
        {timeSlots.length === 0 ? (
          <p className="muted">Belum ada jam pelajaran.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot.id}>
                  <td>{slot.name}</td>
                  <td>{slot.startTime}</td>
                  <td>{slot.endTime}</td>
                  <td>
                    <button
                      className="danger"
                      type="button"
                      onClick={() => save(timeSlots.filter((candidate) => candidate.id !== slot.id))}
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
