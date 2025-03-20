const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const User = require("../models/user");
const authenticateToken = require("../middlewares/authMiddleware");

const router = express.Router();

// Seller profile update route
router.put("/update-profile", authenticateToken, upload.single("profilePic"), async (req, res) => {
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

module.exports = router;
