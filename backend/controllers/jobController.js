import { Job } from "../models/Job.js";
import { Payment } from "../models/Payment.js";
import { Review } from "../models/Review.js";
import { Application } from "../models/Application.js";
import { Professional } from "../models/Professional.js";
import { findMatchingProfessionals } from "../services/matchingService.js";
import { recalculateProfessionalRating } from "../services/ratingService.js";

function toNum(v) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      serviceCategory,
      urgencyLevel,
      preferredDate,
      preferredTimeSlot,
      location,
      budgetMin,
      budgetMax,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!serviceCategory || !String(serviceCategory).trim()) {
      return res.status(400).json({ message: "Category is required" });
    }
    if (!location || !String(location).trim()) {
      return res.status(400).json({ message: "Location is required" });
    }

    const min = toNum(budgetMin);
    const max = toNum(budgetMax);
    if (min !== undefined && (min < 0 || !Number.isFinite(min))) {
      return res.status(400).json({ message: "Budget min must be a valid number" });
    }
    if (max !== undefined && (max < 0 || !Number.isFinite(max))) {
      return res.status(400).json({ message: "Budget max must be a valid number" });
    }
    if (min !== undefined && max !== undefined && min > max) {
      return res.status(400).json({ message: "Budget min cannot exceed budget max" });
    }

    const images = (req.files || []).map((f) => f.path);

    const job = await Job.create({
      title: String(title).trim(),
      description: description ? String(description).trim() : undefined,
      serviceCategory: String(serviceCategory).trim(),
      urgencyLevel: urgencyLevel || "flexible",
      preferredDate: preferredDate || undefined,
      preferredTimeSlot: preferredTimeSlot || undefined,
      location: String(location).trim(),
      budgetMin: min,
      budgetMax: max,
      images,
      createdBy: req.user._id,
      statusHistory: [{ status: "open", changedBy: req.user._id }],
    });

    const matches = await findMatchingProfessionals({
      serviceCategory: String(serviceCategory).trim(),
      location: String(location).trim(),
    });

    res.status(201).json({ job, matches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const listJobsForClient = async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user._id })
    .sort({ updatedAt: -1 })
    .populate({ path: "assignedProfessional", populate: { path: "userId", select: "name email phone location" } });
  res.json(jobs);
};

export const listBookingsForClient = async (req, res) => {
  const jobs = await Job.find({
    createdBy: req.user._id,
    status: { $in: ["booked", "in_progress"] },
  })
    .sort({ updatedAt: -1 })
    .populate({ path: "assignedProfessional", populate: { path: "userId", select: "name email phone location" } });
  res.json(jobs);
};

export const listAvailableJobsForProfessionals = async (req, res) => {
  const jobs = await Job.find({ status: "open" })
    .sort({ createdAt: -1 })
    .populate("createdBy", "name location");
  res.json(jobs);
};

export const listJobsForProfessional = async (req, res) => {
  const professional = await Professional.findOne({ userId: req.user._id });
  if (!professional) {
    return res.json([]);
  }
  const jobs = await Job.find({ assignedProfessional: professional._id })
    .sort({ updatedAt: -1 })
    .populate("createdBy", "name email phone location");
  res.json(jobs);
};

export const updateJobStatus = async (req, res) => {
  try {
    const { jobId, status } = req.body;
    if (!jobId || !status) {
      return res.status(400).json({ message: "jobId and status are required" });
    }
    const allowed = ["in_progress", "completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "status must be in_progress or completed" });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(403).json({ message: "Professional profile required" });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (!job.assignedProfessional || !job.assignedProfessional.equals(professional._id)) {
      return res.status(403).json({ message: "You are not assigned to this job" });
    }

    if (status === "in_progress") {
      if (job.status !== "booked") {
        return res.status(400).json({ message: "Job must be booked before starting" });
      }
    }
    if (status === "completed") {
      if (job.status !== "in_progress" && job.status !== "booked") {
        return res.status(400).json({ message: "Job must be in progress before marking completed" });
      }
    }

    job.status = status;
    job.statusHistory = job.statusHistory || [];
    job.statusHistory.push({ status, changedBy: req.user._id });
    await job.save();

    if (status === "completed") {
      await Professional.findByIdAndUpdate(professional._id, {
        $inc: { jobsCompleted: 1 },
      });
    }

    const updated = await Job.findById(job._id)
      .populate("createdBy", "name email phone location")
      .populate({ path: "assignedProfessional", populate: { path: "userId", select: "name email phone location" } });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const cancelJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ message: "jobId is required" });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (!job.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the job owner can cancel the job" });
    }
    if (!["open", "booked", "in_progress"].includes(job.status)) {
      return res.status(400).json({ message: "Job cannot be cancelled in current state" });
    }

    job.status = "cancelled";
    job.statusHistory = job.statusHistory || [];
    job.statusHistory.push({ status: "cancelled", changedBy: req.user._id });
    job.assignedProfessional = undefined;
    await job.save();

    const updated = await Job.findById(job._id).populate("assignedProfessional");
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const editJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { title, description, serviceCategory, location, budgetMin, budgetMax } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (!job.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the job owner can edit the job" });
    }
    if (job.status !== "open") {
      return res.status(400).json({ message: "Only open jobs can be edited" });
    }

    if (title !== undefined) job.title = String(title).trim();
    if (description !== undefined) job.description = String(description).trim();
    if (serviceCategory !== undefined) job.serviceCategory = String(serviceCategory).trim();
    if (location !== undefined) job.location = String(location).trim();
    const min = toNum(budgetMin);
    const max = toNum(budgetMax);
    if (min !== undefined) job.budgetMin = min;
    if (max !== undefined) job.budgetMax = max;
    await job.save();

    const updated = await Job.findById(job._id).populate("assignedProfessional");
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getJobById = async (req, res) => {
  const { jobId } = req.params;
  const job = await Job.findById(jobId)
    .populate("createdBy", "name email phone location")
    .populate({ path: "assignedProfessional", populate: { path: "userId", select: "name email phone location" } });
  if (!job) return res.status(404).json({ message: "Job not found" });
  res.json(job);
};

