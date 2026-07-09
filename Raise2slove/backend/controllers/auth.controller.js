import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * REGISTER
 */
export const register = async (req, res) => {
  const { name, email, password, role, companyName, phone, servicesProvided, location } =
    req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    if (user.role === "vendor") {
      if (!companyName || !phone || !servicesProvided || !location) {
        // Rollback user creation
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: "Please provide all vendor details" });
      }
      // Ensure servicesProvided is an array and transform it for the Vendor model
      if (!Array.isArray(servicesProvided) || servicesProvided.length === 0) {
        // Rollback user creation
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: "Please select at least one service." });
      }

      const servicesToSave = servicesProvided.map(service => {
        // If service is just an ID (legacy/simple check), use defaults
        if (typeof service === 'string') {
          return {
            serviceId: service,
            minPrice: 0,
            maxPrice: 0,
            isActive: true
          };
        }
        // If service is an object with details
        return {
          serviceId: service.serviceId,
          minPrice: Number(service.minPrice) || 0,
          maxPrice: Number(service.maxPrice) || 0,
          isActive: true
        };
      });

      await Vendor.create({
        user: user._id,
        companyName,
        phone,
        servicesProvided: servicesToSave,
        location,
      });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * LOGIN
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt for email: ${email}`); // DEBUG

  try {
    const user = await User.findOne({ email });
    console.log("User found in database:", user); // DEBUG

    if (user && (await user.matchPassword(password))) {
      console.log("Password matched. Sending token."); // DEBUG
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      console.log("Invalid email or password."); // DEBUG
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Error during login:", error); // DEBUG
    res.status(500).json({ message: error.message });
  }
};


export const getMe = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select("-password");
    if (user.role === "vendor") {
      const vendor = await Vendor.findOne({ user: req.user.id });
      user = { ...user.toObject(), vendor };
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
