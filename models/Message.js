const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    sender: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    receiver: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    car: { 
        type: Schema.Types.ObjectId, 
        ref: 'Car', 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    read: { 
        type: Boolean, 
        default: false 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Message', messageSchema);