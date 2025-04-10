const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["buyer", "seller", "admin"], default: "buyer" }, // Roles
    phone: { type: String, default: "" }, // Added phone number field
    profilePic: { type: String, default: "" }, // Added profile picture field
    savedCars: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],
    receivedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    sentMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }]

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
