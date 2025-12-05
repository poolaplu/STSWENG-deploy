import mongoose, { Document, Types, Schema } from "mongoose";

const userAccountType = ["admin", "member"] as const;
export type UserAccountType = (typeof userAccountType)[number];

export interface IUserAccount extends Document {
    _id: Types.ObjectId;
    username: string;
    password: string;
    role: UserAccountType;
}

const UserAccountSchema = new Schema<IUserAccount>({
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: userAccountType, default: userAccountType[1], required: true },
});

let UserAccount: mongoose.Model<IUserAccount>;
try {
    UserAccount = mongoose.model<IUserAccount>("useraccount");
} catch {
    UserAccount = mongoose.model<IUserAccount>("useraccount", UserAccountSchema);
}

export default UserAccount;
