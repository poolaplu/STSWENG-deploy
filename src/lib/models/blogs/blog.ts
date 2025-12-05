import mongoose, { Schema, model, models } from "mongoose";

const BlogSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    date_created: { type: String, required: true },
});

const BlogModel = models.Blog || model("Blog", BlogSchema);
export default BlogModel;
