import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    // Add other fields here if your project needs them (e.g., description, slug)
  },
  {
    timestamps: true,
  }
);

// This checks if the model is already defined to prevent "OverwriteModelError"
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;
