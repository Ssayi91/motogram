const express = require("express");
const { isAdmin, verifyToken } = require("../middleware/authMiddleware");
const Car = require("../models/Car");
const eventEmitter = require("../events"); // Import EventEmitter instance

const router = express.Router();
const multer = require("multer");
const path = require("path");

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Save images to the 'uploads' folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });





/**
 * ✅ Fetch Single Car by ID-Modal
 */
router.get("/:id", async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }
        res.json(car);
    } catch (error) {
        console.error("❌ Error fetching car:", error);
        res.status(500).json({ message: "Server error" });
    }
});


/**
 * ✅ Fetch All Cars (Optional Status Filter)
 */
router.get("/", async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        if (status) {
            query.status = status; // ✅ Filter by status if provided
        }

        console.log("Fetching cars with query:", query); // 🔍 Debugging

        const cars = await Car.find(query);
        console.log("Found cars:", cars); // 🔍 Debugging

        if (cars.length === 0) {
            return res.status(404).json({ message: "No cars found" }); // ✅ Avoid empty response
        }

        res.status(200).json(cars);
    } catch (error) {
        console.error("Error fetching cars:", error);
        res.status(500).json({ message: "Server error" });
    }
});


/**
 * ✅ Fetch Imported Cars Only (For import.html)
 */
router.get("/imported", async (req, res) => {
    try {
        const importedCars = await Car.find({ category: "imported", status: "approved" });
        res.status(200).json(importedCars);
    } catch (error) {
        console.error("Error fetching imported cars:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * ✅ Fetch a Single Car by ID
 */
router.get("/car/:id", async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }
        res.status(200).json(car);
    } catch (error) {
        console.error("Error fetching car:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * ✅ Add Car with Real-Time Updates
 */
router.post("/add", verifyToken, isAdmin, upload.array("images", 10), async (req, res) => {
    try {
        console.log("Received Body:", req.body);
        console.log("Received Files:", req.files);

        if (!req.body.brand || !req.body.model || !req.body.year || !req.body.price) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const newCar = new Car({
            brand: req.body.brand,
            model: req.body.model,
            year: req.body.year,
            price: req.body.price,
            engineCapacity: req.body.engineCapacity,
            mileage: req.body.mileage,
            description: req.body.description,
            fuelType: req.body.fuelType,
            transmission: req.body.transmission,
            images: req.files.map(file => `/uploads/${file.filename}`),
            addedBy: req.body.addedBy || null,
            status: req.user.role === "admin" ? "approved" : "pending",
            category: req.body.category,
            source: req.body.source || "public",
            verifiedSeller: req.user.role === "admin",
            registration: req.body.registration || null,
            createdAt: new Date()
        });

        await newCar.save();

        // Emit real-time event
        eventEmitter.emit("car-added", { action: "added", car: newCar });

        res.status(201).json({ message: "Car added successfully", car: newCar });
    } catch (error) {
        console.error("Error adding car:", error);
        if (error.code === 11000) {
            return res.status(400).json({ error: "Registration number must be unique." });
        } else {
            return res.status(500).json({ error: "Server error" });
        }
    }
});

/**
 * ✅ Edit Existing Car
 */
router.put("/edit/:id", verifyToken, isAdmin, upload.array("images", 10), async (req, res) => {
    try {
        const { id } = req.params;
        const car = await Car.findById(id);
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        // Update car details
        car.brand = req.body.brand || car.brand;
        car.model = req.body.model || car.model;
        car.year = req.body.year || car.year;
        car.price = req.body.price || car.price;
        car.engineCapacity = req.body.engineCapacity || car.engineCapacity;
        car.mileage = req.body.mileage || car.mileage;
        car.description = req.body.description || car.description;
        car.fuelType = req.body.fuelType || car.fuelType;
        car.transmission = req.body.transmission || car.transmission;
        car.category = req.body.category || car.category;

        // If new images are uploaded, replace the old ones
        if (req.files && req.files.length > 0) {
            car.images = req.files.map(file => `/uploads/${file.filename}`);
        }

        await car.save();

        // Emit real-time update event
        eventEmitter.emit("car-updated", { action: "updated", car });

        res.status(200).json({ message: "Car updated successfully", car });
    } catch (error) {
        console.error("Error updating car:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * ✅ Delete Car
 */
router.delete("/delete/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const car = await Car.findByIdAndDelete(id);

        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        // Emit real-time delete event
        eventEmitter.emit("car-deleted", { action: "deleted", carId: id });

        res.status(200).json({ message: "Car deleted successfully" });
    } catch (error) {
        console.error("Error deleting car:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * ✅ Approve Car
 */
// router.patch("/approve/:id", verifyToken, isAdmin, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const car = await Car.findByIdAndUpdate(id, { status: "approved" }, { new: true });

//         if (!car) {
//             return res.status(404).json({ message: "Car not found" });
//         }

//         // Emit real-time approval event
//         eventEmitter.emit("car-updated", { action: "approved", car });

//         res.status(200).json({ message: "Car approved successfully", car });
//     } catch (error) {
//         console.error("Error approving car:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// });


// ✅ Approve Car-public
router.put("/approve/:id", async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: "Car not found" });

        car.status = "approved"; // ✅ Mark as approved

        // ✅ Assign correct category
        if (car.registration) {
            car.category = "motorgram-stock"; // ✅ In-house stock
        } else {
            car.category = "imported"; // ✅ Imported cars
        }

        await car.save(); // ✅ Save changes
        res.json({ message: "Car approved successfully", car });
    } catch (error) {
        console.error("❌ Error approving car:", error);
        res.status(500).json({ message: "Server error" });
    }
});



/**
 * ✅ Real-Time Updates for Cars
 */
router.get("/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendData = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    eventEmitter.on("car-added", sendData);
    eventEmitter.on("car-updated", sendData);
    eventEmitter.on("car-deleted", sendData);

    req.on("close", () => {
        eventEmitter.removeListener("car-added", sendData);
        eventEmitter.removeListener("car-updated", sendData);
        eventEmitter.removeListener("car-deleted", sendData);
    });
});

module.exports = router;
