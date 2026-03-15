import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },

    serviceCategory: { type: String, required: true }, // matches professional.serviceCategories

    urgencyLevel: {
      type: String,
      enum: ["flexible", "soon", "urgent"],
      default: "flexible",
    },

    preferredDate: { type: Date },
    preferredTimeSlot: { type: String }, // e.g. "09:00-12:00"

    location: { type: String, required: true },

    budgetMin: { type: Number },
    budgetMax: { type: Number },

    images: [{ type: String }], // Cloudinary URLs

    status: {
      type: String,
      enum: ["open", "booked", "in_progress", "completed", "cancelled"],
      default: "open",
    },

    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedProfessional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
    },
  },
  { timestamps: true }
);

export const Job = mongoose.model("Job", jobSchema);

