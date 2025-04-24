const Template = require('../models/templates');

// Get all templates
exports.getAllTemplates = async (req, res, next) => {
    try {
        const templates = await Template.find().sort({ createdAt: -1 });
        res.status(200).json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        next(error);
    }
};

// Get a template by ID
exports.getTemplateById = async (req, res, next) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.status(200).json(template);
    } catch (error) {
        console.error('Error fetching template:', error);
        next(error);
    }
};

// Create a new template
exports.createTemplate = async (req, res, next) => {
    try {
        const { name, subject, content } = req.body;
        
        if (!name || !subject || !content) {
            return res.status(400).json({ message: 'Please provide name, subject, and content' });
        }
        
        const newTemplate = new Template({
            name,
            subject,
            content
        });
        
        const savedTemplate = await newTemplate.save();
        res.status(201).json(savedTemplate);
    } catch (error) {
        console.error('Error creating template:', error);
        next(error);
    }
};

// Update a template
exports.updateTemplate = async (req, res, next) => {
    try {
        const { name, subject, content } = req.body;
        
        if (!name && !subject && !content) {
            return res.status(400).json({ message: 'Please provide at least one field to update' });
        }
        
        const updatedTemplate = await Template.findByIdAndUpdate(
            req.params.id,
            { $set: { name, subject, content } },
            { new: true, runValidators: true }
        );
        
        if (!updatedTemplate) {
            return res.status(404).json({ message: 'Template not found' });
        }
        
        res.status(200).json(updatedTemplate);
    } catch (error) {
        console.error('Error updating template:', error);
        next(error);
    }
};

// Delete a template
exports.deleteTemplate = async (req, res, next) => {
    try {
        const deletedTemplate = await Template.findByIdAndDelete(req.params.id);
        
        if (!deletedTemplate) {
            return res.status(404).json({ message: 'Template not found' });
        }
        
        res.status(200).json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        next(error);
    }
};