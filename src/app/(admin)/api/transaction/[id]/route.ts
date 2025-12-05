import { NextResponse } from "next/server";
import Transaction from "@/lib/models/business/transaction";
import dbConnect from "@/lib/mongoose";
import Intervention from "@/lib/models/interventions/intervention";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    try {
        const transaction = await Transaction.findById(id).lean();
        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }
        return NextResponse.json(transaction);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching transaction" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    const updates = await request.json();

    try {
        if (updates.price < 0) {
            return NextResponse.json({ error: "Price cannot be negative." }, { status: 400 });
        }

        if (updates.quantity < 0) {
            return NextResponse.json({ error: "Quantity cannot be negative." }, { status: 400 });
        }

        const updated = await Transaction.findByIdAndUpdate(id, updates, { new: true });
        if (!updated) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Error updating transaction" }, { status: 400 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    const updates = await request.json();

    try {
        const updated = await Transaction.findByIdAndUpdate(id, { $set: updates }, { new: true });
        if (!updated) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Error patching transaction" }, { status: 400 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    try {
        const transactionId = id;

        // Delete the transaction
        const deleted = await Transaction.findByIdAndDelete(transactionId);
        if (!deleted) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Remove the transaction ID from any intervention.expenditures
        await Intervention.updateMany(
            { expenditures: transactionId },
            { $pull: { expenditures: transactionId } }
        );

        return NextResponse.json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json({ error: "Error deleting transaction" }, { status: 500 });
    }
}
