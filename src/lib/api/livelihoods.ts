import { Livelihood } from "@/types/livelihoods";
import { Transaction } from "@/types/transactions";

export async function fetchLivelihoods(): Promise<Livelihood[]> {
    const res = await fetch("/api/livelihood");
    if (!res.ok) throw new Error("Failed to fetch livelihoods.");
    return res.json();
}

export async function fetchLivelihoodById(id: string): Promise<Livelihood> {
    try {
        const response = await fetch(`/api/livelihood/${id}`);

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.error || "Failed to fetch livelihood.");
        }

        return response.json();
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error", err);
        throw err;
    }
}

export async function saveLivelihood(livelihood: Livelihood): Promise<Livelihood> {
    const isNew = !livelihood._id;
    const url = isNew ? "/api/livelihood" : `/api/livelihood/${livelihood._id}`;
    const method = isNew ? "POST" : "PATCH";

    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: livelihood.name,
                date_created: livelihood.date_created,
                pinned: livelihood.pinned,
                last_modified: new Date().toISOString(),
                transactions: livelihood.transactions,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.message || "Failed to save livelihood.");
        }

        return response.json();
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error", err);
        throw err;
    }
}

export async function deleteLivelihood(id: string): Promise<void> {
    try {
        const response = await fetch(`/api/livelihood/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.error || "Failed to delete livelihood.");
        }
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error", err);
        throw err;
    }
}

// Transaction API functions
export async function fetchTransactions(): Promise<Transaction[]> {
    const res = await fetch("/api/transaction");
    if (!res.ok) throw new Error("Failed to fetch transactions.");
    return res.json();
}

export async function fetchTransactionById(id: string): Promise<Transaction> {
    try {
        const response = await fetch(`/api/transaction/${id}`);

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.error || "Failed to fetch transaction.");
        }

        return response.json();
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error", err);
        throw err;
    }
}

export async function fetchTransactionsByLivelihoodId(livelihoodId: string): Promise<Transaction[]> {
    try {
        const response = await fetch(`/api/transaction?livelihood_id=${livelihoodId}`);

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.error || "Failed to fetch transactions for livelihood.");
        }

        return response.json();
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error", err);
        throw err;
    }
}

export async function saveTransaction(transaction: Transaction): Promise<Transaction> {
    const isNew = !transaction._id;
    const url = isNew ? "/api/transaction" : `/api/transaction/${transaction._id}`;
    const method = isNew ? "POST" : "PATCH";

    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: transaction.name,
                date: transaction.date,
                type: transaction.type,
                price: transaction.price,
                quantity: transaction.quantity,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.error || "Failed to save transaction.");
        }

        return response.json();
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error", err);
        throw err;
    }
}

export async function deleteTransaction(id: string): Promise<void> {
    try {
        const response = await fetch(`/api/transaction/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.error || "Failed to delete transaction.");
        }
    } catch (err) {
        console.error(err instanceof Error ? err.message : "Unknown error", err);
        throw err;
    }
}
