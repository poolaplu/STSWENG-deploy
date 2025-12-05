import { Donation } from "@/types/donations";

export async function saveDonation(donation: Donation): Promise<Donation> {
  const isEditing = !!donation._id;

  const url = isEditing ? `/api/donation/${donation._id}` : `/api/donation`;
  const method = isEditing ? "PATCH" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(donation),
  });

  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || "Failed to save donation.");
  }

  return res.json();
}

export async function deleteDonation(id: string): Promise<boolean> {
  const response = await fetch(`/api/donation/${id}`, { method: "DELETE" });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody?.message || "Failed to delete donation.");
  }

  return true;
}
