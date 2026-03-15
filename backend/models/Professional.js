import mongoose from "mongoose";

const professionalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    skills: [{ type: String }], // e.g., ["plumbing", "electrical"]

    serviceCategories: [{ type: String }], // e.g., ["plumbing.repair", "cleaning.deep"]

    experienceYears: { type: Number, default: 0 },

    serviceAreas: [{ type: String }], // city / postcode strings

    minRate: { type: Number }, // hourly or per-job indicative min
    maxRate: { type: Number },

    availabilitySchedule: {
      type: Map,
      of: [String], // e.g. { mon: ["09:00-13:00", "14:00-18:00"] }
      default: {},
    },

    portfolioImages: [{ type: String }], // Cloudinary URLs

    verificationDocuments: [{ type: String }], // Cloudinary URLs

    insurance: { type: String }, // Cloudinary URL or policy info

    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },

    jobsCompleted: { type: Number, default: 0 },

    location: { type: String },

    availability: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Professional = mongoose.model("Professional", professionalSchema);

