"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../utils/supabase/server";

type ActionResult = { ok: true; message: string } | { ok: false; message: string };

export async function createTeam(formData: FormData): Promise<ActionResult> {
  const teamName = String(formData.get("teamName") || "").trim();
  const rawStudents = [1, 2, 3]
    .map((index) => String(formData.get(`student-${index}`) || "").trim().toLowerCase())
    .filter(Boolean);

  if (teamName.length < 2 || teamName.length > 120) return { ok: false, message: "Team name must be between 2 and 120 characters." };
  if (new Set(rawStudents).size !== rawStudents.length) return { ok: false, message: "Each student identifier must be unique." };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { ok: false, message: "Your session has expired. Please sign in again." };

  const { data: matchesData, error: lookupError } = await supabase.rpc("lookup_students", { identifiers: rawStudents });
  if (lookupError) return { ok: false, message: "Could not look up student accounts." };
  const matches = new Map<string, string>();
  matchesData?.forEach((student: { id: string; email: string; roll_number: string | null }) => {
    if (student.email) matches.set(student.email.toLowerCase(), student.id);
    if (student.roll_number) matches.set(student.roll_number.toLowerCase(), student.id);
  });

  const missing = rawStudents.filter((identifier) => !matches.has(identifier));
  if (missing.length) return { ok: false, message: `No student account found for: ${missing.join(", ")}` };

  const studentIds = Array.from(new Set([authData.user.id, ...rawStudents.map((identifier) => matches.get(identifier)!)]));
  if (studentIds.length > 4) return { ok: false, message: "A team can contain at most four students including you." };

  const { error } = await supabase.from("teams").insert({ team_name: teamName, student_ids: studentIds });
  if (error) {
    if (error.code === "23505") return { ok: false, message: "A team with this name already exists." };
    return { ok: false, message: "Unable to create the team. Please try again." };
  }

  revalidatePath("/dashboard/student/team-formation");
  return { ok: true, message: "Team created successfully." };
}
