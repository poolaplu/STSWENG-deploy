import { Member } from "@/types/members";
export async function saveMember(member: Member): Promise<Member> {
    const isEditing = !!member._id;

    const url = isEditing ? `/api/member/${member._id}` : `/api/member`;
    const method = isEditing ? "PATCH" : "POST";

    // Clean the household field
    const cleanedMember = {
        ...member,
        household: member.household && typeof member.household === "object"
            ? member.household._id
            : member.household || undefined, // Convert empty string to undefined
    };

    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedMember),
    });

    if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || "Failed to save member.");
    }

    return res.json();
}

export async function deleteMember(member: Member) {
  if (!member?._id) {
    throw new Error("Member ID is missing.");
  }

  const response = await fetch(`/api/member/${member._id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody?.message || "Failed to delete member.");
  }

  return true;
}
