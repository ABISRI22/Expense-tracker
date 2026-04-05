import express from 'express';
import { getCurrentUser,loginUser, registerUser, UpdatePassword, updateProfile } from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';


const userRouter = express.Router();

userRouter.post("/register",registerUser);
userRouter.post("/login",loginUser);

//protected Routes
userRouter.get("/me",authMiddleware,getCurrentUser);
userRouter.put("/profile",authMiddleware,updateProfile);
userRouter.put("/password",authMiddleware,UpdatePassword);

export default userRouter;