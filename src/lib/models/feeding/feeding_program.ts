import mongoose, { Document, models, Types, Schema } from "mongoose";

export interface IFeedingProgram extends Document {
    name: string;
    description?: string;
    date_started: Date;
    date_ended?: Date;
    last_modified: Date;
    status: string;
    beneficiaries?: Types.ObjectId[];
    pinned: boolean;
}

const FeedingProgramSchema = new Schema<IFeedingProgram>({
    name: { type: String, required: true },
    description: { type: String },
    date_started: { type: Date, required: true },
    date_ended: { type: Date },
    last_modified: { type: Date, required: true },
    status: {
        type: String,
        enum: ["To Be Done", "Ongoing", "Done"],
        default: "To Be Done",
        required: true,
    },
    beneficiaries: [{ type: Types.ObjectId, ref: "feeding_child" }],
    pinned: { type: Boolean, default: false, required: true  },
}, {timestamps: true});

const Feeding_program =
    models.feeding_program || mongoose.model<IFeedingProgram>("feeding_program", FeedingProgramSchema);

export default Feeding_program;
