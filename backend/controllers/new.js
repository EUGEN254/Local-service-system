


// scripts/deleteAllBookings.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import Booking model (adjust path as needed)
import Booking from '../models/bookingSchema.js'; // Adjust path to your bookingSchema
import messages from '../models/messages.js';
import plumbingServiceSchema from '../models/plumbingServiceSchema.js';
import Category from '../models/categorySchema.js';
import Notification from '../models/notificationSchema.js';
import SupportTicket from '../models/supportTicketSchema.js';
import mpesaTransactionsSchema from '../models/mpesaTransactionsSchema.js';

const deleteAllBookings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('');
    console.log('Connected to MongoDB');

    // Confirm before deletion (safety measure)
    const bookingCount = await  messages.countDocuments();
    console.log(`📊 Found ${bookingCount} bookings in the database`);
    
    if (bookingCount === 0) {
      console.log('✅ No bookings found to delete.');
      await mongoose.disconnect();
      return;
    }

    // Optional: Add confirmation prompt for safety
    console.log('🚨 WARNING: This will permanently delete ALL bookings!');
    console.log('Type "DELETE ALL" to confirm:');
    
    // For a more interactive version, you could use readline
    // For now, we'll proceed with deletion - uncomment the confirmation if needed
    
    // Uncomment below for interactive confirmation:
    /*
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmation = await new Promise(resolve => {
      readline.question('Type "DELETE ALL" to confirm: ', resolve);
    });
    
    if (confirmation !== 'DELETE ALL') {
      console.log('❌ Deletion cancelled.');
      readline.close();
      await mongoose.disconnect();
      return;
    }
    readline.close();
    */

    // Delete all bookings
    const result = await  messages.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} bookings!`);

  } catch (error) {
    console.error('❌ Error deleting bookings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
deleteAllBookings();








// // scripts/createAdmin.js
// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';
// import dotenv from 'dotenv';

// // Load environment variables
// dotenv.config();

// // Import User model (adjust path as needed)
// import User from '../models/userSchema.js'; // Adjust path to your userSchema

// const createAdminUser = async () => {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect('');
//     console.log('Connected to MongoDB');

//     // Check if admin already exists
//     const existingAdmin = await User.findOne({ email: 'bitinyoeuge@gmail.com' });
//     if (existingAdmin) {
//       console.log('Admin user already exists:', existingAdmin.email);
//       await mongoose.disconnect();
//       return;
//     }

//     // Create admin user
//     const hashedPassword = await bcrypt.hash('123', 10); // Change this password!
    
//     const adminUser = new User({
//       name: 'Eugen Bitinyo',
//       email: 'bitinyoeugen@gmail.com', 
//       password: hashedPassword,
//       role: 'admin',
//       phone: '+254115418682', // Change this!
//       bio: 'System Administrator Account'
//     });

//     await adminUser.save();
//     console.log('✅ Admin user created successfully!');
//     console.log('Email: bitinyoeuge@gmail.com'); // Change this!
//     console.log('Password: 123'); // Change this!
//     console.log('⚠️  IMPORTANT: Change the email and password immediately!');

//   } catch (error) {
//     console.error('❌ Error creating admin user:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('Disconnected from MongoDB');
//   }
// };

// // Run the script
// createAdminUser();
