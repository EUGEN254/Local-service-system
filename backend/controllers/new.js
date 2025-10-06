// import mongoose from "mongoose";
// import Booking from "../models/bookingSchema.js";

// const updateStatuses = async () => {
//   try {
//     // Hardcode the connection string for testing
//     const connectionString = "mongodb+srv://bitinyo:12345@cluster0.c6vd6s9.mongodb.net/mern-auth";
    
//     console.log("Connecting with:", connectionString);
//     // 
//     mongoose.connection.on('connected', () => console.log('🤝🤝 Bravo database connected'));
    
//     await mongoose.connect(connectionString, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     console.log("Connected to MongoDB successfully!");

//     // Your update operation
//     const result = await Booking.updateMany(
//       {},
//       [
//         { 
//           $set: { 
//             status: { 
//               $cond: {
//                 if: "$is_paid",
//                 then: "Waiting for Work",
//                 else: "Pending"
//               }
//             } 
//           } 
//         }
//       ]
//     );

//     console.log(`Updated ${result.modifiedCount} bookings successfully!`);
    
//   } catch (error) {
//     console.error("Error:", error.message);
//   } finally {
//     await mongoose.disconnect();
//     console.log("Disconnected from MongoDB");
//   }
// };

// updateStatuses();


