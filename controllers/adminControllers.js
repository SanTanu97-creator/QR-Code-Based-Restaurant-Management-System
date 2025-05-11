import adminModel from "../model/adminModel.js";
import transporter from "../config/nodeMailer.js";
import { comparePassword, hashPassword } from "../utils/hashPassword.js";
import { generateToken } from "../utils/generateToken.js";
import { passwordReset, welcomeMail } from "../utils/sendMails.js";
import winston from 'winston'; // For better logging

// Configure logging (Winston)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'adminController.log' }),
  ],
});

// Register Admin
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Missing details" });
  }

  try {
    const existingAdmin = await adminModel.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already registered. Only one admin allowed!",
      });
    }

    const existingEmail = await adminModel.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use!",
      });
    }

    const hashedPassword = await hashPassword(password);

    const newAdmin = await adminModel.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    const token = generateToken(newAdmin._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const mail = welcomeMail(name, email);
    await transporter.sendMail(mail);

    logger.info(`Admin registered successfully: ${email}`);

    return res.status(201).json({ success: true, message: "Registered successfully!" });
  } catch (error) {
    logger.error(`Error during registration: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Login Admin
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Missing details" });
  }

  try {
    const user = await adminModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const passMatch = await comparePassword(password, user.password);
    if (!passMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info(`Admin logged in successfully: ${email}`);

    return res.json({ success: true, message: "Logged in successfully" });
  } catch (error) {
    logger.error(`Error during login: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Logout Admin
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      expires: new Date(0),
    });

    logger.info("Admin logged out successfully");

    return res.status(200).json({ success: true, message: "Logged out successfully!" });
  } catch (error) {
    logger.error(`Error during logout: ${error.message}`);
    return res.status(500).json({ success: false, message: "Something went wrong during logout." });
  }
};

// Send OTP for Password Reset
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required!" });
  }

  try {
    const user = await adminModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this email!" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expireAt = Date.now() + 15 * 60 * 1000;

    await adminModel.findByIdAndUpdate(user._id, {
      resetOtp: otp,
      resetOtpExpireAt: expireAt,
    });

    const passwordResetMail = passwordReset(email, otp);
    await transporter.sendMail(passwordResetMail);

    logger.info(`OTP sent successfully to ${email}`);

    return res.status(200).json({ success: true, message: "OTP sent to your email!" });
  } catch (error) {
    logger.error(`Error while sending OTP: ${error.message}`);
    return res.status(500).json({ success: false, message: "Something went wrong while sending OTP." });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: "Missing details" });
  }

  try {
    const user = await adminModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this email!" });
    }

    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (!user.resetOtpExpireAt || user.resetOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const hashedPassword = await hashPassword(newPassword);

    await adminModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetOtp: "",
      resetOtpExpireAt: 0,
    });

    logger.info(`Password reset successfully for: ${email}`);

    return res.status(200).json({ success: true, message: "Password reset successfully!" });
  } catch (error) {
    logger.error(`Error during password reset: ${error.message}`);
    return res.status(500).json({ success: false, message: "Something went wrong while resetting the password." });
  }
};
