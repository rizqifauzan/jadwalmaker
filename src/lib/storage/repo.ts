import {
  APP_VERSION,
  DAYS_OF_WEEK,
  type ActiveDayConfig,
  type AppSnapshot,
  type Assignment,
  type BlockedSlot,
  type Classroom,
  type ScheduleEntry,
  type ScheduleMeta,
  type Teacher,
  type TimeSlot,
  type AISettings,
} from "@/types";
import { STORAGE_KEYS } from "@/lib/storage/keys";

const canUseStorage = (): boolean => typeof window !== "undefined";

const safeRead = <T>(key: string, fallback: T): T => {
  if (!canUseStorage()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const safeWrite = <T>(key: string, value: T): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const defaultActiveDays = (): ActiveDayConfig[] =>
  DAYS_OF_WEEK.map((day) => ({ day, active: true }));

const defaultScheduleMeta = (): ScheduleMeta => ({
  status: "draft_ok",
  lastUpdatedAt: new Date().toISOString(),
});

export const bootstrapStorage = (): void => {
  if (!canUseStorage()) {
    return;
  }

  if (!window.localStorage.getItem(STORAGE_KEYS.version)) {
    safeWrite(STORAGE_KEYS.version, APP_VERSION);
  }

  if (!window.localStorage.getItem(STORAGE_KEYS.activeDays)) {
    safeWrite(STORAGE_KEYS.activeDays, defaultActiveDays());
  }

  if (!window.localStorage.getItem(STORAGE_KEYS.scheduleMeta)) {
    safeWrite(STORAGE_KEYS.scheduleMeta, defaultScheduleMeta());
  }
};

export const storageRepo = {
  getAISettings: (): AISettings | null => {
    const settings = safeRead<AISettings | null>(STORAGE_KEYS.aiSettings, null);
    if (!settings) return null;
    // Auto-migrate old wrong Sumopod URL
    if (settings.baseUrl?.includes("api.sumopod.com")) {
      settings.baseUrl = settings.baseUrl.replace("api.sumopod.com", "ai.sumopod.com");
    }
    return settings;
  },
  setAISettings: (value: AISettings | null): void => safeWrite(STORAGE_KEYS.aiSettings, value),

  getVersion: (): string => safeRead<string>(STORAGE_KEYS.version, APP_VERSION),
  setVersion: (version: string): void => safeWrite(STORAGE_KEYS.version, version),

  getTeachers: (): Teacher[] => safeRead<Teacher[]>(STORAGE_KEYS.teachers, []),
  setTeachers: (value: Teacher[]): void => safeWrite(STORAGE_KEYS.teachers, value),

  getClassrooms: (): Classroom[] => safeRead<Classroom[]>(STORAGE_KEYS.classrooms, []),
  setClassrooms: (value: Classroom[]): void => safeWrite(STORAGE_KEYS.classrooms, value),

  getTimeSlots: (): TimeSlot[] => safeRead<TimeSlot[]>(STORAGE_KEYS.timeSlots, []),
  setTimeSlots: (value: TimeSlot[]): void => safeWrite(STORAGE_KEYS.timeSlots, value),

  getActiveDays: (): ActiveDayConfig[] =>
    safeRead<ActiveDayConfig[]>(STORAGE_KEYS.activeDays, defaultActiveDays()),
  setActiveDays: (value: ActiveDayConfig[]): void => safeWrite(STORAGE_KEYS.activeDays, value),

  getBlockedSlots: (): BlockedSlot[] => safeRead<BlockedSlot[]>(STORAGE_KEYS.blockedSlots, []),
  setBlockedSlots: (value: BlockedSlot[]): void => safeWrite(STORAGE_KEYS.blockedSlots, value),

  getAssignments: (): Assignment[] => safeRead<Assignment[]>(STORAGE_KEYS.assignments, []),
  setAssignments: (value: Assignment[]): void => safeWrite(STORAGE_KEYS.assignments, value),

  getScheduleEntries: (): ScheduleEntry[] =>
    safeRead<ScheduleEntry[]>(STORAGE_KEYS.scheduleEntries, []),
  setScheduleEntries: (value: ScheduleEntry[]): void => safeWrite(STORAGE_KEYS.scheduleEntries, value),

  getScheduleMeta: (): ScheduleMeta =>
    safeRead<ScheduleMeta>(STORAGE_KEYS.scheduleMeta, defaultScheduleMeta()),
  setScheduleMeta: (value: ScheduleMeta): void => safeWrite(STORAGE_KEYS.scheduleMeta, value),

  getSnapshot: (): AppSnapshot => ({
    teachers: storageRepo.getTeachers(),
    classrooms: storageRepo.getClassrooms(),
    timeSlots: storageRepo.getTimeSlots(),
    activeDays: storageRepo.getActiveDays(),
    blockedSlots: storageRepo.getBlockedSlots(),
    assignments: storageRepo.getAssignments(),
    scheduleEntries: storageRepo.getScheduleEntries(),
    scheduleMeta: storageRepo.getScheduleMeta(),
  }),

  importSnapshot: (snapshot: AppSnapshot): void => {
    storageRepo.setTeachers(snapshot.teachers);
    storageRepo.setClassrooms(snapshot.classrooms);
    storageRepo.setTimeSlots(snapshot.timeSlots);
    storageRepo.setActiveDays(snapshot.activeDays);
    storageRepo.setBlockedSlots(snapshot.blockedSlots);
    storageRepo.setAssignments(snapshot.assignments);
    storageRepo.setScheduleEntries(snapshot.scheduleEntries);
    storageRepo.setScheduleMeta(snapshot.scheduleMeta);
    storageRepo.setVersion(APP_VERSION);
  },

  /** Menghapus semua data jadwal. AI Settings tetap dipertahankan. */
  resetAllData: (): void => {
    if (!canUseStorage()) return;
    const keysToReset: (keyof typeof STORAGE_KEYS)[] = [
      "teachers",
      "classrooms",
      "timeSlots",
      "activeDays",
      "blockedSlots",
      "assignments",
      "scheduleEntries",
      "scheduleMeta",
    ];
    for (const key of keysToReset) {
      window.localStorage.removeItem(STORAGE_KEYS[key]);
    }
    // Re-initialize defaults
    safeWrite(STORAGE_KEYS.activeDays, defaultActiveDays());
    safeWrite(STORAGE_KEYS.scheduleMeta, defaultScheduleMeta());
  },
};
