import { Household } from "@/types/households";

export async function saveHousehold(household: Household): Promise<Household> {
  const isEditing = !!household._id;

  const url = isEditing ? `/api/household/${household._id}` : `/api/household`;
  const method = isEditing ? "PATCH" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...household,
      head:
        typeof household.head === "string"
          ? household.head
          : household.head?._id ?? "",
    }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Failed to save household.");
  }

  return res.json();
}

export async function deleteHousehold(household: Household): Promise<boolean> {
  if (!household?._id) {
    throw new Error("Household ID is missing.");
  }

  const res = await fetch(`/api/household/${household._id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || "Failed to delete household.");
  }

  return true;
}
