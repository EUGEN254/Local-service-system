// scripts/createAdmin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import User model (adjust path as needed)
import User from '../models/userSchema.js'; // Adjust path to your userSchema

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'bitinyoeuge@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('123', 10); // Change this password!
    
    const adminUser = new User({
      name: 'System Administrator',
      email: 'bitinyoeuge@gmail.com', 
      password: hashedPassword,
      role: 'admin',
      phone: '+254115418682', // Change this!
      bio: 'System Administrator Account'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@example.com'); // Change this!
    console.log('Password: admin123'); // Change this!
    console.log('⚠️  IMPORTANT: Change the email and password immediately!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createAdminUser();