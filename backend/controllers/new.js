// deleteAllMessages.js
import mongoose from "mongoose";
import messages from "../models/messages.js";


const deleteAllMessages = async () => {
  try {
    // 🔒 Replace this with your actual MongoDB URI
    const connectionString = "";

    console.log("Connecting with:", connectionString);

    mongoose.connection.on("connected", () =>
      console.log("🤝 Connected to MongoDB successfully!")
    );

    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connection established");

    // 🧩 Delete all messages
    const result = await messages.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} messages successfully!`);

  } catch (error) {
    console.error("❌ Error deleting messages:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the function
deleteAllMessages();
