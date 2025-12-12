import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/userSchema.js";

const MONGO_URI = ""

async function createAdmin() {
  try {
    // Connect to DB
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const adminEmail = "bitinyoeugen@gmail.com";
    const password = "8562Eu@"; 

    // Check if admin exists
    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      console.log("Admin user already exists!");
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const adminUser = await User.create({
      name: "System Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      status: "active",
    });

    console.log("Admin created successfully:");
    console.log(adminUser);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
