import express from "express";
import Subscriber from "../models/Subscriber.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already subscribed" });
    }

    const subscriber = new Subscriber({ email });
    await subscriber.save();

    res.status(201).json({ message: "Subscribed successfully" });
  } catch (err) {
    console.error("Subscription error:", err);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});

// GET /api/subscribers → fetch all subscribers
router.get("/", async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
    res.status(200).json(subscribers);
  } catch (err) {
    console.error("Fetch subscribers error:", err);
    res.status(500).json({ message: "Server error fetching subscribers" });
  }
});

// DELETE /api/subscribers/:id → delete a subscriber (no admin token needed)
router.delete("/:id", async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }

    await Subscriber.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Subscriber removed successfully" });
  } catch (err) {
    console.error("Delete subscriber error:", err);
    res.status(500).json({ message: "Server error deleting subscriber" });
  }
});

export default router;