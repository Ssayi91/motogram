const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const verifyToken = async (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("🚨 No token or incorrect format received.");
        return res.status(401).json({ message: "Access denied. Invalid token format." });
    }

    const token = authHeader.split(" ")[1]; // Extract token after "Bearer"
    console.log("🔹 Received Token:", token); // Debugging log

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Decoded Token:", decoded); // Debugging log

        req.user = await User.findById(decoded.id).select("-password");
        if (!req.user) {
            console.log("🚨 User not found in DB.");
            return res.status(404).json({ message: "User not found" });
        }

        next();
    } catch (error) {
        console.error("❌ Token Verification Error:", error.message);
        
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Session expired. Please log in again." });
        }
        return res.status(400).json({ message: "Invalid token" });
    }
};

// ✅ Define verifyBuyerToken
const verifyBuyerToken = async (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. Invalid token format." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user || user.role.toLowerCase() !== "buyer") {
            return res.status(403).json({ message: "Access denied. Buyers only." });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("❌ Token Verification Error:", error.message);
        return res.status(400).json({ message: "Invalid or expired token" });
    }
};



const isAdmin = (req, res, next) => {
    console.log("🔍 Checking Admin Role:", req.user?.role); // Debugging log

    if (!req.user || req.user.role?.toLowerCase() !== "admin") {
        console.log("🚨 Access denied. User is not an admin. Role:", req.user?.role);
        return res.status(403).json({ message: "Access denied. Admins only." });
    }

    console.log("✅ User is an admin. Access granted.");
    next(); // ✅ Ensure next() is called
};

module.exports = { verifyToken, verifyBuyerToken, isAdmin };
