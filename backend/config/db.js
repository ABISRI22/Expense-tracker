import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://abisri2209_db_user:ebMxRTyIKqyhvau5@cluster0.ojcawgz.mongodb.net/Expense");
    console.log("✅ DB CONNECTED");
  } catch (error) {
    console.error("❌ DB CONNECTION ERROR:", error.message);
  }
};