import express from "express";
import rateLimit from "express-rate-limit";

import {
  handleAiAgentRequest,
  handleAiServiceBookingRequest,
} from "../controllers/aiAgentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

const aiAgentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many AI requests. Please wait a few minutes and try again.",
  },
});

router.post("/", aiAgentLimiter, handleAiAgentRequest);
router.post(
  "/service-booking",
  aiAgentLimiter,
  protect,
  authorizeRoles("client"),
  handleAiServiceBookingRequest
);

export default router;
