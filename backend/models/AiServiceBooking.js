import mongoose from "mongoose";

const moneySchema = new mongoose.Schema(
  {
    serviceCharge: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, default: "INR" },
  },
  { _id: false }
);

const aiServiceBookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    conversationId: { type: String },
    userMessage: { type: String, required: true },
    extractedIntent: { type: mongoose.Schema.Types.Mixed, required: true },
    selectedProvider: { type: mongoose.Schema.Types.ObjectId, ref: "Professional", required: true },
    providerSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    rankedProviders: [{ type: mongoose.Schema.Types.Mixed }],
    quotation: { type: mongoose.Schema.Types.Mixed, required: true },
    pricing: { type: moneySchema, required: true },
    bookingStatus: {
      type: String,
      enum: ["booked", "failed", "needs_more_info"],
      default: "booked",
    },
    orchestration: {
      engine: { type: String, default: "gemini-direct" },
      handoffReady: { type: Boolean, default: true },
      agentTraceId: { type: String },
    },
  },
  { timestamps: true }
);

export const AiServiceBooking = mongoose.model(
  "AiServiceBooking",
  aiServiceBookingSchema
);
