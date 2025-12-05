import { NextResponse, NextRequest } from "next/server";
import Transaction from "@/lib/models/business/transaction";
import Intervention from "@/lib/models/interventions/intervention";
import dbConnect from "@/lib/mongoose";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const body = await req.json();

        const { interventionId, ...transactionData } = body;

        // Basic field validation
        if (
            !transactionData.name ||
            transactionData.price === undefined ||
            !transactionData.quantity ||
            !transactionData.date ||
            !transactionData.type
        ) {
            return NextResponse.json({ error: "Missing required transaction fields" }, { status: 400 });
        }

        if (transactionData.price < 0) {
            return NextResponse.json({ error: "Price cannot be negative." }, { status: 400 });
        }

        if (transactionData.quantity < 0) {
            return NextResponse.json({ error: "Quantity cannot be negative." }, { status: 400 });
        }

        // Create the new transaction
        const newTransaction = new Transaction({ ...transactionData });
        await newTransaction.save();

        // If interventionId is provided, update the related intervention
        if (interventionId) {
            await Intervention.findByIdAndUpdate(
                interventionId,
                { $push: { expenditures: newTransaction._id } },
                { new: true }
            );
        }

        return NextResponse.json(newTransaction, { status: 201 });
    } catch (err) {
        console.error("Error creating transaction:", err);
        return NextResponse.json({ error: "Failed to create transaction", details: err }, { status: 500 });
    }
}

export async function GET() {
    await dbConnect();

    try {
        const transactions = await Transaction.find().sort({ date: -1 }).lean();
        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
}
