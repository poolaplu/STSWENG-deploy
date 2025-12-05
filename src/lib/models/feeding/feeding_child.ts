import mongoose, { Document, models, Types, Schema, ObjectId } from "mongoose";

export interface IFeedingChild extends Document {
    idMember: ObjectId;
    weight_initial?: number;
    height_initial?: number;
    weight_third?: number;
    height_third?: number;
    weight_sixth?: number;
    height_sixth?: number;
    weight_ninth?: number;
    height_ninth?: number;
    weight_twelvth?: number;
    height_twelvth?: number;
}

const FeedingChildSchema = new Schema<IFeedingChild>({
    idMember: { type: Types.ObjectId, ref: "member", required: true },
    weight_initial: { type: Number },
    height_initial: { type: Number },
    weight_third: { type: Number },
    height_third: { type: Number },
    weight_sixth: { type: Number },
    height_sixth: { type: Number },
    weight_ninth: { type: Number },
    height_ninth: { type: Number },
    weight_twelvth: { type: Number },
    height_twelvth: { type: Number },
});

const Feeding_child =
    models.feeding_child || mongoose.model<IFeedingChild>("feeding_child", FeedingChildSchema);

export default Feeding_child;
