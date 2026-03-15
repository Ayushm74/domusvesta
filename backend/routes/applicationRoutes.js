import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  applyToJob,
  listMyApplications,
  listApplicationsForJob,
  acceptApplication,
} from "../controllers/applicationController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("professional"),
  applyToJob
);

router.get(
  "/my",
  protect,
  authorizeRoles("professional"),
  listMyApplications
);

router.get(
  "/job/:jobId",
  protect,
  authorizeRoles("client"),
  listApplicationsForJob
);

router.patch(
  "/accept",
  protect,
  authorizeRoles("client"),
  acceptApplication
);

export default router;
