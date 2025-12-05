import { Feeding } from "@/types/feedings";

export async function fetchFeedings(): Promise<Feeding[]> {
    const res = await fetch("/api/feeding");
    if (!res.ok) throw new Error("Failed to fetch feedings.");
    return res.json();
}

export async function fetchFeedingById(id: string): Promise<Feeding> {
    try {
        const response = await fetch(`/api/feeding/${id}`);

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.error || "Failed to fetch feeding program.");
        }

        return response.json();
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error", err);
        throw err;
    }
}

export async function saveFeedingProgram(program: Feeding): Promise<Feeding> {
    const isNew = !program._id;
    const url = isNew ? "/api/feeding" : `/api/feeding/${program._id}`;
    const method = isNew ? "POST" : "PATCH";

    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: program.name,
                description: program.description,
                date_started: program.date_started,
                date_ended: program.date_ended,
                last_modified: new Date().toISOString(),
                status: program.status,
                beneficiaries: program.beneficiaries,
                pinned: program.pinned,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.error || "API error");
        }

        return response.json();
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error", err);
        throw err;
    }
}

export async function deleteFeedingProgram(id: string): Promise<void> {
    try {
        const response = await fetch(`/api/feeding/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.error || "Failed to delete feeding program.");
        }
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error", err);
        throw err;
    }
}
