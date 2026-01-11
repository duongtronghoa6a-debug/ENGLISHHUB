/**
 * Chat Routes
 * /api/v1/chat/*
 */

const express = require('express');
const router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const chatController = require('../app/controllers/chatController');

// All routes require authentication
router.use(isAuth);

// Conversations
router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createConversation);

// Messages
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);

// User search
router.get('/search-users', chatController.searchUsers);

// Consultation request (for offline classes)
router.post('/consultation', chatController.requestConsultation);

module.exports = router;
