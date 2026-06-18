import { z } from "zod";
import { randomUUID } from "crypto";

import { runAiAgent } from "../services/aiAgentService.js";
import { bookServiceFromChat } from "../services/aiServiceBookingService.js";

const aiAgentRequestSchema = z.object({
  message: z.string().trim().min(3).max(2000),
  conversationId: z.string().trim().max(120).optional(),
});

const serviceBookingRequestSchema = z.object({
  message: z.string().trim().min(3).max(2000),
  conversationId: z.string().trim().max(120).optional(),
});

/**
 * Handles natural language AI workflow requests from the website.
 * The controller validates input before calling LangChain.
 * It returns a stable JSON shape for the React chat UI.
 * Runtime errors are logged and converted to safe API messages.
 */
export const handleAiAgentRequest = async (req, res) => {
  const parsedBody = aiAgentRequestSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      message: "Please send a valid message between 3 and 2000 characters.",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await runAiAgent({
      message: parsedBody.data.message,
      conversationId: parsedBody.data.conversationId,
      user: req.user,
    });

    return res.json({
      ok: true,
      conversationId: parsedBody.data.conversationId || randomUUID(),
      result,
    });
  } catch (error) {
    console.error("AI agent request failed", error);

    return res.status(500).json({
      ok: false,
      message:
        "The AI workflow agent is unavailable right now. Please try again shortly.",
    });
  }
};

/**
 * Runs the direct Gemini service-booking workflow.
 * This deterministic path creates real booking records now, while the separate
 * LangChain/n8n route stays available for future orchestration and agents.
 */
export const handleAiServiceBookingRequest = async (req, res) => {
  const parsedBody = serviceBookingRequestSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      message: "Please send a valid booking message between 3 and 2000 characters.",
      issues: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const conversationId = parsedBody.data.conversationId || randomUUID();
    const result = await bookServiceFromChat({
      message: parsedBody.data.message,
      conversationId,
      user: req.user,
    });

    return res.status(result.status === "success" ? 201 : 200).json({
      ok: result.status === "success",
      conversationId,
      result,
    });
  } catch (error) {
    console.error("AI service booking request failed", error);

    return res.status(500).json({
      ok: false,
      message:
        "The AI booking workflow is unavailable right now. Please try again shortly.",
    });
  }
};
