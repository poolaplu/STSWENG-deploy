import mongoose, { Document, models, Types, Schema } from "mongoose";

export interface ITransaction extends Document {
    name: string;
    date: Date;
    type: "Expense" | "Return";
    price: number;
    quantity?: number;
}

const TransactionSchema = new Schema<ITransaction>({
    date: { type: Date, required: true, default: () => new Date() },
    type: { type: String, required: true, enum: ["Expense", "Return"] },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number },
});

const Transaction = models.transaction || mongoose.model<ITransaction>("transaction", TransactionSchema);

export default Transaction;
