import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

export const connectDB = async () => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGO_DATABASE_URL,
      {
        dbName: "students-crud", // Replace with your DB name if needed
      }
    );

    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
    console.log("Database Name:", connection.connection.name);
    console.log("______________________________");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed :- ", error.message);
    process.exit(1); // Exit process with failure
  }
};
