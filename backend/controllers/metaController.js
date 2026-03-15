import { Category } from "../models/Category.js";
import { Testimonial } from "../models/Testimonial.js";
import { Professional } from "../models/Professional.js";

export const getLandingMeta = async (req, res) => {
  // Ensure some basic categories & testimonials exist (simple seeding)
  const existingCategories = await Category.countDocuments();
  if (existingCategories === 0) {
    await Category.insertMany([
      {
        key: "plumbing",
        name: "Plumbing",
        description: "Fix leaks, install taps, unblock drains.",
        icon: "pipe",
      },
      {
        key: "electrician",
        name: "Electrician",
        description: "Safe wiring, fixtures and repairs.",
        icon: "bolt",
      },
      {
        key: "cleaning",
        name: "Cleaning",
        description: "Home, deep and move-out cleaning.",
        icon: "broom",
      },
      {
        key: "painting",
        name: "Painting",
        description: "Interior and exterior painting services.",
        icon: "paint",
      },
    ]);
  }

  const existingTestimonials = await Testimonial.countDocuments();
  if (existingTestimonials === 0) {
    await Testimonial.insertMany([
      {
        name: "Amelia, Leicester",
        role: "Household",
        quote: "Quick to book and the plumber was on time and professional.",
      },
      {
        name: "Raj, Birmingham",
        role: "Household",
        quote: "Felt reassured using verified professionals through DomusVesta.",
      },
      {
        name: "Hannah, London",
        role: "Household",
        quote: "Great for recurring cleaning with the same trusted professional.",
      },
    ]);
  }

  const [categories, testimonials, featuredProfessionals] = await Promise.all([
    Category.find().sort({ name: 1 }),
    Testimonial.find().sort({ createdAt: -1 }).limit(6),
    Professional.find({ verificationStatus: "approved" })
      .sort({ averageRating: -1, jobsCompleted: -1 })
      .limit(6)
      .populate("userId", "name location"),
  ]);

  res.json({
    categories,
    testimonials,
    featuredProfessionals,
  });
};

