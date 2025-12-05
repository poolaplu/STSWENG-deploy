import { Intervention } from "@/types/interventions";

export async function fetchInterventions(): Promise<Intervention[]> {
    const res = await fetch("/api/intervention");
    if (!res.ok) throw new Error("Failed to fetch interventions.");
    return res.json();
}

export async function fetchInterventionById(id: string): Promise<Intervention> {
    try {
        const response = await fetch(`/api/intervention/${id}`);

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.error || "Failed to fetch intervention.");
        }

        return response.json();
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error", err);
        throw err;
    }
}

export async function saveIntervention(program: Intervention): Promise<Intervention> {
    const isNew = !program._id;
    const url = isNew ? "/api/intervention" : `/api/intervention/${program._id}`;
    const method = isNew ? "POST" : "PATCH";

    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: program.name,
                description: program.description,
                date: program.date,
                sensitive: program.sensitive,
                type: program.type,
                pinned: program.pinned,
                last_modified: new Date().toISOString(),
                expenditures: program.expenditures,
                beneficiaries_member: program.beneficiaries_member,
                beneficiaries_household: program.beneficiaries_household,
                beneficiaries_cluster: program.beneficiaries_cluster,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.error || "Failed to save intervention.");
        }

        return response.json();
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error", err);
        throw err;
    }
}

export async function deleteIntervention(id: string): Promise<void> {
    try {
        const response = await fetch(`/api/intervention/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.error || "Failed to delete intervention.");
        }
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error", err);
        throw err;
    }
}
