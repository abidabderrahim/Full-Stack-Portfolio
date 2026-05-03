import Category from "../models/Category.js";

// When creating category
export const createCategory = async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "Name and type required" });
    }

    // Check if category already exists for this type
    let category = await Category.findOne({ name, type });
    if (category) {
      // If exists, return it instead of creating a new one
      return res.status(200).json(category);
    }

    // Create new category
    category = await Category.create({ name, type });
    res.status(201).json(category);
  } catch (err) {
    console.error("Category creation error:", err);
    res.status(500).json({ error: "Server error creating category" });
  }
};

// When fetching categories
export const fetchCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const categories = await Category.find(type ? { type } : {});
    res.json(categories);
  } catch (err) {
    console.error("Fetch categories error:", err);
    res.status(500).json({ error: "Server error fetching categories" });
  }
};
