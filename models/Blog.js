const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Admin who wrote the blog
    images: [{ type: String }], // Optional images for the blog
    tags: [{ type: String }], // Categories or keywords for filtering
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Blog", BlogSchema);
