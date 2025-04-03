const express = require("express");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const Car = require("../models/Car"); // ✅ Import Car model
const { eventEmitter } = require("../server");  // ✅ Import event emitter for real-time updates
const User = require("../models/User");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();
const multer = require("multer");


const uploads = multer({ dest: "uploads/" }); // Adjust based on your file handling logic


/**
 * 🔹 Admin Dashboard
 */
router.get("/dashboard", verifyToken, isAdmin, (req, res) => {
    res.json({ message: "Welcome, Admin!" });
});

/**
 * 🔹 Fetch All Cars (Admin Only)
 */
router.get("/cars",verifyToken, isAdmin, async (req, res) => {
    try {
        const cars = await Car.find(); // Fetch all cars from the database
        res.json(cars); // Return the list of cars
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * 🔹 Add a Normal Car (Admin Only)
 */
router.post("/add-normal-car", verifyToken, isAdmin, async (req, res) => {
    try {
        const { brand, model, year, price, engineCapacity, mileage, description, fuelType, images, registrationNumber, transmission } = req.body;

        // ✅ Validate required fields
        if (!brand || !model || !year || !price || !engineCapacity || !mileage || !description || !fuelType || !images || images.length === 0 || !registrationNumber || !transmission) {
            return res.status(400).json({ message: "All fields, including a unique registration number and transmission, are required for normal cars." });
        }

        // ✅ Ensure registration number is unique
        const existingCar = await Car.findOne({ registrationNumber });
        if (existingCar) {
            return res.status(400).json({ message: "A car with this registration number already exists." });
        }

        // ✅ Create normal car entry
        const newCar = new Car({
            brand,
            model,
            year,
            price,
            engineCapacity,
            mileage,
            description,
            fuelType,
            images,
            registrationNumber,
            category: "normal", // ✅ Set category as normal
            transmission, // ✅ Include transmission field
            status: "approved"  // ✅ Automatically approved since admin is adding it
        });

        await newCar.save();

        // 🔹 Emit event for real-time updates
        eventEmitter.emit("normalCarAdded", newCar);

        res.status(201).json({ message: "Normal car added successfully", newCar });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * 🔹 Add an Imported Car (Admin Only)
 */
router.post("/add-imported-car", verifyToken, isAdmin, async (req, res) => {
    try {
        const { brand, model, year, price, engineCapacity, mileage, description, fuelType, images, transmission } = req.body;

        // ✅ Validate required fields
        if (!brand || !model || !year || !price || !engineCapacity || !mileage || !description || !fuelType || !images || images.length === 0 || !transmission) {
            return res.status(400).json({ message: "All fields are required, including at least one image and transmission." });
        }

        // ✅ Create imported car entry (no registration required)
        const newCar = new Car({
            brand,
            model,
            year,
            price,
            engineCapacity,
            mileage,
            description,
            fuelType,
            images,
            category: "imported", // ✅ Set category as imported
            transmission, // ✅ Include transmission field
            status: "approved" // ✅ Automatically approved since admin is adding it
        });

        await newCar.save();

        // 🔹 Emit event for real-time updates
        eventEmitter.emit("importCarAdded", newCar);

        res.status(201).json({ message: "Imported car added successfully", newCar });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * 🔹 Edit a Car (Admin Can Edit Any Car)
 */
router.put("/edit/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const { brand, model, year, price, engineCapacity, mileage, description, fuelType, images, registrationNumber, transmission } = req.body;

        let car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        // ✅ If editing a normal car, check registration uniqueness
        if (car.category === "normal" && registrationNumber) {
            const existingCar = await Car.findOne({ registrationNumber, _id: { $ne: req.params.id } });
            if (existingCar) {
                return res.status(400).json({ message: "A car with this registration number already exists." });
            }
        }

        // ✅ Update car details
        car.brand = brand || car.brand;
        car.model = model || car.model;
        car.year = year || car.year;
        car.price = price || car.price;
        car.engineCapacity = engineCapacity || car.engineCapacity;
        car.mileage = mileage || car.mileage;
        car.description = description || car.description;
        car.fuelType = fuelType || car.fuelType;
        car.images = images || car.images;
        if (registrationNumber) {
            car.registrationNumber = registrationNumber;
        }
        if (transmission) {
            car.transmission = transmission; // Update transmission if provided
        }

        await car.save();

        // 🔹 Emit event for real-time updates
        eventEmitter.emit("carUpdated", car);

        res.json({ message: "Car updated successfully", car });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * 🔹 Delete a Car (Admin Can Delete Any Car)
 */
router.delete("/delete/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        // ✅ Admin can delete any car, including seller cars
        await Car.findByIdAndDelete(req.params.id);

        // 🔹 Emit event for real-time updates
        eventEmitter.emit("carDeleted", req.params.id);

        res.json({ message: "Car deleted successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * 🔹 Approve a Car (Check for Fraudulent Duplicate Registrations)
 */
router.put("/approve/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        // ✅ Prevent re-approving an already approved car
        if (car.status === "approved") {
            return res.status(400).json({ message: "Car is already approved" });
        }

        // ✅ Normal cars must have a unique registration number
        if (car.category === "normal") {
            if (!car.registrationNumber) {
                return res.status(400).json({ message: "Normal cars must have a registration number." });
            }

            // ✅ Check for duplicate registration number
            const existingCar = await Car.findOne({ 
                registrationNumber: car.registrationNumber, 
                _id: { $ne: car._id }
            });

            if (existingCar) {
                return res.status(400).json({ message: "Duplicate registration detected. Possible fraud." });
            }
        }

        // ✅ Approve the car
        car.status = "approved";
        await car.save();
        res.json({ message: "Car approved successfully", car });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * 🔹 Reject a Car Listing (Mark as Rejected Instead of Deleting)
 */
router.put("/reject/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        // ✅ Instead of deleting, mark the car as rejected
        car.status = "rejected";
        await car.save();

        res.json({ message: "Car listing rejected." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});




// users and admin routes
// ✅ Fetch all users (Only for admins)
// router.get("/users",  verifyToken, isAdmin, async (req, res) => {
//     try {
//         const users = await User.find(); // Fetch all users
//         res.json(users);
//     } catch (error) {
//         console.error("Error fetching users:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// });

router.put("/users/:id", verifyToken, isAdmin, async (req, res) => {
    const { name, email, role } = req.body;
    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;

        await user.save();
        res.json({ message: "User updated successfully", user });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Server Error" });
    }
});


// ✅ Fetch all users (Only for admins)
router.get("/users", verifyToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        res.json(users);
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// ✅ Delete a user (Only for admins)
router.delete("/users/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// ✅ Filter users by role (Only for admins)
router.get("/users/filter/:role", verifyToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({ role: req.params.role }).select("-password");
        res.json(users);
    } catch (error) {
        console.error("Error filtering users:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

router.put("/update-profile", verifyToken, upload.single("profilePic"), async (req, res) => {
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

