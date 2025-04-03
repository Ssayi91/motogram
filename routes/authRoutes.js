const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const router = express.Router();
const refreshTokens = []; // Store refresh tokens (use DB in production)

// ✅ Generate JWT Access Token
const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

// ✅ Generate Refresh Token
const generateRefreshToken = (user) => {
    const refreshToken = jwt.sign({ id: user._id, role: user.role }, process.env.REFRESH_SECRET);
    refreshTokens.push(refreshToken); // Store in DB in production
    return refreshToken;
};

// ✅ Rate limiter to prevent brute-force login attacks
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 login attempts per 15 minutes
    message: "Too many login attempts. Please try again later."
});

// ✅ Password Validation Function
const passwordValidator = (password) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
};

// ✅ Fix: Corrected Admin Verification Route
router.get("/verify-admin", verifyToken, isAdmin, (req, res) => {
    res.json({
        valid: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// ✅ Admin Login
router.post("/admin-login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Case-insensitive search with explicit role check
        const admin = await User.findOne({ 
            email: email.toLowerCase(),
            role: { $regex: /^admin$/i }
        });

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate token with explicit admin claims
        const token = jwt.sign(
            { 
                id: admin._id,
                role: "admin", // Force role to lowercase
                email: admin.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            success: true,
            token,
            role: "admin" // Explicitly send role
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ User Registration
router.post("/register", async (req, res) => {
    try {
        let { name, email, password, username, role } = req.body;
        email = email.toLowerCase();

        if (!name || !email || !password || !username || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!passwordValidator(password)) {
            return res.status(400).json({ message: "Password must be at least 8 characters, include an uppercase letter and a number." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword, username, role });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ User Login (With Rate Limiting)
router.post("/login", loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.json({
            success: true,
            token: accessToken,
            refreshToken,
            role: user.role,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
    }
});

// ✅ Refresh Token Route
router.post("/refresh-token", (req, res) => {
    const { token } = req.body;
    if (!token || !refreshTokens.includes(token)) {
        return res.status(403).json({ message: "Refresh token is not valid" });
    }

    jwt.verify(token, process.env.REFRESH_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Token expired or invalid" });

        const newAccessToken = generateAccessToken(user);
        res.json({ token: newAccessToken });
    });
});

// ✅ Protected Profile Route
router.get("/profile", verifyToken, async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/buyer/profile", verifyToken, async (req, res) => {
    try {
        if (req.user.role.toLowerCase() !== "buyer") {
            return res.status(403).json({ message: "Access denied. Buyers only." });
        }

        const buyer = await User.findById(req.user.id).select("-password -role");
        if (!buyer) {
            return res.status(404).json({ message: "Buyer profile not found" });
        }

        res.json(buyer);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ Admin Route (Protected)
router.get("/admin/dashboard", verifyToken, isAdmin, (req, res) => {
    res.json({ message: "Welcome, Admin!" });
});

module.exports = router;
