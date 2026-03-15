import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    message: { type: String },
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, professionalId: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);
