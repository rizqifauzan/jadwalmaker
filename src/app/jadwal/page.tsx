"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";
import { dayLabel } from "@/lib/utils/day";
import { createId } from "@/lib/utils/id";
import { validateSchedule } from "@/lib/validation/schedule";
import {
  DAYS_OF_WEEK,
  type ActiveDayConfig,
  type Assignment,
  type BlockedSlot,
  type Classroom,
  type DayOfWeek,
  type ScheduleEntry,
  type ScheduleMeta,
  type ScheduleStatus,
  type Teacher,
  type TimeSlot,
} from "@/types";

interface FormState {
  classroomId: string;
  day: DayOfWeek;
  timeSlotId: string;
  assignmentId: string;
}

const emptyForm: FormState = {
  classroomId: "",
  day: "senin",
  timeSlotId: "",
  assignmentId: "",
};

export default function SchedulePage(): React.JSX.Element {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeDays, setActiveDays] = useState<ActiveDayConfig[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [meta, setMeta] = useState<ScheduleMeta>({ status: "draft_ok", lastUpdatedAt: "" });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [notice, setNotice] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");

  useEffect(() => {
    const snapshot = storageRepo.getSnapshot();
    setEntries(snapshot.scheduleEntries);
    setClassrooms(snapshot.classrooms);
    setTeachers(snapshot.teachers);
    setTimeSlots(snapshot.timeSlots);
    setAssignments(snapshot.assignments);
    setActiveDays(snapshot.activeDays);
    setBlockedSlots(snapshot.blockedSlots);
    setMeta(snapshot.scheduleMeta);

    const firstClassroom = snapshot.classrooms[0]?.id ?? "";
    const firstTimeSlot = snapshot.timeSlots[0]?.id ?? "";
    const firstAssignment = snapshot.assignments.find((item) => item.classroomId === firstClassroom)?.id ?? "";

    setSelectedClassroomId(firstClassroom);
    setForm({ classroomId: firstClassroom, day: "senin", timeSlotId: firstTimeSlot, assignmentId: firstAssignment });
  }, []);

  const assignmentsForClass = useMemo(
    () => assignments.filter((assignment) => assignment.classroomId === form.classroomId),
    [assignments, form.classroomId],
  );

  const classroomMap = useMemo(
    () => new Map(classrooms.map((classroom) => [classroom.id, classroom.name])),
    [classrooms],
  );
  const teacherMap = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher.name])),
    [teachers],
  );
  const timeSlotMap = useMemo(
    () => new Map(timeSlots.map((slot) => [slot.id, slot])),
    [timeSlots],
  );

  const validation = useMemo(
    () => validateSchedule({ entries, blockedSlots, teachers, classrooms, assignments }),
    [entries, blockedSlots, teachers, classrooms, assignments],
  );

  const persistSchedule = (nextEntries: ScheduleEntry[], preferred?: ScheduleStatus): void => {
    const result = validateSchedule({
      entries: nextEntries,
      blockedSlots,
      teachers,
      classrooms,
      assignments,
    });

    const status: ScheduleStatus =
      preferred === "final"
        ? result.errorCount === 0
          ? "final"
          : "draft_error"
        : result.errorCount === 0
          ? "draft_ok"
          : "draft_error";

    const nextMeta: ScheduleMeta = {
      status,
      lastUpdatedAt: new Date().toISOString(),
    };

    setEntries(nextEntries);
    setMeta(nextMeta);
    storageRepo.setScheduleEntries(nextEntries);
    storageRepo.setScheduleMeta(nextMeta);

    if (preferred === "final" && result.errorCount > 0) {
      setNotice("Tidak bisa final karena masih ada error. Disimpan sebagai draft_error.");
      return;
    }

    setNotice(status === "final" ? "Jadwal final tersimpan." : "Draft jadwal tersimpan.");
  };

  const activeDayLookup = useMemo(
    () => new Map(activeDays.map((item) => [item.day, item.active])),
    [activeDays],
  );
  const blockedLookup = useMemo(
    () => new Set(blockedSlots.map((slot) => `${slot.day}::${slot.timeSlotId}`)),
    [blockedSlots],
  );

  const visibleEntries = entries.filter((entry) => entry.classroomId === selectedClassroomId);

  return (
    <div className="page-grid">
      <section className="panel">
        <h2>Input Slot Jadwal</h2>
        {classrooms.length === 0 || timeSlots.length === 0 || assignments.length === 0 ? (
          <p className="muted">
            Pastikan data kelas, jam pelajaran, dan penugasan sudah diisi sebelum menyusun jadwal.
          </p>
        ) : (
          <form
            className="page-grid"
            onSubmit={(event) => {
              event.preventDefault();
              const assignment = assignments.find((item) => item.id === form.assignmentId);
              if (!assignment || !form.timeSlotId || !form.classroomId) {
                return;
              }

              const next: ScheduleEntry = {
                id: createId(),
                classroomId: form.classroomId,
                day: form.day,
                timeSlotId: form.timeSlotId,
                subjectName: assignment.subjectName,
                teacherId: assignment.teacherId,
              };

              persistSchedule([...entries, next]);
            }}
          >
            <div className="form-row">
              <label>
                Kelas
                <select
                  value={form.classroomId}
                  onChange={(event) => {
                    const classroomId = event.target.value;
                    const firstAssignment =
                      assignments.find((item) => item.classroomId === classroomId)?.id ?? "";
                    setForm((prev) => ({ ...prev, classroomId, assignmentId: firstAssignment }));
                    setSelectedClassroomId(classroomId);
                  }}
                >
                  {classrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </select>
              </label>
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
            </div>
            <div className="form-row">
              <label>
                Jam Pelajaran
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
              <label>
                Penugasan (Mapel-Guru)
                <select
                  value={form.assignmentId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, assignmentId: event.target.value }))
                  }
                >
                  {assignmentsForClass.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.subjectName} - {teacherMap.get(assignment.teacherId) ?? "Unknown"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="primary" type="submit">
                Tambah Slot
              </button>
              <button type="button" onClick={() => persistSchedule(entries, "draft_ok")}>Simpan Draft</button>
              <button type="button" onClick={() => persistSchedule(entries, "final")}>
                Simpan Final
              </button>
            </div>
          </form>
        )}
        {notice && <p className="badge warn">{notice}</p>}
        <p>
          Status: <span className={`badge ${meta.status === "draft_error" ? "error" : "ok"}`}>{meta.status}</span>
          <span className="muted"> | Last update: {meta.lastUpdatedAt || "-"}</span>
        </p>
      </section>

      <section className="panel">
        <h2>Weekly View per Kelas</h2>
        <label>
          Pilih Kelas
          <select
            value={selectedClassroomId}
            onChange={(event) => setSelectedClassroomId(event.target.value)}
          >
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
        </label>

        <div className="calendar-wrap">
          <div className="calendar-grid">
            <div className="calendar-cell calendar-head">Jam</div>
            {DAYS_OF_WEEK.map((day) => (
              <div key={`head-${day}`} className="calendar-cell calendar-head">
                {dayLabel(day)} {!activeDayLookup.get(day) && <span className="badge warn">Nonaktif</span>}
              </div>
            ))}

            {timeSlots.map((slot) => (
              <Fragment key={slot.id}>
                <div key={`slot-${slot.id}`} className="calendar-cell">
                  <strong>{slot.name}</strong>
                  <div className="muted">
                    {slot.startTime}-{slot.endTime}
                  </div>
                </div>
                {DAYS_OF_WEEK.map((day) => {
                  const cellEntries = visibleEntries.filter(
                    (entry) => entry.day === day && entry.timeSlotId === slot.id,
                  );
                  const isBlocked = blockedLookup.has(`${day}::${slot.id}`);

                  return (
                    <div
                      key={`${slot.id}-${day}`}
                      className="calendar-cell"
                      style={{ background: isBlocked ? "#fff6f3" : "#fff" }}
                    >
                      <div className="calendar-slot">
                        {isBlocked && <span className="badge error">Libur</span>}
                        {cellEntries.map((entry) => (
                          <article key={entry.id} className="entry-chip">
                            <div>
                              <strong>{entry.subjectName}</strong>
                            </div>
                            <div>{teacherMap.get(entry.teacherId) ?? "Unknown"}</div>
                            <button
                              type="button"
                              onClick={() =>
                                persistSchedule(entries.filter((candidate) => candidate.id !== entry.id))
                              }
                            >
                              Hapus
                            </button>
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Daftar Error Validasi</h2>
        {validation.issues.length === 0 ? (
          <span className="badge ok">Tidak ada error.</span>
        ) : (
          <ul className="error-list">
            {validation.issues.map((issue) => (
              <li key={issue.id}>
                <span className={`badge ${issue.severity === "error" ? "error" : "warn"}`}>
                  {issue.code}
                </span>
                <div>{issue.message}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2>Entri Jadwal</h2>
        <table>
          <thead>
            <tr>
              <th>Kelas</th>
              <th>Hari</th>
              <th>Jam</th>
              <th>Mapel</th>
              <th>Guru</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{classroomMap.get(entry.classroomId) ?? "-"}</td>
                <td>{dayLabel(entry.day)}</td>
                <td>{timeSlotMap.get(entry.timeSlotId)?.name ?? "-"}</td>
                <td>{entry.subjectName}</td>
                <td>{teacherMap.get(entry.teacherId) ?? "-"}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Belum ada entri jadwal.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
