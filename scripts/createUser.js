const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust the path as necessary

const createUser = async (name, email, password, username, role) => {
    try {
        await mongoose.connect('mongodb://localhost:27017/adminPanelDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            email: email,
            password: hashedPassword,
            username: username,
            role: role,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await newUser.save();
        console.log('User created successfully:', newUser);
    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Example usage
createUser('Admin User', 'admin@example.com', 'samplePassword', 'Admins', 'admin');
