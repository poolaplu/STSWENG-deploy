
import { MARITAL_STATUS_NAMES } from "@/types/members";
import mongoose, { Document, Types, Schema, models } from "mongoose";

export interface IMember extends Document {
    _id: Types.ObjectId | string;
    first_name: string;
    last_name: string;
    sex: string;
    birthdate?: Date;
    weight?: number;
    contact_number?: string;
    marital_status: string;
    partner?: Types.ObjectId;
    occupation: string;
    guardians?: Types.ObjectId[];
    household?: Types.ObjectId;
    general_notes?: string;
    sensitive_notes?: string;
}

const MemberSchema = new Schema<IMember>({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    sex: { type: String, enum: ["M", "F"], required: true },
    birthdate: { type: Date },
    weight: { type: Number, min: 0 },
    contact_number: { type: String },
    marital_status: { type: String, enum: MARITAL_STATUS_NAMES, required: true },
    partner: { type: Types.ObjectId, ref: "member" },
    occupation: { type: String, required: true, default: "Unemployed" },
    guardians: [{ type: Types.ObjectId, ref: "member" }],
    household: { type: Types.ObjectId, ref: "household" },
    general_notes: { type: String },
    sensitive_notes: { type: String },
});

const Member = models.member || mongoose.model<IMember>("member", MemberSchema);
export default Member;
