const GEMINI_API_VERSION = "v1beta";

export class GeminiWorkflowError extends Error {
  constructor(message, code = "GEMINI_WORKFLOW_ERROR") {
    super(message);
    this.name = "GeminiWorkflowError";
    this.code = code;
  }
}

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiWorkflowError(
      "GEMINI_API_KEY is required for AI service booking",
      "GEMINI_API_KEY_MISSING"
    );
  }

  return {
    apiKey,
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  };
}

function extractJson(text) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new GeminiWorkflowError("Gemini did not return JSON", "GEMINI_JSON_MISSING");
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    throw new GeminiWorkflowError("Gemini returned invalid JSON", "GEMINI_JSON_INVALID");
  }
}

async function generateGeminiContent(prompt) {
  const { apiKey, model } = getGeminiConfig();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new GeminiWorkflowError(
      body?.error?.message || "Gemini request failed",
      "GEMINI_REQUEST_FAILED"
    );
  }

  const text = body?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("");

  if (!text) {
    throw new GeminiWorkflowError("Gemini returned an empty response", "GEMINI_EMPTY_RESPONSE");
  }

  return text;
}

export async function invokeGeminiJson(prompt) {
  return extractJson(await generateGeminiContent(prompt));
}

export async function extractServiceBookingIntent({ message, user }) {
  const now = new Date().toISOString();
  const prompt = `
You are the intent parser for DomusVesta, a home service marketplace in India.
Extract booking intent from the user's natural language message.

Current timestamp: ${now}
Known user profile:
${JSON.stringify({
  name: user?.name || null,
  location: user?.location || null,
  phone: user?.phone || null,
})}

Return strict JSON only with this shape:
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
- If the user omits location, use the known user profile location when available.
- Keep serviceCategory broad enough to match provider skills and serviceCategories.

User message:
${message}
`;

  const parsed = await invokeGeminiJson(prompt);

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
  };
}

export function extractServiceBookingIntentFallback({ message, user }) {
  const text = String(message || "");
  const lowerText = text.toLowerCase();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const serviceRules = [
    {
      test: /\bac\b|air conditioner|air conditioning/i,
      serviceType: "AC Repair",
      serviceCategory: "ac repair",
    },
    {
      test: /plumb|pipe|tap|sink|leak/i,
      serviceType: "Plumbing",
      serviceCategory: "plumbing",
    },
    {
      test: /clean|housekeeping|maid/i,
      serviceType: "Home Cleaning",
      serviceCategory: "cleaning",
    },
    {
      test: /electric|wiring|switch|fan|light/i,
      serviceType: "Electrical Repair",
      serviceCategory: "electrical",
    },
  ];
  const serviceMatch = serviceRules.find((rule) => rule.test.test(text));
  const budgetMatch = lowerText.match(
    /(?:under|below|less than|budget)\s*(?:rs\.?|inr)?\s*(\d+)/i
  );
  const locationMatch = text.match(
    /\bin\s+([A-Za-z][A-Za-z\s-]{1,40})(?:\.|,| under| below| tomorrow| today| this|$)/i
  );

  let preferredDate = null;
  if (/tomorrow/i.test(text)) {
    preferredDate = tomorrow.toISOString();
  } else if (/today|this evening|tonight/i.test(text)) {
    preferredDate = new Date().toISOString();
  }

  return {
    serviceType: serviceMatch?.serviceType || "Home Service",
    serviceCategory:
      serviceMatch?.serviceCategory || lowerText.split(/\s+/).slice(0, 2).join(" "),
    budget: {
      min: null,
      max: budgetMatch ? Number(budgetMatch[1]) : null,
      currency: "INR",
    },
    preferredDate,
    preferredTimeSlot: /morning/i.test(text)
      ? "morning"
      : /evening|tonight/i.test(text)
        ? "evening"
        : /afternoon/i.test(text)
          ? "afternoon"
          : null,
    location: locationMatch?.[1]?.trim() || user?.location || null,
    urgency: /urgent|asap|emergency/i.test(text) ? "urgent" : "soon",
    specialRequirements: [],
    confidence: serviceMatch ? 0.62 : 0.35,
    missingFields: [],
    extractionSource: "fallback",
  };
}

export async function generateServiceQuotation({
  intent,
  provider,
  pricing,
  scheduleLabel,
}) {
  const prompt = `
Create a professional service booking quotation for DomusVesta.
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
`;

  return invokeGeminiJson(prompt);
}

export function generateServiceQuotationFallback({
  intent,
  provider,
  pricing,
  scheduleLabel,
}) {
  return {
    title: "QUOTATION",
    summary: `${provider.name} is available for ${intent.serviceType}.`,
    providerName: provider.name,
    serviceName: intent.serviceType,
    estimatedCost: pricing.serviceCharge,
    platformFee: pricing.platformFee,
    tax: pricing.tax,
    totalAmount: pricing.total,
    bookingSchedule: scheduleLabel,
    providerContact: {
      phone: provider.phone,
      email: provider.email,
      location: provider.location,
    },
    lineItems: [
      { label: "Service Charge", amount: pricing.serviceCharge },
      { label: "Platform Fee", amount: pricing.platformFee },
      { label: "Tax", amount: pricing.tax },
    ],
    terms: [
      "Final cost may change if the provider finds additional work on inspection.",
      "The provider will contact you before arriving.",
    ],
    generatedBy: "fallback",
  };
}
