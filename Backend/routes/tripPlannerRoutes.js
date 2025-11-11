import express from 'express';
import aiAgentService from '../services/aiAgentService.js';

const router = express.Router();

/**
 * Plan a complete trip within budget
 * POST /api/trip-planner/plan
 */
router.post('/plan', async (req, res) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      budget,
      passengers,
      preferences,
    } = req.body;

    if (!origin || !destination || !departureDate || !budget) {
      return res.status(400).json({
        error: 'Missing required fields: origin, destination, departureDate, and budget are required',
      });
    }

    const tripPlan = await aiAgentService.planTrip({
      origin,
      destination,
      departureDate,
      returnDate,
      budget: parseFloat(budget),
      passengers: passengers || 1,
      preferences: preferences || {},
    });

    res.json(tripPlan);
  } catch (error) {
    console.error('Trip planning error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * Chat with AI agent
 * POST /api/trip-planner/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
      });
    }

    const response = await aiAgentService.chat(message, context || {});

    res.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
