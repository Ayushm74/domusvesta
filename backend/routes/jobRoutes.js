import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  createJob,
  listJobsForClient,
  listBookingsForClient,
  listAvailableJobsForProfessionals,
  listJobsForProfessional,
  updateJobStatus,
  cancelJob,
  editJob,
  getJobById,
  householdDashboardStats,
  professionalDashboardStats,
  createReview,
  createPayment,
  listClientPayments,
  listClientReviews,
} from "../controllers/jobController.js";

const router = express.Router();

// Household (client)
router.post(
  "/create",
  protect,
  authorizeRoles("client"),
  upload.array("images", 5),
  createJob
);
router.get("/my", protect, authorizeRoles("client"), listJobsForClient);
router.get("/bookings", protect, authorizeRoles("client"), listBookingsForClient);
router.get("/stats/household", protect, authorizeRoles("client"), householdDashboardStats);
router.patch("/cancel", protect, authorizeRoles("client"), cancelJob);
router.put("/:jobId", protect, authorizeRoles("client"), editJob);
router.post("/review", protect, authorizeRoles("client"), createReview);
router.post("/pay", protect, authorizeRoles("client"), createPayment);
router.get("/payments/my", protect, authorizeRoles("client"), listClientPayments);
router.get("/reviews/my", protect, authorizeRoles("client"), listClientReviews);

// Professional
router.get(
  "/available",
  protect,
  authorizeRoles("professional"),
  listAvailableJobsForProfessionals
);
router.get(
  "/mine",
  protect,
  authorizeRoles("professional"),
  listJobsForProfessional
);
router.get(
  "/stats/professional",
  protect,
  authorizeRoles("professional"),
  professionalDashboardStats
);
router.patch(
  "/status",
  protect,
  authorizeRoles("professional"),
  updateJobStatus
);

// Shared (must be last to avoid matching /available, /mine, etc.)
router.get("/:jobId", protect, getJobById);

export default router;
