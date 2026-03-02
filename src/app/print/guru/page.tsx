"use client";

import { useEffect, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";
import { dayLabel } from "@/lib/utils/day";
import { DAYS_OF_WEEK, type Classroom, type ScheduleEntry, type Teacher, type TimeSlot } from "@/types";

export default function PrintByTeacherPage(): React.JSX.Element {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [teacherId, setTeacherId] = useState("");

  useEffect(() => {
    const snapshot = storageRepo.getSnapshot();
    setTeachers(snapshot.teachers);
    setClassrooms(snapshot.classrooms);
    setTimeSlots(snapshot.timeSlots);
    setEntries(snapshot.scheduleEntries);
    setTeacherId(snapshot.teachers[0]?.id ?? "");
  }, []);

  const classroomMap = new Map(classrooms.map((classroom) => [classroom.id, classroom.name]));

  return (
    <section className="panel page-grid">
      <h2>Print Jadwal per Guru</h2>
      <label>
        Pilih Guru
        <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
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
                  (item) => item.teacherId === teacherId && item.day === day && item.timeSlotId === slot.id,
                );

                return (
                  <div key={`${slot.id}-${day}`} className="calendar-cell">
                    {entry ? (
                      <div className="entry-chip">
                        <strong>{entry.subjectName}</strong>
                        <div>{classroomMap.get(entry.classroomId) ?? "-"}</div>
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
