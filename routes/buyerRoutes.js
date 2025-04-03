const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken, verifyBuyerToken } = require("../middleware/authMiddleware"); // ✅ Import verifyToken
const upload = require("../middleware/uploadMiddleware.js");

// 🔹 Register a new user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, username, role } = req.body;

        if (!name || !email || !password || !username || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, username, password: hashedPassword, role });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 🔹 Login User & Return Token
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Generate JWT Token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(200).json({ 
            success: true, 
            message: "Login successful", 
            token, 
            user: { id: user._id, name: user.name, role: user.role } // Send user details
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// 🔹 Get Buyer Profile (Protected)
router.get("/profile", verifyBuyerToken, async (req, res) => {
    console.log("✅ Request User in Profile Route:", req.user); // Debugging

    try {
        if (!req.user) return res.status(404).json({ message: "User not found" });

        res.json(req.user);
    } catch (error) {
        console.error("❌ Profile Fetch Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 🔹 Update Buyer Profile (Protected)
router.post("/profile/update", verifyToken, async (req, res) => { // ✅ Use verifyToken
    try {
        const { name, email, phone } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { name, email, phone },
            { new: true }
        );

        res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// Buyer profile update route
router.put("/update-profile", verifyToken, upload.single("profilePic"), async (req, res) => { // ✅ Use verifyToken
    try {
        const { name, phone } = req.body;
        const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

        const updatedFields = { name, phone };
        if (profilePic) updatedFields.profilePic = profilePic;

        const updatedUser = await User.findByIdAndUpdate(req.user.id, updatedFields, { new: true });

        res.json({ message: "Profile updated successfully!", user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Get buyer's saved cars
router.get('/saved-cars', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('savedCars');
        res.json(user.savedCars || []);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Save/unsave a car
router.post('/save-car/:carId', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const carId = req.params.carId;

        const index = user.savedCars.indexOf(carId);
        if (index === -1) {
            user.savedCars.push(carId); // Save car
        } else {
            user.savedCars.splice(index, 1); // Unsave car
        }

        await user.save();
        res.json({ success: true, saved: index === -1 });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Export the router
module.exports = router;