import mongoose, { Document, models, Types, Schema } from "mongoose";

export interface IIntervention extends Document {
    name: string;
    description?: string;
    date: Date;
    sensitive: boolean;
    type: string;
    pinned: boolean;
    last_modified: Date;
    expenditures?: Types.ObjectId[];
    beneficiaries_member?: Types.ObjectId[];
    beneficiaries_household?: Types.ObjectId[];
    beneficiaries_cluster?: string[];
}

const InterventionSchema = new Schema<IIntervention>({
    name: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    sensitive: { type: Boolean, required: true, default: false },
    type: { type: String, required: true },
    pinned: { type: Boolean, required: true, default: false },
    last_modified: { type: Date, required: true, default: () => new Date() },
    beneficiaries_member: [{ type: Types.ObjectId, ref: "member" }],
    beneficiaries_household: [{ type: Types.ObjectId, ref: "household" }],
    beneficiaries_cluster: [{ type: String }],
    expenditures: [{ type: Types.ObjectId, ref: "transaction" }],
});

const Intervention = models.intervention || mongoose.model<IIntervention>("intervention", InterventionSchema);

export default Intervention;
