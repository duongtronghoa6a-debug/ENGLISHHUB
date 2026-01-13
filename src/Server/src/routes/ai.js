/**
 * AI Practice Routes
 * /api/v1/ai/*
 */

const express = require('express');
const router = express.Router();

const aiController = require('../app/controllers/aiController');
const multer = require('multer');

// Configure multer for audio file uploads (max 10MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only MP3, WAV, OGG, and WebM are allowed.'));
        }
    }
});

// Speaking Practice
router.get('/speaking/prompt', aiController.getSpeakingPrompt);
router.post('/speaking/evaluate', aiController.evaluateSpeaking);
router.post('/speaking/evaluate-audio', upload.single('audio'), aiController.evaluateSpeakingAudio);

// Writing Practice
router.get('/writing/prompt', aiController.getWritingPrompt);
router.post('/writing/evaluate', aiController.evaluateWriting);

// Grammar Check
router.post('/grammar/check', aiController.checkGrammar);

// AI Chat
router.post('/chat', aiController.aiChat);

module.exports = router;
