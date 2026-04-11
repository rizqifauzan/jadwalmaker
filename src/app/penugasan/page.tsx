"use client";

import { useEffect, useMemo, useState } from "react";
import { storageRepo } from "@/lib/storage/repo";
import { createId } from "@/lib/utils/id";
import type { Assignment, Classroom, Teacher } from "@/types";
import { TeacherCombobox } from "@/components/ui/teacher-combobox";

interface FormState {
  classroomId: string;
  subjectName: string;
  teacherId: string;
  hoursPerWeek: string;
}

export default function AssignmentsPage(): React.JSX.Element {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>({
    classroomId: "",
    subjectName: "",
    teacherId: "",
    hoursPerWeek: "",
  });

  useEffect(() => {
    const nextClassrooms = storageRepo.getClassrooms();
    const nextTeachers = storageRepo.getTeachers();
    const nextAssignments = storageRepo.getAssignments();

    setClassrooms(nextClassrooms);
    setTeachers(nextTeachers);
    setAssignments(nextAssignments);
    setForm((prev) => ({
      ...prev,
      classroomId: nextClassrooms[0]?.id ?? "",
      teacherId: nextTeachers[0]?.id ?? "",
    }));
  }, []);

  const classroomMap = useMemo(
    () => new Map(classrooms.map((classroom) => [classroom.id, classroom.name])),
    [classrooms],
  );
  const teacherMap = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher.name])),
    [teachers],
  );

  const save = (next: Assignment[]) => {
    setAssignments(next);
    storageRepo.setAssignments(next);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const hours = Number.parseInt(form.hoursPerWeek, 10);

    if (!form.classroomId || !form.teacherId || !form.subjectName.trim() || Number.isNaN(hours) || hours <= 0) {
      setError("Semua field wajib valid.");
      return;
    }

    const duplicate = assignments.some(
      (assignment) =>
        assignment.classroomId === form.classroomId &&
        assignment.subjectName.toLowerCase() === form.subjectName.trim().toLowerCase(),
    );

    if (duplicate) {
      setError("Satu mapel dalam satu kelas hanya boleh satu guru.");
      return;
    }

    const next: Assignment = {
      id: createId(),
      classroomId: form.classroomId,
      subjectName: form.subjectName.trim(),
      teacherId: form.teacherId,
      hoursPerWeek: hours,
    };

    save([...assignments, next]);
    setForm((prev) => ({ ...prev, subjectName: "", hoursPerWeek: "" }));
  };

  return (
    <div className="page-grid two-col">
      <section className="panel">
        <h2>Tambah Penugasan</h2>
        {classrooms.length === 0 || teachers.length === 0 ? (
          <p className="muted">Isi data kelas dan guru terlebih dahulu.</p>
        ) : (
          <form className="page-grid" onSubmit={onSubmit}>
            <div className="form-row">
              <label>
                Kelas
                <select
                  value={form.classroomId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, classroomId: event.target.value }))
                  }
                >
                  {classrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Guru
                <TeacherCombobox
                  teachers={teachers}
                  value={form.teacherId}
                  onChange={(teacherId) => setForm((prev) => ({ ...prev, teacherId }))}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Nama Mapel
                <input
                  value={form.subjectName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, subjectName: event.target.value }))
                  }
                  placeholder="Contoh: Matematika"
                  required
                />
              </label>
              <label>
                Jumlah Jam/Minggu
                <input
                  value={form.hoursPerWeek}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, hoursPerWeek: event.target.value }))
                  }
                  inputMode="numeric"
                  placeholder="Contoh: 4"
                  required
                />
              </label>
            </div>
            {error && <span className="badge error">{error}</span>}
            <button className="primary" type="submit">
              Simpan Penugasan
            </button>
          </form>
        )}
      </section>

      <section className="panel">
        <h2>Daftar Penugasan</h2>
        {assignments.length === 0 ? (
          <p className="muted">Belum ada penugasan.</p>
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
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{classroomMap.get(assignment.classroomId) ?? "-"}</td>
                  <td>{assignment.subjectName}</td>
                  <td>{teacherMap.get(assignment.teacherId) ?? "-"}</td>
                  <td>{assignment.hoursPerWeek}</td>
                  <td>
                    <button
                      className="danger"
                      type="button"
                      onClick={() =>
                        save(assignments.filter((candidate) => candidate.id !== assignment.id))
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
