import adminModel from "../model/adminModel.js";
import transporter from "../config/nodeMailer.js";
import { comparePassword, hashPassword } from "../utils/hashPassword.js";
import { generateToken } from "../utils/generateToken.js";
import { passwordRest, wellcomeMail } from "../utils/sendMails.js";

export const registerPage = (req, res)=>{
  res.render("register");
}

export const loginPage = (req, res)=>{
  res.render("login");
}

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Missing Details" });
  }

  try {
    const existingAdmin = await adminModel.findOne({ role: "admin" });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already registered. Only one admin allowed!",
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

    const mail = wellcomeMail(name, email);
    await transporter.sendMail(mail);

    console.log("Registered successfully!");

    res
      .status(201)
      .json({ success: true, message: "Registered successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Mising details" });
  }

  try {
    const user = await adminModel.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "invalid credentials" });
    }

    const passMatch = await comparePassword(password, user.password);

    if (!passMatch) {
      return res
        .status(401)
        .json({ success: false, message: "invalid credentials" });
    }
    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log("Logged in successfully!");

    return res.json({ success: true, message: "Logged in successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      expires: new Date(0),
    });

    console.log("Logged out successfully!");
    return res.status(200).json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during logout.",
    });
  }
};

export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  // Check if email is provided
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required!" });
  }

  try {
    // Check if the user exists
    const user = await adminModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found with this email!" });
    }

    // Generate a 6-digit OTP and expiration time
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expireAt = Date.now() + 15 * 60 * 1000;

    // Update user's reset OTP and expiry time
    await adminModel.findByIdAndUpdate(user._id, {
      resetOtp: otp,
      resetOtpExpireAt: expireAt,
    });

    // Prepare and send the password reset email
    const passwordResetMail = passwordRest(email, otp);
    await transporter.sendMail(passwordResetMail);

    console.log(`✅ OTP sent successfully to ${email}`);
    return res
      .status(200)
      .json({ success: true, message: "OTP sent to your email!" });
  } catch (error) {
    console.error("Error while sending OTP:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending OTP.",
    });
  }
};

export const resetPassWord = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Check for missing details
  if (!email || !otp || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Missing Details" });
  }

  try {
    // Check if user exists
    const user = await adminModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found with this email!" });
    }

    // Validate OTP
    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Check if OTP is expired
    if (!user.resetOtpExpireAt || user.resetOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP Expired" });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and reset OTP
    await adminModel.findByIdAndUpdate(user.id, {
      password: hashedPassword,
      resetOtp: "",
      resetOtpExpireAt: 0,
    });

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Something went wrong while resetting password.",
      });
  }
};
