import express from 'express';
import { getDashBoardOverview } from '../controllers/dashboardController.js';
import authMiddleware from '../middleware/auth.js';

//Creates separate router for dashboard
const dashboardRouter = express.Router();

// Add this test route FIRST (before auth middleware)
dashboardRouter.get("/test", (req, res) => {
    console.log("✅ Test route hit!");
    res.json({ message: "Test route working" });
});

// Your original route
dashboardRouter.get("/", authMiddleware, getDashBoardOverview);

// Log when router is initialized
console.log("📦 Dashboard router initialized");

export default dashboardRouter;