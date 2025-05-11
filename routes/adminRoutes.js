import express from "express";
import {
  login,
  logout,
  register,
  resetPassword,
  sendResetOtp,
} from "../controllers/adminControllers.js";

import { authenticateUser } from "../middleware/adminAuthMiddleware.js";

const adminRouter = express.Router();


adminRouter.post("/register", register);
adminRouter.post("/login", login);
adminRouter.post("/logout", authenticateUser, logout);
adminRouter.post("/send-reset-otp", authenticateUser, sendResetOtp);
adminRouter.post("/reset-password", authenticateUser, resetPassword);

export default adminRouter;
