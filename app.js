import express from "express";
import "dotenv/config";
import session from "express-session";
import cookieParser from "cookie-parser";
import connectDb from "./config/connectDB.js";
import adminRouter from "./routes/adminRoutes.js";
import adminDashboardRouter from "./routes/adminDashboardRoutes.js";
import customerRouter from "./routes/customerRoutes.js";
import { authenticateUser } from "./middleware/adminAuthMiddleware.js";

const app = express();
const port = process.env.PORT || 3000;

// Connect to database
connectDb();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware
app.use(
  "/api/customer",
  session({
    secret: process.env.SESSION_SECRET || "mySecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
    },
  })
);

// Routes
app.use("/api/admin", adminRouter);
app.use("/api/admin/dashboard", authenticateUser, adminDashboardRouter);
app.use("/api/customer", customerRouter);

// Default route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Start server
app.listen(port, () => console.log(`Server is running on port: ${port}`));
