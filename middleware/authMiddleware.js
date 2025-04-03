const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

// ✅ Verify Token Middleware
const verifyToken = async (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("🚨 No token or incorrect format received.");
        return res.status(401).json({ message: "Access denied. Invalid token format." });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔹 Received Token:", token); 
    if (!token || token === "null") {
        console.log("🚨 Token is null or undefined");
        return res.status(401).json({ message: "Token not provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Decoded Token:", decoded);

        req.user = await User.findById(decoded.id).select("-password");
        if (!req.user) {
            console.log("🚨 User not found in DB.");
            return res.status(404).json({ message: "User not found" });
        }

        console.log("✅ User authenticated:", req.user.email);
        next();
    } catch (error) {
        console.error("❌ Token Verification Error:", error.message);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Session expired. Please log in again." });
        }
        return res.status(400).json({ message: "Invalid token" });
    }
};

// ✅ Verify Buyer Token Middleware
const verifyBuyerToken = async (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. Invalid token format." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role?.toLowerCase() !== "buyer") {
            console.log(`🚨 Access denied. User role: ${user.role}`);
            return res.status(403).json({ message: "Access denied. Buyers only." });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("❌ Token Verification Error:", error.message);
        return res.status(400).json({ message: "Invalid or expired token" });
    }
};

// ✅ Check if User is Admin
const isAdmin = (req, res, next) => {
    if (!req.user) {
        console.log("🚨 Access denied. No user found in request.");
        return res.status(403).json({ message: "Access denied. No user found." });
    }

    if (req.user.role?.toLowerCase() !== "admin") {
        console.log(`🚨 Access denied. User role is ${req.user.role}`);
        return res.status(403).json({ message: "Access denied. Admins only." });
    }

    console.log("✅ User is an admin. Access granted.");
    next();
};

module.exports = { verifyToken, verifyBuyerToken, isAdmin };
