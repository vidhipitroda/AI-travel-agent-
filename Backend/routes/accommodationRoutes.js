import express from 'express';
import accommodationService from '../services/accommodationService.js';

const router = express.Router();

/**
 * Search for accommodations
 * POST /api/accommodation/search
 */
router.post('/search', async (req, res) => {
  try {
    const { location, checkIn, checkOut, guests, maxPrice } = req.body;

    if (!location || !checkIn || !checkOut) {
      return res.status(400).json({
        error: 'Missing required fields: location, checkIn, and checkOut are required',
      });
    }

    const accommodations = await accommodationService.searchAccommodations(
      location,
      checkIn,
      checkOut,
      guests || 2,
      maxPrice ? parseFloat(maxPrice) : null
    );

    res.json({
      success: true,
      count: accommodations.length,
      data: accommodations,
    });
  } catch (error) {
    console.error('Accommodation search error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * Get accommodation deals
 * POST /api/accommodation/deals
 */
router.post('/deals', async (req, res) => {
  try {
    const { location, checkIn, checkOut, guests, maxBudget } = req.body;

    if (!location || !checkIn || !checkOut) {
      return res.status(400).json({
        error: 'Missing required fields: location, checkIn, and checkOut are required',
      });
    }

    const deals = await accommodationService.getDeals(
      location,
      checkIn,
      checkOut,
      guests || 2,
      maxBudget || 200
    );

    res.json({
      success: true,
      count: deals.length,
      data: deals,
    });
  } catch (error) {
    console.error('Accommodation deals error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
