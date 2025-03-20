const express = require("express");
const { isAdmin, verifyToken } = require("../middleware/authMiddleware");
const Blog = require("../models/Blog");

const router = express.Router();

// 📌 1️⃣ Create a New Blog (Admin Only)
router.post("/", verifyToken, isAdmin, async (req, res) => {
    try {
        const { title, content, images, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }

        const blog = new Blog({
            title,
            content,
            images,
            tags,
            author: req.user._id
        });

        await blog.save();
        res.status(201).json({ message: "Blog created successfully", blog });
    } catch (error) {
        console.error("Error creating blog:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 2️⃣ Get All Blogs (Public)
router.get("/", async (req, res) => {
    try {
        const blogs = await Blog.find()
            .populate("author", "name") // Show admin's name
            .sort({ createdAt: -1 });

        res.json(blogs);
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 3️⃣ Get a Single Blog by ID (Public)
router.get("/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate("author", "name");

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.json(blog);
    } catch (error) {
        console.error("Error fetching blog:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 4️⃣ Update a Blog (Admin Only)
router.put("/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const { title, content, images, tags } = req.body;

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        blog.title = title || blog.title;
        blog.content = content || blog.content;
        blog.images = images || blog.images;
        blog.tags = tags || blog.tags;

        await blog.save();
        res.json({ message: "Blog updated successfully", blog });
    } catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 5️⃣ Delete a Blog (Admin Only)
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        await blog.deleteOne();
        res.json({ message: "Blog deleted successfully" });
    } catch (error) {
        console.error("Error deleting blog:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
