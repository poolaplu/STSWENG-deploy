import mongoose, { Document, Types, Schema, models } from "mongoose";
import { HOA_STATUS_OPTIONS, OWNERSHIP_OPTIONS } from "@/types/households";

export interface IHousehold extends Document {
    name: string;
    head?: Types.ObjectId;
    cluster: string;
    ownership: string;
    hoa_last_reached_out: Date;
    hoa_status: string;
    members?: Types.ObjectId[];
}

const HouseholdSchema = new Schema<IHousehold>({
    name: { type: String, required: true },
    head: { type: Types.ObjectId, ref: "member" },
    cluster: { type: String, required: true },
    ownership: { type: String, enum: OWNERSHIP_OPTIONS, required: true },
    hoa_last_reached_out: { type: Date, required: true },
    hoa_status: { type: String, enum: HOA_STATUS_OPTIONS, required: true },
    members: [{ type: Types.ObjectId, ref: "member" }],
});

const Household = models.household || mongoose.model<IHousehold>("household", HouseholdSchema);

export default Household;
