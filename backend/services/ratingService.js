import { Review } from "../models/Review.js";
import { Professional } from "../models/Professional.js";

export const recalculateProfessionalRating = async (professionalId) => {
  const agg = await Review.aggregate([
    { $match: { professionalId } },
    {
      $group: {
        _id: "$professionalId",
        avgOverall: { $avg: "$overallRating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = agg[0];
  if (!stats) {
    await Professional.findByIdAndUpdate(professionalId, {
      averageRating: 0,
      totalReviews: 0,
    });
    return;
  }

  await Professional.findByIdAndUpdate(professionalId, {
    averageRating: stats.avgOverall,
    totalReviews: stats.count,
  });
};

