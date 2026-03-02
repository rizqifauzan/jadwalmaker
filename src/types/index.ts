export const APP_VERSION = "1.0.0";

export const DAYS_OF_WEEK = [
  "senin",
  "selasa",
  "rabu",
  "kamis",
  "jumat",
  "sabtu",
  "minggu",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export type ScheduleStatus = "draft_ok" | "draft_error" | "final";

export interface Teacher {
  id: string;
  name: string;
  maxHoursPerWeek: number | null;
  notes: string;
}

export interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface Classroom {
  id: string;
  name: string;
}

export interface Assignment {
  id: string;
  classroomId: string;
  subjectName: string;
  teacherId: string;
  hoursPerWeek: number;
}

export interface ActiveDayConfig {
  day: DayOfWeek;
  active: boolean;
}

export interface BlockedSlot {
  id: string;
  day: DayOfWeek;
  timeSlotId: string;
  reason: string;
}

export interface ScheduleEntry {
  id: string;
  classroomId: string;
  day: DayOfWeek;
  timeSlotId: string;
  subjectName: string;
  teacherId: string;
}

export interface ScheduleMeta {
  status: ScheduleStatus;
  lastUpdatedAt: string;
}

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  code:
    | "TEACHER_CONFLICT"
    | "CLASSROOM_CONFLICT"
    | "BLOCKED_SLOT"
    | "MAX_HOURS"
    | "ASSIGNMENT_MISMATCH"
    | "ASSIGNMENT_HOURS";
  message: string;
  entryId?: string;
}

export interface AppSnapshot {
  teachers: Teacher[];
  classrooms: Classroom[];
  timeSlots: TimeSlot[];
  activeDays: ActiveDayConfig[];
  blockedSlots: BlockedSlot[];
  assignments: Assignment[];
  scheduleEntries: ScheduleEntry[];
  scheduleMeta: ScheduleMeta;
}
