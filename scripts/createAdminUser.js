const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust the path as necessary

const createAdminUser = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/adminPanelDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('samplePassword01', 10);

        const adminUser = new User({
            name: 'Admin',
            email: 'admin@example.com',
            password: hashedPassword,
            username: 'adminUser',
            role: 'admin',
        });

        await adminUser.save();
        console.log('Sample admin user created successfully.');
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        mongoose.connection.close();
    }
};

createAdminUser();
