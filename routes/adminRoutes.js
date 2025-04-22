import express from "express";
import {
  login,
  loginPage,
  logout,
  register,
  registerPage,
  resetPassWord,
  sendResetOtp,
} from "../controllers/adminControllers.js";

import { authenticateUser } from "../middleware/adminAuthMiddleware.js";

const adminRouter = express.Router();

adminRouter.get("/register-page", registerPage);
adminRouter.get("/login-page", loginPage);

adminRouter.post("/register", register);
adminRouter.post("/login", login);
adminRouter.post("/logout", authenticateUser, logout);
adminRouter.post("/send-reset-otp", sendResetOtp);
adminRouter.post("/reset-password", resetPassWord);

export default adminRouter;
