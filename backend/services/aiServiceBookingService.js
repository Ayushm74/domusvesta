import { AiServiceBooking } from "../models/AiServiceBooking.js";
import { Job } from "../models/Job.js";
import {
  extractBookingIntentWithLangChain,
  generateQuotationWithLangChain,
} from "./aiBookingLangChainService.js";
import { rankServiceProviders } from "./providerRankingService.js";

function buildScheduleLabel(intent) {
  const date = intent.preferredDate
    ? new Date(intent.preferredDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "To be confirmed";

  return intent.preferredTimeSlot ? `${date}, ${intent.preferredTimeSlot}` : date;
}

function calculatePricing(serviceCharge) {
  const normalizedCharge = Math.max(0, Math.round(Number(serviceCharge || 0)));
  const platformFee = Math.max(100, Math.round(normalizedCharge * 0.08));
  const tax = Math.round((normalizedCharge + platformFee) * 0.05);

  return {
    serviceCharge: normalizedCharge,
    platformFee,
    tax,
    total: normalizedCharge + platformFee + tax,
    currency: "INR",
  };
}

function providerSnapshot(provider) {
  return {
    id: provider._id.toString(),
    name: provider.userId?.name || "Verified Professional",
    email: provider.userId?.email || null,
    phone: provider.userId?.phone || null,
    location: provider.location || provider.userId?.location || null,
    serviceAreas: provider.serviceAreas || [],
    serviceCategories: provider.serviceCategories || [],
    skills: provider.skills || [],
    averageRating: provider.averageRating || 0,
    totalReviews: provider.totalReviews || 0,
    minRate: provider.minRate || null,
    maxRate: provider.maxRate || null,
  };
}

function rankedProviderSnapshot(entry) {
  return {
    providerId: entry.provider._id.toString(),
    providerName: entry.provider.userId?.name || "Verified Professional",
    score: entry.score,
    estimatedCost: entry.estimatedCost,
    reasons: entry.reasons,
  };
}

function validateIntent(intent) {
  const missingFields = new Set(intent.missingFields || []);

  if (!intent.serviceCategory) missingFields.add("serviceType");
  if (!intent.location) missingFields.add("location");
  if (!intent.preferredDate) missingFields.add("preferredDate");

  return Array.from(missingFields);
}

export async function bookServiceFromChat({ message, conversationId, user }) {
  const { intent, error: extractionError } = await extractBookingIntentWithLangChain({
    message,
    user,
  });

  const missingFields = validateIntent(intent);

  if (missingFields.length > 0) {
    return {
      workflow: "booking",
      status: "needs_more_info",
      message: `Please share ${missingFields.join(", ")} so I can book the best provider.`,
      data: { extractedIntent: intent, missingFields, extractionError },
      nextAction: "Send the missing booking details in one message.",
    };
  }

  const rankedProviders = await rankServiceProviders(intent, { limit: 5 });
  const bestMatch = rankedProviders[0];

  if (!bestMatch) {
    return {
      workflow: "booking",
      status: "failed",
      message:
        "I could not find an available verified provider for this service and location.",
      data: { extractedIntent: intent, rankedProviders: [], extractionError },
      nextAction: "Try a nearby location, broader time window, or different budget.",
    };
  }

  const selectedProvider = bestMatch.provider;
  const selectedProviderSnapshot = providerSnapshot(selectedProvider);
  const pricing = calculatePricing(bestMatch.estimatedCost);
  const scheduleLabel = buildScheduleLabel(intent);

  const { quotation, error: quotationError } = await generateQuotationWithLangChain({
    intent,
    provider: selectedProviderSnapshot,
    pricing,
    scheduleLabel,
  });

  // The job remains the operational booking record used by the rest of the app.
  const job = await Job.create({
    title: intent.serviceType,
    description: [
      message,
      ...(intent.specialRequirements || []).map((requirement) => `Requirement: ${requirement}`),
    ].join("\n"),
    serviceCategory: intent.serviceCategory,
    urgencyLevel: intent.urgency,
    preferredDate: intent.preferredDate ? new Date(intent.preferredDate) : undefined,
    preferredTimeSlot: intent.preferredTimeSlot || undefined,
    location: intent.location,
    budgetMin: intent.budget?.min || undefined,
    budgetMax: intent.budget?.max || undefined,
    status: "booked",
    createdBy: user._id,
    assignedProfessional: selectedProvider._id,
    statusHistory: [{ status: "booked", changedBy: user._id }],
  });

  // This trace model keeps AI inputs, ranking, and quotation auditable for later agents.
  const aiBooking = await AiServiceBooking.create({
    userId: user._id,
    jobId: job._id,
    conversationId,
    userMessage: message,
    extractedIntent: intent,
    selectedProvider: selectedProvider._id,
    providerSnapshot: selectedProviderSnapshot,
    rankedProviders: rankedProviders.map(rankedProviderSnapshot),
    quotation,
    pricing,
    bookingStatus: "booked",
    orchestration: {
      engine: "langchain-gemini",
      handoffReady: true,
      agentTraceId: conversationId,
    },
  });

  return {
    workflow: "booking",
    status: "success",
    message: `Best Service Provider Found\n\nProvider: ${selectedProviderSnapshot.name}\nService: ${intent.serviceType}\nPrice: Rs. ${pricing.serviceCharge}\nRating: ${selectedProviderSnapshot.averageRating}\n\nQUOTATION:\nService Charge: Rs. ${pricing.serviceCharge}\nPlatform Fee: Rs. ${pricing.platformFee}\nTax: Rs. ${pricing.tax}\n\nTotal: Rs. ${pricing.total}\n\nYour service has been booked successfully.`,
    data: {
      bookingId: aiBooking._id.toString(),
      jobId: job._id.toString(),
      extractedIntent: intent,
      extractionError,
      selectedProvider: selectedProviderSnapshot,
      ranking: rankedProviders.map(rankedProviderSnapshot),
      quotation,
      quotationError,
      pricing,
      bookingStatus: "booked",
      schedule: scheduleLabel,
    },
    nextAction: "Track this booking from your client bookings page.",
  };
}
