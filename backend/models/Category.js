import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String }, // icon name for frontend mapping
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);

