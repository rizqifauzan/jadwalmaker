import type {
  Assignment,
  BlockedSlot,
  Classroom,
  ScheduleEntry,
  Teacher,
  ValidationIssue,
} from "@/types";
import { createId } from "@/lib/utils/id";

interface ScheduleValidationInput {
  entries: ScheduleEntry[];
  blockedSlots: BlockedSlot[];
  teachers: Teacher[];
  classrooms: Classroom[];
  assignments: Assignment[];
}

export interface ScheduleValidationResult {
  issues: ValidationIssue[];
  errorCount: number;
}

const keyFor = (parts: string[]): string => parts.join("::");

export const validateSchedule = ({
  entries,
  blockedSlots,
  teachers,
  classrooms,
  assignments,
}: ScheduleValidationInput): ScheduleValidationResult => {
  const issues: ValidationIssue[] = [];

  const blockedLookup = new Set(
    blockedSlots.map((slot) => keyFor([slot.day, slot.timeSlotId])),
  );

  const teacherLookup = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const classroomLookup = new Map(classrooms.map((classroom) => [classroom.id, classroom]));
  const assignmentLookup = new Set(
    assignments.map((assignment) =>
      keyFor([assignment.classroomId, assignment.subjectName.toLowerCase(), assignment.teacherId]),
    ),
  );

  const groupedByTeacher = new Map<string, ScheduleEntry[]>();
  const groupedByClassroom = new Map<string, ScheduleEntry[]>();

  for (const entry of entries) {
    const teacherKey = keyFor([entry.day, entry.timeSlotId, entry.teacherId]);
    const classKey = keyFor([entry.day, entry.timeSlotId, entry.classroomId]);

    groupedByTeacher.set(teacherKey, [...(groupedByTeacher.get(teacherKey) ?? []), entry]);
    groupedByClassroom.set(classKey, [...(groupedByClassroom.get(classKey) ?? []), entry]);

    if (blockedLookup.has(keyFor([entry.day, entry.timeSlotId]))) {
      issues.push({
        id: createId(),
        severity: "error",
        code: "BLOCKED_SLOT",
        message: "Slot ini ditandai libur/tidak aktif.",
        entryId: entry.id,
      });
    }

    const assignmentKey = keyFor([
      entry.classroomId,
      entry.subjectName.toLowerCase(),
      entry.teacherId,
    ]);

    if (!assignmentLookup.has(assignmentKey)) {
      issues.push({
        id: createId(),
        severity: "error",
        code: "ASSIGNMENT_MISMATCH",
        message: "Mapel dan guru pada slot ini belum ditetapkan di penugasan kelas.",
        entryId: entry.id,
      });
    }
  }

  for (const [groupKey, groupEntries] of groupedByTeacher.entries()) {
    if (groupEntries.length <= 1) {
      continue;
    }

    const teacher = teacherLookup.get(groupEntries[0].teacherId);
    issues.push({
      id: createId(),
      severity: "error",
      code: "TEACHER_CONFLICT",
      message: `Guru ${teacher?.name ?? "Unknown"} bentrok pada slot ${groupKey}.`,
      entryId: groupEntries[0].id,
    });
  }

  for (const [groupKey, groupEntries] of groupedByClassroom.entries()) {
    if (groupEntries.length <= 1) {
      continue;
    }

    const classroom = classroomLookup.get(groupEntries[0].classroomId);
    issues.push({
      id: createId(),
      severity: "error",
      code: "CLASSROOM_CONFLICT",
      message: `Kelas ${classroom?.name ?? "Unknown"} memiliki lebih dari satu pelajaran pada slot ${groupKey}.`,
      entryId: groupEntries[0].id,
    });
  }

  const teacherHours = new Map<string, number>();
  for (const entry of entries) {
    teacherHours.set(entry.teacherId, (teacherHours.get(entry.teacherId) ?? 0) + 1);
  }

  for (const teacher of teachers) {
    if (!teacher.maxHoursPerWeek) {
      continue;
    }

    const total = teacherHours.get(teacher.id) ?? 0;
    if (total > teacher.maxHoursPerWeek) {
      issues.push({
        id: createId(),
        severity: "error",
        code: "MAX_HOURS",
        message: `Total jam ${teacher.name} melebihi batas mingguan (${teacher.maxHoursPerWeek} jam).`,
      });
    }
  }

  for (const assignment of assignments) {
    const allocated = entries.filter(
      (entry) =>
        entry.classroomId === assignment.classroomId &&
        entry.teacherId === assignment.teacherId &&
        entry.subjectName.toLowerCase() === assignment.subjectName.toLowerCase(),
    ).length;

    if (allocated !== assignment.hoursPerWeek) {
      const classroomName = classroomLookup.get(assignment.classroomId)?.name ?? assignment.classroomId;
      issues.push({
        id: createId(),
        severity: "error",
        code: "ASSIGNMENT_HOURS",
        message: `Alokasi ${assignment.subjectName} di kelas ${classroomName} = ${allocated}/${assignment.hoursPerWeek} jam.`,
      });
    }
  }

  return {
    issues,
    errorCount: issues.filter((issue) => issue.severity === "error").length,
  };
};
