const mongoose = require("mongoose");

const LeaveRequestSchema = new mongoose.Schema({
  userEmail: String,
  type: String,
  time: Date,
  date: Date,
  reason: String,
  thoiGianVangMat: String, // Add this field
  status: String,
  createdAt: { type: Date, default: Date.now },
});

mongoose.model("LeaveRequest", LeaveRequestSchema);