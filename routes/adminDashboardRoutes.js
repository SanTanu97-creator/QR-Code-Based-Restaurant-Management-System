import express from "express";
const adminDashboardRouter = express.Router();

import {
  addNewFoodItem,
  dashboard,
  deleteFoodItem,
  getAllFoodItems,
  updateFoodItem,
} from "../controllers/adminDashBoard.js";
import { authenticateUser } from "../middleware/adminAuthMiddleware.js";

adminDashboardRouter.get("/", authenticateUser, dashboard);
adminDashboardRouter.get("/all-food-items", authenticateUser, getAllFoodItems);
adminDashboardRouter.post("/add-food", authenticateUser, addNewFoodItem);
adminDashboardRouter.put("/update-food/:id", authenticateUser, updateFoodItem);
adminDashboardRouter.delete("/delete-food/:id", authenticateUser, deleteFoodItem);

export default adminDashboardRouter;
