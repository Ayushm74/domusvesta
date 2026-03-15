import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

/*
This function generates a JWT token for the logged-in user.
The token contains the user ID and role and expires in 7 days.
*/
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/*
REGISTER USER
Creates a new user account.
Supports two roles:
- client (Household)
- professional
*/
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      location,
      phone,
      profilePhoto,
    } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({
        message: "Email already in use",
      });
    }

    // Validate role
    const allowedRoles = ["client", "professional"];

    const userRole = allowedRoles.includes(role)
      ? role
      : "client"; // default Household

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      location,
      phone,
      profilePhoto,
    });

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Send response
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

/*
LOGIN USER
Checks email + password and returns JWT token.
*/
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    // Check password
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Send response
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        accountStatus: user.accountStatus,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      phone: user.phone,
      profilePhoto: user.profilePhoto,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};