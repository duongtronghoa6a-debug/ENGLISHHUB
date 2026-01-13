/**
 * Streak & Leaderboard Routes
 * /api/v1/streak/*
 */

const express = require('express');
const router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const streakController = require('../app/controllers/streakController');

// Record daily activity (requires auth)
router.post('/record', isAuth, streakController.recordActivity);

// Get user's streak info
router.get('/me', isAuth, streakController.getMyStreak);

// Get leaderboard (public but shows current user rank if authenticated)
router.get('/leaderboard', streakController.getLeaderboard);

// Update achievement scores (internal use after lesson/exam completion)
router.post('/update-score', isAuth, streakController.updateScore);

module.exports = router;
