import { Professional } from "../models/Professional.js";
import "../models/User.js";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function includesNormalized(values, target) {
  const normalizedTarget = normalize(target);
  return (values || []).some((value) => {
    const normalizedValue = normalize(value);
    return (
      normalizedValue === normalizedTarget ||
      normalizedValue.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedValue)
    );
  });
}

function getDayKey(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][date.getDay()];
}

function hasScheduleAvailability(provider, preferredDate) {
  if (!preferredDate) return true;
  const schedule = provider.availabilitySchedule;
  if (!schedule || schedule.size === 0) return true;

  const dayKey = getDayKey(preferredDate);
  const slots = dayKey ? schedule.get(dayKey) : [];
  return Array.isArray(slots) && slots.length > 0;
}

function estimateProviderCost(provider, budgetMax) {
  const minRate = Number(provider.minRate || 0);
  const maxRate = Number(provider.maxRate || minRate || 0);

  if (maxRate > 0 && budgetMax && minRate <= budgetMax) {
    return Math.min(maxRate, budgetMax);
  }

  return minRate || maxRate || 0;
}

function calculateScore({ provider, intent, estimatedCost }) {
  const rating = Number(provider.averageRating || 0);
  const jobsCompleted = Number(provider.jobsCompleted || 0);
  const budgetMax = intent.budget?.max;

  const categoryScore =
    includesNormalized(provider.serviceCategories, intent.serviceCategory) ||
    includesNormalized(provider.skills, intent.serviceCategory)
      ? 35
      : 0;

  const budgetScore = !budgetMax
    ? 12
    : estimatedCost && estimatedCost <= budgetMax
      ? 20
      : Math.max(0, 12 - ((estimatedCost - budgetMax) / budgetMax) * 12);

  const ratingScore = Math.min(20, (rating / 5) * 20);
  const availabilityScore = provider.scheduleAvailable ? 15 : 0;
  const locationScore =
    includesNormalized(provider.serviceAreas, intent.location) ||
    normalize(provider.location).includes(normalize(intent.location))
      ? 10
      : 3;
  const experienceScore = Math.min(5, jobsCompleted / 10);

  return Math.round(
    (categoryScore + budgetScore + ratingScore + availabilityScore + locationScore + experienceScore) *
      100
  ) / 100;
}

export async function rankServiceProviders(intent, { limit = 10 } = {}) {
  const categoryRegex = new RegExp(normalize(intent.serviceCategory).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const location = normalize(intent.location);

  const query = {
    verificationStatus: "approved",
    availability: true,
    $or: [
      { serviceCategories: categoryRegex },
      { skills: categoryRegex },
      { serviceCategories: { $in: [intent.serviceCategory] } },
      { skills: { $in: [intent.serviceCategory] } },
    ],
  };

  if (location) {
    const locationRegex = new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    query.$and = [
      {
        $or: [
          { serviceAreas: locationRegex },
          { location: locationRegex },
        ],
      },
    ];
  }

  const providers = await Professional.find(query)
    .populate("userId", "name email phone location")
    .limit(50);

  const ranked = providers
    .map((provider) => {
      const scheduleAvailable = hasScheduleAvailability(provider, intent.preferredDate);
      const estimatedCost = estimateProviderCost(provider, intent.budget?.max);
      const providerWithAvailability = { ...provider.toObject(), scheduleAvailable };

      return {
        provider,
        estimatedCost,
        scheduleAvailable,
        score: calculateScore({
          provider: providerWithAvailability,
          intent,
          estimatedCost,
        }),
        reasons: {
          rating: provider.averageRating || 0,
          jobsCompleted: provider.jobsCompleted || 0,
          matchesCategory:
            includesNormalized(provider.serviceCategories, intent.serviceCategory) ||
            includesNormalized(provider.skills, intent.serviceCategory),
          matchesLocation:
            includesNormalized(provider.serviceAreas, intent.location) ||
            normalize(provider.location).includes(normalize(intent.location)),
          withinBudget: !intent.budget?.max || estimatedCost <= intent.budget.max,
          scheduleAvailable,
        },
      };
    })
    .filter((entry) => entry.scheduleAvailable)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.estimatedCost !== b.estimatedCost) return a.estimatedCost - b.estimatedCost;
      return Number(b.provider.averageRating || 0) - Number(a.provider.averageRating || 0);
    })
    .slice(0, limit);

  return ranked;
}
