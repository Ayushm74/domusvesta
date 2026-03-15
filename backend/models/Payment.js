import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },

    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      required: true,
    },

    amount: { type: Number, required: true },

    platformCommission: { type: Number, default: 0 }, // absolute amount

    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["card", "upi", "wallet", "bank_transfer"],
      default: "card",
    },

    transactionId: { type: String }, // from Stripe or PSP

    stripePaymentIntentId: { type: String },

    paidAt: { type: Date },
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);

