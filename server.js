const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db");
const EventEmitter = require("events");
const bodyParser = require('body-parser'); // ✅ Import bodyParser

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const carRoutes = require("./routes/carRoutes");
const fraudRoutes = require("./routes/FraudRoutes");
const BlogRoutes = require("./routes/BlogRoutes");
const buyerRoutes = require("./routes/buyerRoutes");
// const sellerRoutes = require("./routes/sellerRoutes");

// Connect to MongoDB
connectDB();

const app = express();
const eventEmitter = new EventEmitter(); // EventEmitter for real-time updates

// Middleware
app.use(cors());
app.use(express.json()); // Parses JSON bodies
app.use(express.urlencoded({ extended: true })); // Parses form data
app.use("/uploads", express.static("uploads")); // Serve uploaded images

// Frontend interaction
app.use(express.static("public"));
app.use(express.static("admin panel")); // Serve all files from the admin panel directory



// Routes
app.use("/api/auth", authRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/fraud", fraudRoutes);
app.use("/api/buyer", buyerRoutes);

// serving static files
app.use("/uploads", express.static("uploads"));

const clients = [];

app.get("/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*"); 

    clients.push(res);

    req.on("close", () => {
        clients.splice(clients.indexOf(res), 1);
    });
});

// Function to send updates to all clients
function sendUpdate(event, data) {
    clients.forEach(client => {
        client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    });
}

// Listen for car events
eventEmitter.on("car-added", (car) => sendUpdate("car-added", car));
eventEmitter.on("car-updated", (car) => sendUpdate("car-updated", car));
eventEmitter.on("car-deleted", (carId) => sendUpdate("car-deleted", { id: carId }));

// ✅ SSE Endpoint for Real-Time Updates of Imported Cars (import.html)
app.get("/api/imported-cars/updates", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendData = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    eventEmitter.on("import-car-added", sendData);

    req.on("close", () => {
        eventEmitter.removeListener("import-car-added", sendData);
    });
});

// ✅ SSE Endpoint for Real-Time User Updates
app.get("/api/admin/user-updates", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendData = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    eventEmitter.on("user-updated", sendData);
    eventEmitter.on("user-deleted", sendData);

    req.on("close", () => {
        eventEmitter.removeListener("user-updated", sendData);
        eventEmitter.removeListener("user-deleted", sendData);
    });
});




// start server
const PORT = process.env.PORT || 5000;
app.listen(5000, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));


module.exports = { app, eventEmitter };
