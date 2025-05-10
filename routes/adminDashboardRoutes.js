// routes/adminDashboardRoutes.js
import express from "express";
import {
  dashboard,
  addNewFoodItem,
  getAllFoodItems,
  updateFoodItem,
  deleteFoodItem,
} from "../controllers/adminDashboard.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.get("/", dashboard);
router.post("/add-food", upload.single("image"), addNewFoodItem);
router.get("/foods", getAllFoodItems);
router.put("/update-food/:id", updateFoodItem);
router.delete("/delete-food/:id", deleteFoodItem);

export default router;
