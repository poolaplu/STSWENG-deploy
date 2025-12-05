import { Program } from "@/types/programs";

export async function getPrograms() {
  const res = await fetch("/api/programs", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch programs");
  return res.json();
}

export async function getProgram(id: string) {
  const res = await fetch(`/api/programs/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch program");
  return res.json();
}

export async function saveProgram(program: Program) {
  const res = await fetch("/api/programs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(program),
  });

  if (!res.ok) throw new Error("Failed to save program");
  return res.json();
}

export async function updateProgram(id: string, program: Program) {
  const res = await fetch(`/api/programs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(program),
  });

  if (!res.ok) throw new Error("Failed to update program");
  return res.json();
}

export async function deleteProgram(id: string) {
  const res = await fetch(`/api/programs/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete program");
  return res.json();
}