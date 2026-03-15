import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  applyAsProfessional,
  getMyProfessionalProfile,
  updateMyProfessionalProfile,
  getMyEarningsOverview,
  searchProfessionals,
} from "../controllers/professionalController.js";

const router = express.Router();

router.post(
  "/apply",
  protect,
  authorizeRoles("professional"),
  upload.array("documents", 5),
  applyAsProfessional
);

router.get(
  "/me",
  protect,
  authorizeRoles("professional"),
  getMyProfessionalProfile
);

router.patch(
  "/me",
  protect,
  authorizeRoles("professional"),
  updateMyProfessionalProfile
);

router.get(
  "/me/earnings",
  protect,
  authorizeRoles("professional"),
  getMyEarningsOverview
);

router.get("/search", searchProfessionals);

export default router;

