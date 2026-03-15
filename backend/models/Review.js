import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      required: true,
    },

    ratingQuality: { type: Number, min: 1, max: 5, required: true },
    ratingCommunication: { type: Number, min: 1, max: 5, required: true },
    ratingPunctuality: { type: Number, min: 1, max: 5, required: true },

    overallRating: { type: Number, min: 1, max: 5, required: true },

    comment: { type: String },
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", reviewSchema);

