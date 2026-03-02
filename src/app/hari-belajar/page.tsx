"use client";

import { useEffect, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";
import { createId } from "@/lib/utils/id";
import { dayLabel } from "@/lib/utils/day";
import { DAYS_OF_WEEK, type ActiveDayConfig, type BlockedSlot, type DayOfWeek, type TimeSlot } from "@/types";

export default function ActiveDaysPage(): React.JSX.Element {
  const [activeDays, setActiveDays] = useState<ActiveDayConfig[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [form, setForm] = useState<{ day: DayOfWeek; timeSlotId: string; reason: string }>({
    day: "senin",
    timeSlotId: "",
    reason: "",
  });

  useEffect(() => {
    const slots = storageRepo.getTimeSlots();
    setTimeSlots(slots);
    setBlockedSlots(storageRepo.getBlockedSlots());
    const fromStorage = storageRepo.getActiveDays();
    setActiveDays(fromStorage.length ? fromStorage : DAYS_OF_WEEK.map((day) => ({ day, active: true })));
    setForm((prev) => ({ ...prev, timeSlotId: slots[0]?.id ?? "" }));
  }, []);

  const saveActiveDays = (next: ActiveDayConfig[]) => {
    setActiveDays(next);
    storageRepo.setActiveDays(next);
  };

  const saveBlockedSlots = (next: BlockedSlot[]) => {
    setBlockedSlots(next);
    storageRepo.setBlockedSlots(next);
  };

  return (
    <div className="page-grid two-col">
      <section className="panel">
        <h2>Hari Belajar Aktif</h2>
        <div className="page-grid">
          {DAYS_OF_WEEK.map((day) => {
            const current = activeDays.find((item) => item.day === day)?.active ?? true;
            return (
              <label key={day}>
                <span>{dayLabel(day)}</span>
                <input
                  type="checkbox"
                  checked={current}
                  onChange={(event) => {
                    const next = DAYS_OF_WEEK.map((candidate) => ({
                      day: candidate,
                      active:
                        candidate === day
                          ? event.target.checked
                          : activeDays.find((item) => item.day === candidate)?.active ?? true,
                    }));
                    saveActiveDays(next);
                  }}
                />
              </label>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>Slot Libur</h2>
        {timeSlots.length === 0 ? (
          <p className="muted">Isi jam pelajaran dulu sebelum membuat slot libur.</p>
        ) : (
          <form
            className="page-grid"
            onSubmit={(event) => {
              event.preventDefault();
              if (!form.timeSlotId) {
                return;
              }

              const exists = blockedSlots.some(
                (slot) => slot.day === form.day && slot.timeSlotId === form.timeSlotId,
              );

              if (exists) {
                return;
              }

              const next: BlockedSlot = {
                id: createId(),
                day: form.day,
                timeSlotId: form.timeSlotId,
                reason: form.reason.trim(),
              };

              saveBlockedSlots([...blockedSlots, next]);
              setForm((prev) => ({ ...prev, reason: "" }));
            }}
          >
            <div className="form-row">
              <label>
                Hari
                <select
                  value={form.day}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, day: event.target.value as DayOfWeek }))
                  }
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day} value={day}>
                      {dayLabel(day)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Jam
                <select
                  value={form.timeSlotId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, timeSlotId: event.target.value }))
                  }
                >
                  {timeSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.name} ({slot.startTime}-{slot.endTime})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Keterangan
              <input
                value={form.reason}
                onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
                placeholder="Contoh: Upacara"
              />
            </label>
            <button className="primary" type="submit">
              Tambah Slot Libur
            </button>
          </form>
        )}

        <hr />
        <table>
          <thead>
            <tr>
              <th>Hari</th>
              <th>Jam</th>
              <th>Keterangan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {blockedSlots.map((slot) => (
              <tr key={slot.id}>
                <td>{dayLabel(slot.day)}</td>
                <td>{timeSlots.find((item) => item.id === slot.timeSlotId)?.name ?? "-"}</td>
                <td>{slot.reason || "-"}</td>
                <td>
                  <button
                    className="danger"
                    type="button"
                    onClick={() =>
                      saveBlockedSlots(blockedSlots.filter((candidate) => candidate.id !== slot.id))
                    }
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {blockedSlots.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Belum ada slot libur.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
