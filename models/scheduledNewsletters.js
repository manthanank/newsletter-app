const mongoose = require('mongoose');

const ScheduledNewsletterSchema = new mongoose.Schema({
    name: { 
        type: String,
        required: true 
    },
    subject: { 
        type: String,
        required: true 
    },
    content: { 
        type: String,
        required: true 
    },
    scheduledDate: { 
        type: Date,
        required: true 
    },
    targetGroups: [{ 
        type: String 
    }],
    status: { 
        type: String,
        enum: ['scheduled', 'sent', 'failed', 'draft'],
        default: 'scheduled'
    },
    createdAt: { 
        type: Date,
        default: Date.now 
    },
    sentAt: { 
        type: Date 
    },
    analytics: {
        sent: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 }
    }
});

const ScheduledNewsletter = mongoose.model('scheduledNewsletter', ScheduledNewsletterSchema);

module.exports = ScheduledNewsletter;