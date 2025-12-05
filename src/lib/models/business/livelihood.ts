import mongoose, { Document, models, Types, Schema } from "mongoose";

export interface ILivelihood extends Document {
    name: string;
    date_created: Date;
    transactions?: Types.ObjectId[];
    pinned: boolean;
    last_modified: Date;
}

const LivelihoodSchema = new Schema<ILivelihood>({
    name: { type: String, required: true },
    date_created: { type: Date, required: true, default: () => new Date() },
    transactions: [{ type: Types.ObjectId, ref: "transaction" }],
    pinned: { type: Boolean, required: true, default: false },
    last_modified: { type: Date, required: true, default: () => new Date() },
});

const Livelihood = models.livelihood || mongoose.model<ILivelihood>("livelihood", LivelihoodSchema);

export default Livelihood;
