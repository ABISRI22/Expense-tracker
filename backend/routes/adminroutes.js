import express from "express";
import User from "../models/userModel.js";
import Expense from "../models/expenseModel.js";
import Income from "../models/incomeModel.js";

const adminRoutes = express.Router();

// USERS
adminRoutes.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// EXPENSES WITH USER DETAILS
adminRoutes.get("/expenses", async (req, res) => {
  try {
    const expenses = await Expense.find().populate("userId", "name email");
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// INCOME WITH USER DETAILS
adminRoutes.get("/income", async (req, res) => {
  try {
    const income = await Income.find().populate("userId", "name email");
    res.json(income);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ADD THIS NEW ROUTE
adminRoutes.get("/fix-income", async (req, res) => {
  try {
    const validUserId = "69bf0e3b6cd77aa026a1edba5";
    
    const result = await Income.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: validUserId } }
    );
    
    res.json({
      message: "Income records fixed!",
      recordsUpdated: result.modifiedCount
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

export default adminRoutes;