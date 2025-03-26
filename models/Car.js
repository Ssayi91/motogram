const mongoose = require("mongoose");

const CarSchema = new mongoose.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    price: { type: Number, required: true }, // Price in Kenyan Shillings
    engineCapacity: { type: String, required: true }, // Example: "2000cc"
    mileage: { type: Number, required: true }, // Example: 50,000 KM
    description: { type: String, required: true },
    fuelType: { type: String, enum: ["Petrol", "Diesel", "Electric"], required: true }, 
    transmission: { type: String, enum: ["Manual", "Automatic"], required: true }, // ✅ Added transmission
    images: [{ type: String }], // Array of image URLs
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Who added the car
    status: { type: String, enum: ["pending", "approved"], default: "pending" }, // Admin Approval
    category: { type: String, enum: ["imported", "normal", "motorgram-stock"], required: true }, // Imported vs Normal
    source: { type: String, enum: ["public", "import", "dealer"], default: "public" }, // ✅ Added source
    verifiedSeller: { type: Boolean, default: false }, // ✅ Identifies trusted sellers
    registration: { 
        type: String,
        unique: true,
        sparse: true, // Allows empty for imported cars
        validate: {
            validator: function(v) {
                if (this.category === "normal") {
                    return /^[A-Z]{3} \d{3}[A-Z]?$/.test(v);
                }
                return true; // Skip validation for imported cars
            },
            message: props => `${props.value} is not a valid registration format!`
        }
    }, 
    fraudReports: [{ type: mongoose.Schema.Types.ObjectId, ref: "FraudReport" }], // ✅ Tracks fraud reports
    createdAt: { type: Date, default: Date.now },
    interestedBuyers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    seller: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    }, // Replace addedBy with seller
    addedBy: {
        type: String,
        enum: ["admin", "seller"],
        required: true
    },
});

module.exports = mongoose.model("Car", CarSchema);
