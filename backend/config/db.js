import mongoose from "mongoose";

export const connectDB = async () => {
  try {
      await mongoose.connect(
      "mongodb+srv://abisri2209_db_user:Abi12345@cluster0.ojcawgz.mongodb.net/fintrackpro?retryWrites=true&w=majority&appName=Cluster0"
    );

    console.log("✅ DB CONNECTED");
  } catch (error) {
    console.error("❌ DB CONNECTION ERROR:", error.message);
  }
};