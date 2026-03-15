import { Professional } from "../models/Professional.js";
import { Job } from "../models/Job.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";

export const listPendingProfessionals = async (req, res) => {
  const pending = await Professional.find({
    verificationStatus: "pending",
  }).populate("userId", "name email location");
  res.json(pending);
};

export const approveProfessional = async (req, res) => {
  const { professionalId, approve } = req.body;
  const professional = await Professional.findById(professionalId);
  if (!professional) return res.status(404).json({ message: "Not found" });

  professional.verificationStatus = approve ? "approved" : "rejected";
  await professional.save();

  res.json(professional);
};

export const adminStats = async (req, res) => {
  const [usersCount, professionalsCount, jobsCount, completedJobsCount, paymentsCount] =
    await Promise.all([
      User.countDocuments(),
      Professional.countDocuments({ verificationStatus: "approved" }),
      Job.countDocuments(),
      Job.countDocuments({ status: "completed" }),
      Payment.countDocuments({ status: "succeeded" }),
    ]);

  res.json({
    usersCount,
    professionalsCount,
    jobsCount,
    completedJobsCount,
    paymentsCount,
  });
};

export const listUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(50);
  res.json(users);
};

export const listProfessionals = async (req, res) => {
  const professionals = await Professional.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("userId", "name email location");
  res.json(professionals);
};

export const listJobs = async (req, res) => {
  const jobs = await Job.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("createdBy", "name")
    .populate("assignedProfessional");
  res.json(jobs);
};

export const listPayments = async (req, res) => {
  const payments = await Payment.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("jobId", "title")
    .populate("clientId", "name")
    .populate("professionalId");
  res.json(payments);
};

export const listReviews = async (req, res) => {
  const reviews = await Review.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("jobId", "title")
    .populate("professionalId")
    .populate("clientId", "name");
  res.json(reviews);
};