export const householdDashboardStats = async (req, res) => {
  const [totalJobs, activeBookings, completedJobs, pendingPayments] = await Promise.all([
    Job.countDocuments({ createdBy: req.user._id }),
    Job.countDocuments({
      createdBy: req.user._id,
      status: { $in: ["booked", "in_progress"] },
    }),
    Job.countDocuments({ createdBy: req.user._id, status: "completed" }),
    Payment.countDocuments({ clientId: req.user._id, status: "pending" }),
  ]);
  res.json({
    totalJobs,
    activeBookings,
    completedJobs,
    pendingPayments,
  });
};

export const professionalDashboardStats = async (req, res) => {
  const professional = await Professional.findOne({ userId: req.user._id });
  if (!professional) {
    return res.json({
      availableJobs: 0,
      appliedCount: 0,
      acceptedCount: 0,
      totalEarnings: 0,
    });
  }

  const [availableJobs, appliedCount, acceptedCount, payments] = await Promise.all([
    Job.countDocuments({ status: "open" }),
    Application.countDocuments({ professionalId: professional._id }),
    Job.countDocuments({
      assignedProfessional: professional._id,
      status: { $in: ["booked", "in_progress"] },
    }),
    Payment.find({
      professionalId: professional._id,
      status: "succeeded",
    }),
  ]);

  const totalEarnings = payments.reduce((sum, p) => sum + (p.amount - (p.platformCommission || 0)), 0);

  res.json({
    availableJobs,
    appliedCount,
    acceptedCount,
    totalEarnings,
  });
};

export const createReview = async (req, res) => {
  try {
    const {
      jobId,
      professionalId,
      ratingQuality,
      ratingCommunication,
      ratingPunctuality,
      comment,
    } = req.body;

    if (!jobId || !professionalId) {
      return res.status(400).json({ message: "jobId and professionalId are required" });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (!job.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the job owner can leave a review" });
    }
    if (job.status !== "completed") {
      return res.status(400).json({ message: "Only completed jobs can be reviewed" });
    }

    const existing = await Review.findOne({ jobId, clientId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this job" });
    }

    const q = Math.min(5, Math.max(1, Number(ratingQuality) || 3));
    const c = Math.min(5, Math.max(1, Number(ratingCommunication) || 3));
    const p = Math.min(5, Math.max(1, Number(ratingPunctuality) || 3));
    const overallRating = (q + c + p) / 3;

    const review = await Review.create({
      jobId,
      professionalId,
      clientId: req.user._id,
      ratingQuality: q,
      ratingCommunication: c,
      ratingPunctuality: p,
      overallRating,
      comment: comment ? String(comment).trim() : undefined,
    });

    await recalculateProfessionalRating(professionalId);

    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const listClientReviews = async (req, res) => {
  const reviews = await Review.find({ clientId: req.user._id })
    .sort({ createdAt: -1 })
    .populate("jobId", "title status")
    .populate({ path: "professionalId", populate: { path: "userId", select: "name" } });
  res.json(reviews);
};

export const createPayment = async (req, res) => {
  try {
    const { jobId, amount, paymentMethod } = req.body;

    if (!jobId || amount === undefined) {
      return res.status(400).json({ message: "jobId and amount are required" });
    }
    const numAmount = toNum(amount);
    if (numAmount === undefined || numAmount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const job = await Job.findById(jobId).populate("assignedProfessional");
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (!job.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: "Not your job" });
    }
    if (job.status !== "completed") {
      return res.status(400).json({ message: "Payment only allowed for completed jobs" });
    }
    if (!job.assignedProfessional) {
      return res.status(400).json({ message: "No professional assigned to this job" });
    }

    const platformCommission = Math.round(numAmount * 0.1);
    const payment = await Payment.create({
      jobId,
      clientId: req.user._id,
      professionalId: job.assignedProfessional._id,
      amount: numAmount,
      platformCommission,
      status: "succeeded",
      paymentMethod: paymentMethod || "card",
      paidAt: new Date(),
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const listClientPayments = async (req, res) => {
  const payments = await Payment.find({ clientId: req.user._id })
    .sort({ createdAt: -1 })
    .populate("jobId", "title status");
  res.json(payments);
};
