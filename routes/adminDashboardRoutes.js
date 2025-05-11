import express from "express";
import {
  dashboard,
  addNewFoodItem,
  getAllFoodItems,
  updateFoodItem,
  deleteFoodItem,
} from "../controllers/adminDashBoard.js";
import upload from "../middleware/multer.js";
import { authenticateUser } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", authenticateUser, dashboard);
router.post("/add-food", authenticateUser, upload.single("image"), addNewFoodItem);
router.get("/foods", authenticateUser, getAllFoodItems);
router.put("/update-food/:id", authenticateUser, updateFoodItem);
router.delete("/delete-food/:id", authenticateUser, deleteFoodItem);

export default router;
