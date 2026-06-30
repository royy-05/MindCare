const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: { type: String, required: false }, // optional until auth integration - using String for now
  therapist: { type: String, required: true },
  date: { type: String, required: true },  // e.g. "September 15, 2025"
  time: { type: String, required: true },  // e.g. "10:00 AM"
  type: { type: String, enum: ["ONLINE", "OFFLINE"], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);