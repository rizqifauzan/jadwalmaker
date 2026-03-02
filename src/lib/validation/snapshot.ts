import { DAYS_OF_WEEK, type AppSnapshot } from "@/types";

export const isValidSnapshot = (value: unknown): value is AppSnapshot => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as AppSnapshot;

  const arrayChecks = [
    snapshot.teachers,
    snapshot.classrooms,
    snapshot.timeSlots,
    snapshot.activeDays,
    snapshot.blockedSlots,
    snapshot.assignments,
    snapshot.scheduleEntries,
  ].every(Array.isArray);

  if (!arrayChecks || !snapshot.scheduleMeta || typeof snapshot.scheduleMeta !== "object") {
    return false;
  }

  return snapshot.activeDays.every((item) => DAYS_OF_WEEK.includes(item.day));
};
