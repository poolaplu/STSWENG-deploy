import mongoose, { Document, models, Schema } from "mongoose";

export interface IDonation extends Document {
    date: Date;
    isItem: boolean;
    name?: string;
    value: number;
    donor_name: string;
    contact_no?: number;
}

const DonationSchema = new Schema<IDonation>({
    date: { type: Date, required: true },
    isItem: { type: Boolean, required: true, default: false },
    name: { type: String },
    value: { type: Number, required: true },
    donor_name: { type: String, required: true },
    contact_no: { type: Number }
});

const Donation = models.donation || mongoose.model<IDonation>("donation", DonationSchema);

export default Donation;
