"use client";

import { useEffect, useMemo, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";
import { dayLabel } from "@/lib/utils/day";
import { DAYS_OF_WEEK, type Classroom, type ScheduleEntry, type Teacher, type TimeSlot } from "@/types";

export default function PrintByClassPage(): React.JSX.Element {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classroomId, setClassroomId] = useState("");

  useEffect(() => {
    const snapshot = storageRepo.getSnapshot();
    setClassrooms(snapshot.classrooms);
    setTimeSlots(snapshot.timeSlots);
    setEntries(snapshot.scheduleEntries);
    setTeachers(snapshot.teachers);
    setClassroomId(snapshot.classrooms[0]?.id ?? "");
  }, []);

  const teacherMap = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher.name])), [teachers]);

  return (
    <section className="panel page-grid">
      <h2>Print Jadwal per Kelas</h2>
      <label>
        Pilih Kelas
        <select value={classroomId} onChange={(event) => setClassroomId(event.target.value)}>
          {classrooms.map((classroom) => (
            <option key={classroom.id} value={classroom.id}>
              {classroom.name}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => window.print()}>
        Print PDF
      </button>

      <div className="calendar-wrap">
        <div className="calendar-grid">
          <div className="calendar-cell calendar-head">Jam</div>
          {DAYS_OF_WEEK.map((day) => (
            <div className="calendar-cell calendar-head" key={day}>
              {dayLabel(day)}
            </div>
          ))}
          {timeSlots.map((slot) => (
            <div key={slot.id} style={{ display: "contents" }}>
              <div className="calendar-cell">
                <strong>{slot.name}</strong>
                <div className="muted">
                  {slot.startTime}-{slot.endTime}
                </div>
              </div>
              {DAYS_OF_WEEK.map((day) => {
                const entry = entries.find(
                  (item) =>
                    item.classroomId === classroomId && item.day === day && item.timeSlotId === slot.id,
                );

                return (
                  <div key={`${slot.id}-${day}`} className="calendar-cell">
                    {entry ? (
                      <div className="entry-chip">
                        <strong>{entry.subjectName}</strong>
                        <div>{teacherMap.get(entry.teacherId) ?? "-"}</div>
                      </div>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
