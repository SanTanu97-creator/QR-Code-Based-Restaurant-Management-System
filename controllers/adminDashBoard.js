import Food from "../model/foodModel.js";
import cloudinary from "../config/cloudinaryConfig.js";
import fs from "fs";

// Admin Dashboard
export const dashboard = (req, res) => {
  res.json({ success: true, message: "You are in the dashboard" });
};

// Add New Food Item
export const addNewFoodItem = async (req, res) => {
  const {
    name,
    description,
    category,
    price,
    discount,
    ingredients,
    isVegetarian,
  } = req.body;

  if (!name || !description || !category || !price) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields!",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Image file is required!",
    });
  }

  try {
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "food_items",
    });

    // Optional: delete local file after upload
    fs.unlinkSync(req.file.path);

    const newFoodItem = await Food.create({
      name,
      description,
      category,
      price,
      discount: discount || 0,
      imageUrl: result.secure_url,
      ingredients: ingredients ? JSON.parse(ingredients) : [],
      isVegetarian: isVegetarian === "true", // because form data sends string
    });

    res.status(201).json({
      success: true,
      message: "Food item added successfully!",
      data: newFoodItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding food item",
      error: error.message,
    });
  }
};

// Get All Food Items
export const getAllFoodItems = async (req, res) => {
  try {
    const foodItems = await Food.find({});

    if (foodItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No food items found!",
      });
    }

    return res.status(200).json({
      success: true,
      data: foodItems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching food items.",
    });
  }
};

// Update Food Item
export const updateFoodItem = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedFood = await Food.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedFood) {
      return res.status(404).json({
        success: false,
        message: "Food item not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Food item updated successfully!",
      data: updatedFood,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating food item",
      error: error.message,
    });
  }
};

// Delete Food Item
// export const deleteFoodItem = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const deletedFood = await Food.findByIdAndDelete(id);

//     if (!deletedFood) {
//       return res.status(404).json({
//         success: false,
//         message: "Food item not found!",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Food item deleted successfully!",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error deleting food item",
//       error: error.message,
//     });
//   }
// };

export const deleteFoodItem = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the food item by ID
    const foodItem = await Food.findById(id);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: "Food item not found!",
      });
    }

    // Delete the image from Cloudinary
    const imagePublicId = foodItem.imageUrl.split("/").slice(-2, -1)[0]; // Extract public_id from imageUrl
    await cloudinary.uploader.destroy(imagePublicId); // Delete the image from Cloudinary

    // Delete the food item from the database
    await Food.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Food item and image deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting food item",
      error: error.message,
    });
  }
};