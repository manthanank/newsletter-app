const express = require('express');
const router = express.Router();
const subscribersController = require('../controllers/subscribers');

// Basic subscription routes
router.post('/subscribe', subscribersController.createSubscribers);
router.post('/unsubscribe', subscribersController.deleteSubscribers);

// New subscriber management routes
router.get('/subscribers', subscribersController.getAllSubscribers);
router.get('/subscribers/groups', subscribersController.getAllGroups);
router.get('/subscribers/group/:group', subscribersController.getSubscribersByGroup);
router.put('/subscribers/:email', subscribersController.updateSubscriber);
router.post('/subscribers/:email/groups', subscribersController.addToGroup);
router.delete('/subscribers/:email/groups/:group', subscribersController.removeFromGroup);

module.exports = router;