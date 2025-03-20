const mongoose = require("mongoose");

const FraudReportSchema = new mongoose.Schema({
    car: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true }, // The reported car
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User who reported
    reason: { type: String, required: true }, // Reason for reporting
    details: { type: String }, // Additional details about the fraud
    status: { type: String, enum: ["pending", "reviewed", "resolved"], default: "pending" }, // Admin action status
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("FraudReport", FraudReportSchema);
