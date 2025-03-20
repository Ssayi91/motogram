const express = require("express");
const { isAdmin, verifyToken } = require("../middleware/authMiddleware");
const FraudReport = require("../models/FraudReport");

const router = express.Router();

// 📌 1️⃣ Report Fraud - Users can report a fraud listing
router.post("/report", verifyToken, async (req, res) => {
    try {
        const { car, reason, details } = req.body;

        if (!car || !reason) {
            return res.status(400).json({ message: "Car ID and reason are required" });
        }

        const fraudReport = new FraudReport({
            car,
            reportedBy: req.user._id,
            reason,
            details
        });

        await fraudReport.save();
        res.status(201).json({ message: "Fraud report submitted successfully" });
    } catch (error) {
        console.error("Error reporting fraud:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 2️⃣ Get All Fraud Reports - Admin only
router.get("/", verifyToken, isAdmin, async (req, res) => {
    try {
        const reports = await FraudReport.find()
            .populate("car", "brand model price") // Show car details
            .populate("reportedBy", "name email") // Show who reported
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        console.error("Error fetching fraud reports:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 3️⃣ Get a Single Fraud Report (Admin)
router.get("/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const report = await FraudReport.findById(req.params.id)
            .populate("car", "brand model price")
            .populate("reportedBy", "name email");

        if (!report) {
            return res.status(404).json({ message: "Fraud report not found" });
        }

        res.json(report);
    } catch (error) {
        console.error("Error fetching fraud report:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 4️⃣ Update Fraud Report Status (Admin)
router.put("/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        const report = await FraudReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: "Fraud report not found" });
        }

        report.status = status || report.status;
        await report.save();

        res.json({ message: "Fraud report updated", report });
    } catch (error) {
        console.error("Error updating fraud report:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 5️⃣ Delete Fraud Report (Admin)
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const report = await FraudReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: "Fraud report not found" });
        }

        await report.deleteOne();
        res.json({ message: "Fraud report deleted" });
    } catch (error) {
        console.error("Error deleting fraud report:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
