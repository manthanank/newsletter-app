const express = require('express');
const router = express.Router();
const scheduledNewslettersController = require('../controllers/scheduledNewsletters');

router.get('/', scheduledNewslettersController.getAllScheduledNewsletters);
router.get('/:id', scheduledNewslettersController.getScheduledNewsletterById);
router.post('/', scheduledNewslettersController.createScheduledNewsletter);
router.put('/:id', scheduledNewslettersController.updateScheduledNewsletter);
router.delete('/:id', scheduledNewslettersController.deleteScheduledNewsletter);
router.post('/:id/send', scheduledNewslettersController.sendScheduledNewsletter);

module.exports = router;