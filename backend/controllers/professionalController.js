import { Professional } from "../models/Professional.js";
import { Payment } from "../models/Payment.js";
import { Job } from "../models/Job.js";
import { findMatchingProfessionals } from "../services/matchingService.js";

export const applyAsProfessional = async (req, res) => {
  try {
    const {
      skills,
      serviceCategories,
      experienceYears,
      serviceAreas,
      minRate,
      maxRate,
      location,
    } = req.body;

    const verificationDocuments = (req.files || []).map((f) => f.path);

    const professional = await Professional.create({
      userId: req.user._id,
      skills: (skills || []).map((s) => s.toLowerCase()),
      serviceCategories: serviceCategories || [],
      experienceYears,
      serviceAreas: serviceAreas || [],
      minRate,
      maxRate,
      verificationDocuments,
      location,
      verificationStatus: "pending",
    });

    res.status(201).json(professional);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyProfessionalProfile = async (req, res) => {
  const profile = await Professional.findOne({ userId: req.user._id });
  res.json(profile);
};

export const updateMyProfessionalProfile = async (req, res) => {
  const updates = req.body;
  const profile = await Professional.findOneAndUpdate(
    { userId: req.user._id },
    updates,
    { new: true }
  );
  res.json(profile);
};

export const getMyEarningsOverview = async (req, res) => {
  const professional = await Professional.findOne({ userId: req.user._id });
  if (!professional) {
    return res.status(404).json({ message: "Professional profile not found" });
  }

  const [payments, jobsCompleted] = await Promise.all([
    Payment.find({
      professionalId: professional._id,
      status: "succeeded",
    }),
    Job.countDocuments({
      assignedProfessional: professional._id,
      status: "completed",
    }),
  ]);

  const totalEarnings = payments.reduce(
    (sum, p) => sum + (p.amount - p.platformCommission),
    0
  );

  res.json({
    totalEarnings,
    jobsCompleted,
    totalPayouts: payments.length,
  });
};

export const searchProfessionals = async (req, res) => {
  const { serviceCategory, location } = req.query;
  const results = await findMatchingProfessionals({
    serviceCategory,
    location,
    limit: 50,
  });
  res.json(results);
};

