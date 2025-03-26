const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Car = require("../models/Car");
const User = require("../models/User");
const { verifyToken } = require("../middleware/authMiddleware");

/**
 * ✅ Send Message to Seller
 */
router.post("/", verifyToken, async (req, res) => {
    try {
        const { carId, content } = req.body;
        const car = await Car.findById(carId).populate("seller");

        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        const message = new Message({
            sender: req.user.id,
            receiver: car.seller._id,
            car: carId,
            content
        });

        await message.save();

        // Update sender and receiver
        await User.updateOne(
            { _id: req.user.id },
            { $push: { sentMessages: message._id } }
        );

        await User.updateOne(
            { _id: car.seller._id },
            { $push: { receivedMessages: message._id } }
        );

        // Emit real-time event
        eventEmitter.emit("new-message", { 
            carId,
            message: content,
            sender: req.user.id 
        });

        res.json({ success: true });
    } catch (error) {
        console.error("❌ Error sending message:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;