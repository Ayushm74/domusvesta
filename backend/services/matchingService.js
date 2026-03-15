import { Professional } from "../models/Professional.js";

// Matching based on serviceCategory, location and rating
export const findMatchingProfessionals = async ({
  serviceCategory,
  location,
  limit = 5,
}) => {
  const categoryFilter = serviceCategory
    ? {
        $or: [
          { serviceCategories: { $in: [serviceCategory] } },
          { skills: { $in: [serviceCategory.toLowerCase()] } },
        ],
      }
    : {};

  const query = {
    ...categoryFilter,
    verificationStatus: "approved",
    availability: true,
  };

  if (location) {
    query.serviceAreas = { $in: [location] };
  }

  const professionals = await Professional.find(query)
    .sort({ averageRating: -1, jobsCompleted: -1 })
    .limit(limit)
    .populate("userId", "name location");

  return professionals;
};

