import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  listPendingProfessionals,
  approveProfessional,
  adminStats,
  listUsers,
  listProfessionals,
  listJobs,
  listPayments,
  listReviews,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/pending-professionals", listPendingProfessionals);
router.patch("/approve-professional", approveProfessional);
router.get("/stats", adminStats);
router.get("/users", listUsers);
router.get("/professionals", listProfessionals);
router.get("/jobs", listJobs);
router.get("/payments", listPayments);
router.get("/reviews", listReviews);

export default router;

