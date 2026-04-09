import { type AISettings, type AppSnapshot, type ScheduleEntry } from "@/types";
import { createId } from "@/lib/utils/id";

const SYSTEM_PROMPT = `
You are an expert school schedule generator AI. Your task is to output ONLY valid JSON representing the schedule entries.
Do NOT wrap the response in markdown blocks like \`\`\`json. Just return the raw JSON array of ScheduleEntry objects.
Format:
[{
  "id": "unique-id",
  "classroomId": "string",
  "day": "senin|selasa|rabu|kamis|jumat|sabtu|minggu",
  "timeSlotId": "string",
  "subjectName": "string",
  "teacherId": "string"
}]

STRICT RULES:
1. A teacher cannot teach two classes at the same time slot on the same day.
2. A class cannot have multiple subjects at the same time slot on the same day.
3. Every class must fulfill EXACTLY the total hours per week specified in "assignments" for each subject-teacher combination. 
4. DO NOT schedule on "blockedSlots".
5. DO NOT exceed a teacher's maxHoursPerWeek if specified.
6. Only schedule on days where active=true in "activeDays".
7. You must ONLY output the JSON array. Outputting conversational text will break the system.
`;

async function callOpenAICompatible(settings: AISettings, messages: { role: string; content: string }[]): Promise<ScheduleEntry[]> {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        baseUrl: settings.baseUrl,
        model: settings.model,
        apiKey: settings.apiKey,
        messages: messages,
      }),
    });

    if (!response.ok) {
      let errorText = "Unknown error";
      try {
        const errJson = await response.json() as { error?: string };
        errorText = errJson.error || await response.text();
      } catch {
        // Ignore fallback
      }
      throw new Error(`AI Gateway Proxy Error: ${errorText}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Invalid format from AI response");
    }

    // Strip markdown code blocks in case AI hallucinates them despite system prompt
    const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(cleanedContent) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("AI did not return a valid JSON array");
    }

    return parsed.map((item: Record<string, unknown>) => ({
      ...item,
      id: createId(),
    })) as ScheduleEntry[];
  } catch (error) {
    console.error("AI Generation failed:", error);
    throw error;
  }
}

export async function generateSchedule(snapshot: AppSnapshot, settings: AISettings): Promise<ScheduleEntry[]> {
  const contextData = {
    teachers: snapshot.teachers,
    classrooms: snapshot.classrooms,
    timeSlots: snapshot.timeSlots,
    activeDays: snapshot.activeDays.filter((d) => d.active).map((d) => d.day),
    blockedSlots: snapshot.blockedSlots,
    assignments: snapshot.assignments,
  };

  const userPrompt = `
Generate a complete conflict-free schedule from scratch based on the strict rules.
Fill out the ScheduleEntry for all hours required by the assignments. 
Here is the data context (JSON format):
${JSON.stringify(contextData, null, 2)}
`;

  return callOpenAICompatible(settings, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]);
}

export async function solveConflicts(snapshot: AppSnapshot, settings: AISettings): Promise<ScheduleEntry[]> {
  const contextData = {
    teachers: snapshot.teachers,
    classrooms: snapshot.classrooms,
    timeSlots: snapshot.timeSlots,
    activeDays: snapshot.activeDays.filter((d) => d.active).map((d) => d.day),
    blockedSlots: snapshot.blockedSlots,
    assignments: snapshot.assignments,
    currentSchedule: snapshot.scheduleEntries,
  };

  const userPrompt = `
I have a schedule ("currentSchedule") that contains conflicts or errors. 
Please reorganize it to resolve any teacher double-bookings, class double-bookings, or blocked slot violations.
Keep as much of the original schedule intact as possible, but move conflicting entries or swap them to make it 100% conflict-free based on the rules.
Here is the data context (JSON format):
${JSON.stringify(contextData, null, 2)}
`;

  return callOpenAICompatible(settings, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]);
}
