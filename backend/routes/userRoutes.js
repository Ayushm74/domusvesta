import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { updateProfile, updatePassword } from "../controllers/userController.js";

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.put("/password", protect, updatePassword);

export default router;
