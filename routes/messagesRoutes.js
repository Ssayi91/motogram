const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Car = require("../models/Car");
const User = require("../models/User");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const EventEmitter = require("events");

const eventEmitter = new EventEmitter(); // Shared event emitter

/**
 * ✅ Send Message to Seller
 */
router.post("/", verifyToken, async (req, res) => {
    try {
        console.log("✅ Authenticated User:", req.user);

        const { carId, content } = req.body;
        const car = await Car.findById(carId).populate("seller");

        console.log("✅ Car Data:", car); // 🔍 Log the car object

        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        if (!car.seller) {
            console.log("❌ Error: Car has no assigned seller!");
            return res.status(400).json({ message: "Car has no assigned seller." });
        }

        const message = new Message({
            sender: req.user.id,
            receiver: car.seller._id,
            car: carId,
            content
        });

        await message.save();

        await User.updateOne(
            { _id: req.user.id },
            { $push: { sentMessages: message._id } }
        );

        await User.updateOne(
            { _id: car.seller._id },
            { $push: { receivedMessages: message._id } }
        );

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


/**
 * ✅ Get Messages for Logged-in Buyer
 */
router.get("/", verifyToken, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [{ sender: req.user.id }, { receiver: req.user.id }]
        })
        .populate("sender", "firstName lastName")
        .populate("receiver", "firstName lastName")
        .populate("car", "brand model images");

        res.json(messages);
    } catch (error) {
        console.error("❌ Error fetching messages:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * ✅ Mark Message as Read
 */
router.patch("/:id/read", verifyToken, async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        res.json(message);
    } catch (error) {
        console.error("❌ Error marking message read:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// -------------------- Admin Routes --------------------

/**
 * ✅ Get Messages for Admin (Received Messages)
 */
router.get("/admin", verifyToken, isAdmin, async (req, res) => {
    try {
        const messages = await Message.find() // Remove `{ receiver: req.user.id }`
            .populate("sender", "firstName lastName email")
            .populate("receiver", "firstName lastName email")
            .populate("car", "brand model images");

        res.json(messages);
    } catch (error) {
        console.error("❌ Error fetching admin messages:", error);
        res.status(500).json({ message: "Server error" });
    }
});


/**
 * ✅ Admin Marks Message as Read
 */
router.patch("/admin/:id/read", verifyToken, isAdmin, async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        res.json(message);
    } catch (error) {
        console.error("❌ Error marking message read:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// SSE: Listen for new messages and send to clients
router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Listen for new-message events
    eventEmitter.on('new-message', (messageData) => {
        res.write(`data: ${JSON.stringify(messageData)}\n\n`);
    });

    req.on('close', () => {
        console.log('Client disconnected');
    });
});


// ✅ Correctly export both router and eventEmitter
module.exports = { router, eventEmitter };
