const express = require("express");
const router = express.Router();
const Booking = require("../models/bookings");
const authMiddleware = require("../middlewares/auth");

// Create booking
router.post("/", authMiddleware, async (req, res) => {
  try {
    console.log("Received booking data:", req.body);
    const booking = new Booking({
      ...req.body,
      userId: req.user.userId // Securely bind userId from JWT
    });
    await booking.save();
    res.status(201).json({ success: true, message: "Booking created", booking });
  } catch (err) {
    console.error("Booking creation error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all bookings (only for logged-in user or admin)
router.get("/", authMiddleware, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== 'admin') {
      if (req.user.role === 'therapist' || req.user.userType === 'therapist') {
        filter = { $or: [{ userId: req.user.userId }, { therapist: req.user.fullName }] };
      } else {
        filter = { userId: req.user.userId };
      }
    }
    const bookings = await Booking.find(filter);
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete booking (only for booking owner or admin)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (req.user.role !== 'admin' && booking.userId !== String(req.user.userId)) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this booking" });
    }
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;