import mongoose from "mongoose";

const connectDb = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("🤝🤝 Bravo database connected")
    );
    await mongoose.connect(`${process.env.MONGODB_URI}/mern-auth`);
  } catch (error) {
    console.error(error);
  }
};

export default connectDb;
