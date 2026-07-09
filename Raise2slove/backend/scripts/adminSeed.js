import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";

const createAdmin = async () => {
  try {
    // connectDB will now handle dotenv, logging, and exit on failure
    await connectDB();

    const adminEmail = "admin@example.com";

    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log(`Admin user already exists with email: ${adminExists.email}`);
      process.exit(0);
    }

    console.log("Creating new admin user...");
    const admin = new User({
      name: "Admin",
      email: adminEmail,
      password: "password123", // This will be hashed by the pre-save hook
      role: "admin",
    });

    await admin.save();

    console.log("Admin user created successfully!");
    console.log("Email: admin@example.com");
    console.log("Password: password123");
    console.log("Please change this password after your first login.");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  } finally {
    // Ensure the connection is closed
    mongoose.connection.close();
  }
};

createAdmin();