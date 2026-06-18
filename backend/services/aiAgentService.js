import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { z } from "zod";

import { callN8nWebhook } from "./n8nWebhookClient.js";

const MAX_AGENT_STEPS = 6;

const workflowResponseSchema = z.object({
  workflow: z.enum(["quotation", "provider_matching", "booking", "general"]),
  status: z.enum(["success", "needs_more_info", "failed"]),
  message: z.string(),
  data: z.record(z.any()).default({}),
  nextAction: z.string().nullable().default(null),
});

const getQuote = tool(
  async (input) => callN8nWebhook("getQuote", input),
  {
    name: "getQuote",
    description:
      "Generate a service quotation from service type, location, job details, urgency, date, and budget.",
    schema: z.object({
      serviceType: z.string().describe("Requested service, such as plumbing or cleaning."),
      location: z.string().describe("Customer service location."),
      description: z.string().describe("Natural language job details from the customer."),
      urgency: z.string().optional().describe("Urgency level, such as flexible, soon, or emergency."),
      preferredDate: z.string().optional().describe("Preferred service date if known."),
      budget: z.string().optional().describe("Customer budget if provided."),
    }),
  }
);

const matchProvider = tool(
  async (input) => callN8nWebhook("matchProvider", input),
  {
    name: "matchProvider",
    description:
      "Find available and suitable service providers for a requested service and location.",
    schema: z.object({
      serviceType: z.string().describe("Requested service category."),
      location: z.string().describe("Customer service location."),
      preferredDate: z.string().optional().describe("Preferred appointment date."),
      preferredTimeSlot: z.string().optional().describe("Preferred time window."),
      budgetMin: z.number().optional().describe("Minimum customer budget."),
      budgetMax: z.number().optional().describe("Maximum customer budget."),
    }),
  }
);

const bookService = tool(
  async (input) => callN8nWebhook("bookService", input),
  {
    name: "bookService",
    description:
      "Book a selected provider after the user confirms service, provider, date, time, and contact details.",
    schema: z.object({
      providerId: z.string().describe("Selected provider identifier."),
      serviceType: z.string().describe("Requested service category."),
      location: z.string().describe("Customer service location."),
      scheduledDate: z.string().describe("Confirmed booking date."),
      scheduledTimeSlot: z.string().describe("Confirmed booking time slot."),
      customerName: z.string().optional().describe("Customer name."),
      customerPhone: z.string().optional().describe("Customer phone number."),
      notes: z.string().optional().describe("Extra booking notes."),
    }),
  }
);

const agentTools = [getQuote, matchProvider, bookService];
const toolsByName = Object.fromEntries(agentTools.map((agentTool) => [agentTool.name, agentTool]));

/**
 * Creates the OpenAI chat model used by the LangChain agent.
 * The API key stays in backend environment variables.
 * The model name is configurable for cheaper or stronger deployments.
 * A missing key fails fast with a clear server-side error.
 */
function createChatModel() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for the AI agent");
  }

  return new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
  });
}

/**
 * Extracts JSON from a model response that may include prose.
 * The agent is instructed to return JSON, but this protects the API.
 * It avoids leaking raw model formatting issues to the frontend.
 * Invalid JSON becomes a friendly general response object.
 */
function parseAgentJson(content) {
  const text = Array.isArray(content)
    ? content.map((part) => part.text || "").join("")
    : String(content || "");
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return {
      workflow: "general",
      status: "success",
      message: text || "I can help with quotes, provider matching, and bookings.",
      data: {},
      nextAction: null,
    };
  }

  return workflowResponseSchema.parse(JSON.parse(jsonMatch[0]));
}

/**
 * Runs the LangChain agent against the user's natural language request.
 * The model can call n8n-backed tools during a short tool-use loop.
 * The final answer is forced into a predictable JSON contract.
 * That contract keeps the frontend simple and automation-friendly.
 */
export async function runAiAgent({ message, conversationId, user }) {
  const model = createChatModel();
  const modelWithTools = model.bindTools(agentTools);
  const messages = [
    new SystemMessage(`You are DomusVesta's AI service workflow agent.
You help users get quotations, match providers, and book household services.
Use tools when a workflow action is needed. Ask for missing required booking details before booking.
Return only JSON with: workflow, status, message, data, nextAction.`),
    new HumanMessage(
      JSON.stringify({
        message,
        conversationId,
        user: user
          ? { id: user._id?.toString(), name: user.name, role: user.role }
          : null,
      })
    ),
  ];

  let finalMessage;

  for (let step = 0; step < MAX_AGENT_STEPS; step += 1) {
    const aiMessage = await modelWithTools.invoke(messages);
    messages.push(aiMessage);

    if (!aiMessage.tool_calls?.length) {
      finalMessage = aiMessage;
      break;
    }

    for (const toolCall of aiMessage.tool_calls) {
      const selectedTool = toolsByName[toolCall.name];
      const toolResult = selectedTool
        ? await selectedTool.invoke(toolCall.args)
        : { error: `Unknown tool: ${toolCall.name}` };

      messages.push(
        new ToolMessage({
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        })
      );
    }
  }

  if (!finalMessage) {
    const finalPrompt = new HumanMessage(
      "Summarize the completed workflow as strict JSON with workflow, status, message, data, nextAction."
    );
    finalMessage = await model.invoke([...messages, finalPrompt]);
  }

  return parseAgentJson(finalMessage.content);
}
