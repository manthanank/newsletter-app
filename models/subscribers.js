const mongoose = require('mongoose');

const SubscriberSchema = new mongoose.Schema({
    email: { 
        type: String,
        required: true,
        unique: true
    },
    name: { 
        type: String,
        default: ''
    },
    groups: [{ 
        type: String 
    }],
    subscribed: {
        type: Boolean,
        default: true
    },
    subscriptionDate: {
        type: Date,
        default: Date.now
    },
    lastActivityDate: {
        type: Date,
        default: Date.now
    }
});

const Subscribers = mongoose.model('subscribers', SubscriberSchema);

module.exports = Subscribers;