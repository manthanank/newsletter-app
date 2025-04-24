const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Template = mongoose.model('template', TemplateSchema);

module.exports = Template;