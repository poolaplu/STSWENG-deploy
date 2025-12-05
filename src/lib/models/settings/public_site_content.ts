import mongoose, { Schema, Document } from "mongoose";

export interface IPublicSiteContent extends Document {
  about: { mission: string; vision: string; history: string; };
  impact: { mainTitle: string; mainDescription: string; };
  donate: { gcashNumber: string; bankDetails: string; otherDetails: string; };
  footer: { description: string; email: string; phone: string; address: string; };
}

const PublicSiteContentSchema = new Schema(
  {
    about: {
      mission: { type: String, default: "" },
      vision: { type: String, default: "" },
      history: { type: String, default: "" },
    },
    impact: {
      mainTitle: { type: String, default: "" },
      mainDescription: { type: String, default: "" },
    },
    donate: {
      gcashNumber: { type: String, default: "" },
      bankDetails: { type: String, default: "" },
      otherDetails: { type: String, default: "" },
    },
    footer: {
      description: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
    }
  },
  { timestamps: true }
);

const PublicSiteContent = mongoose.models.PublicSiteContent || mongoose.model("PublicSiteContent", PublicSiteContentSchema);
export default PublicSiteContent;