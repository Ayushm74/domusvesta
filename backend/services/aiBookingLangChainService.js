import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";

import {
  extractServiceBookingIntentFallback,
  generateServiceQuotationFallback,
  invokeGeminiJson,
} from "../utils/geminiService.js";

function normalizeIntent(parsed, user) {
  return {
    serviceType: parsed.serviceType || parsed.serviceCategory || "Home Service",
    serviceCategory: String(parsed.serviceCategory || parsed.serviceType || "")
      .trim()
      .toLowerCase(),
    budget: {
      min: Number.isFinite(Number(parsed?.budget?.min)) ? Number(parsed.budget.min) : null,
      max: Number.isFinite(Number(parsed?.budget?.max)) ? Number(parsed.budget.max) : null,
      currency: parsed?.budget?.currency || "INR",
    },
    preferredDate: parsed.preferredDate || null,
    preferredTimeSlot: parsed.preferredTimeSlot || null,
    location: parsed.location || user?.location || null,
    urgency: ["flexible", "soon", "urgent"].includes(parsed.urgency)
      ? parsed.urgency
      : "soon",
    specialRequirements: Array.isArray(parsed.specialRequirements)
      ? parsed.specialRequirements
      : [],
    confidence: Number(parsed.confidence || 0),
    missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
    extractionSource: "langchain-gemini",
  };
}

const intentPrompt = RunnableLambda.from(({ message, user }) => {
  const now = new Date().toISOString();

  return `
You are the LangChain intent extraction step for DomusVesta, a home service marketplace.
Extract structured service-booking intent from the user's natural language message.

Current timestamp: ${now}
Known user profile:
${JSON.stringify({
  name: user?.name || null,
  location: user?.location || null,
  phone: user?.phone || null,
})}

Return strict JSON only with this exact shape:
{
  "serviceType": "human readable service name",
  "serviceCategory": "lowercase category key such as ac repair, plumbing, cleaning, electrical",
  "budget": { "min": number|null, "max": number|null, "currency": "INR" },
  "preferredDate": "ISO date string or null",
  "preferredTimeSlot": "short time window or null",
  "location": "service location or null",
  "urgency": "flexible|soon|urgent",
  "specialRequirements": ["short requirement"],
  "confidence": number,
  "missingFields": ["serviceType", "location", "preferredDate"]
}

Rules:
- Use INR for rupees.
- Infer relative dates like tomorrow from Current timestamp.
- If location is omitted, use known user profile location when available.
- Keep serviceCategory broad enough to match provider skills and serviceCategories.

User message:
${message}
`;
});

const geminiJsonStep = RunnableLambda.from((prompt) => invokeGeminiJson(prompt));

const normalizeIntentStep = RunnableLambda.from(({ parsed, user }) =>
  normalizeIntent(parsed, user)
);

const quotationPrompt = RunnableLambda.from(({ intent, provider, pricing, scheduleLabel }) => `
You are the LangChain quotation generation step for DomusVesta.
Create a professional service booking quotation from the selected real MongoDB provider.

Return strict JSON only with:
{
  "title": "QUOTATION",
  "summary": "short customer-facing sentence",
  "providerName": string,
  "serviceName": string,
  "estimatedCost": number,
  "platformFee": number,
  "tax": number,
  "totalAmount": number,
  "bookingSchedule": string,
  "providerContact": { "phone": string|null, "email": string|null, "location": string|null },
  "lineItems": [{ "label": string, "amount": number }],
  "terms": ["short terms"]
}

Booking intent:
${JSON.stringify(intent)}

Selected provider:
${JSON.stringify(provider)}

Pricing:
${JSON.stringify(pricing)}

Schedule label:
${scheduleLabel}
`);

const intentChain = RunnableSequence.from([
  RunnableLambda.from((input) => input),
  RunnableLambda.from(async ({ message, user }) => {
    const parsed = await RunnableSequence.from([intentPrompt, geminiJsonStep]).invoke({
      message,
      user,
    });

    return { parsed, user };
  }),
  normalizeIntentStep,
]);

const quotationChain = RunnableSequence.from([quotationPrompt, geminiJsonStep]);

export async function extractBookingIntentWithLangChain({ message, user }) {
  try {
    return {
      intent: await intentChain.invoke({ message, user }),
      error: null,
    };
  } catch (error) {
    return {
      intent: extractServiceBookingIntentFallback({ message, user }),
      error: {
        code: error.code || "LANGCHAIN_GEMINI_INTENT_FAILED",
        message: error.message,
      },
    };
  }
}

export async function generateQuotationWithLangChain({
  intent,
  provider,
  pricing,
  scheduleLabel,
}) {
  try {
    return {
      quotation: await quotationChain.invoke({
        intent,
        provider,
        pricing,
        scheduleLabel,
      }),
      error: null,
    };
  } catch (error) {
    return {
      quotation: generateServiceQuotationFallback({
        intent,
        provider,
        pricing,
        scheduleLabel,
      }),
      error: {
        code: error.code || "LANGCHAIN_GEMINI_QUOTATION_FAILED",
        message: error.message,
      },
    };
  }
}
