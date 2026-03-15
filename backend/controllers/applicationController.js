import { Application } from "../models/Application.js";
import { Job } from "../models/Job.js";
import { Professional } from "../models/Professional.js";

export const applyToJob = async (req, res) => {
  try {
    const { jobId, message } = req.body;
    if (!jobId) {
      return res.status(400).json({ message: "jobId is required" });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(403).json({
        message: "Professional profile required. Complete your profile first.",
      });
    }
    if (professional.verificationStatus !== "approved") {
      return res.status(403).json({
        message: "Your account is not yet verified. Only verified professionals can apply.",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.status !== "open") {
      return res.status(400).json({ message: "Job is no longer open for applications" });
    }

    const existing = await Application.findOne({
      jobId,
      professionalId: professional._id,
    });
    if (existing) {
      return res.status(400).json({ message: "You have already applied to this job" });
    }

    const application = await Application.create({
      jobId,
      professionalId: professional._id,
      message: message || undefined,
    });

    const populated = await Application.findById(application._id)
      .populate("jobId", "title description serviceCategory location budgetMin budgetMax status")
      .populate("professionalId");

    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const listMyApplications = async (req, res) => {
  const professional = await Professional.findOne({ userId: req.user._id });
  if (!professional) {
    return res.json([]);
  }

  const applications = await Application.find({ professionalId: professional._id })
    .sort({ createdAt: -1 })
    .populate("jobId", "title description serviceCategory location budgetMin budgetMax status createdBy")
    .populate("jobId.createdBy", "name");
  res.json(applications);
};

export const listApplicationsForJob = async (req, res) => {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }
  if (!job.createdBy.equals(req.user._id)) {
    return res.status(403).json({ message: "Not authorized to view applications for this job" });
  }

  const applications = await Application.find({ jobId })
    .sort({ createdAt: -1 })
    .populate({ path: "professionalId", populate: { path: "userId", select: "name email phone location" } });
  res.json(applications);
};

export const acceptApplication = async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) {
      return res.status(400).json({ message: "applicationId is required" });
    }

    const application = await Application.findById(applicationId)
      .populate("jobId");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (application.status !== "pending") {
      return res.status(400).json({ message: "Application is no longer pending" });
    }

    const job = application.jobId;
    if (!job.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the job owner can accept an application" });
    }
    if (job.status !== "open") {
      return res.status(400).json({ message: "Job already has a professional assigned" });
    }

    job.assignedProfessional = application.professionalId._id;
    job.status = "booked";
    job.statusHistory = job.statusHistory || [];
    job.statusHistory.push({
      status: "booked",
      changedBy: req.user._id,
    });
    await job.save();

    application.status = "accepted";
    await application.save();

    await Application.updateMany(
      { jobId: job._id, _id: { $ne: applicationId } },
      { $set: { status: "rejected" } }
    );

    const updated = await Job.findById(job._id).populate("assignedProfessional");
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
