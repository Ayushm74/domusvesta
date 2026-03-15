import { User } from "../models/User.js";

export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, location } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = String(name).trim();
    if (email !== undefined) {
      const trimmed = String(email).trim().toLowerCase();
      const existing = await User.findOne({ email: trimmed, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updates.email = trimmed;
    }
    if (phone !== undefined) updates.phone = String(phone).trim() || undefined;
    if (location !== undefined) updates.location = String(location).trim() || undefined;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select("-password");

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      phone: user.phone,
      profilePhoto: user.profilePhoto,
      accountStatus: user.accountStatus,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const match = await user.matchPassword(currentPassword);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
