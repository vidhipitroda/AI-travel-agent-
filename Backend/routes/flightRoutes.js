import express from 'express';
import flightService from '../services/flightService.js';

const router = express.Router();

/**
 * Search for flights
 * POST /api/flights/search
 */
router.post('/search', async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, passengers } = req.body;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        error: 'Missing required fields: origin, destination, and departureDate are required',
      });
    }

    const flights = await flightService.searchFlights(
      origin,
      destination,
      departureDate,
      returnDate,
      passengers || 1
    );

    res.json({
      success: true,
      count: flights.length,
      data: flights,
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * Get last-minute deals
 * GET /api/flights/last-minute-deals
 */
router.get('/last-minute-deals', async (req, res) => {
  try {
    const { origin, maxPrice } = req.query;

    if (!origin) {
      return res.status(400).json({
        error: 'Origin airport code is required',
      });
    }

    const deals = await flightService.getLastMinuteDeals(
      origin,
      maxPrice ? parseInt(maxPrice) : 500
    );

    res.json({
      success: true,
      count: deals.length,
      data: deals,
    });
  } catch (error) {
    console.error('Last-minute deals error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * Get flights by price
 * POST /api/flights/by-price
 */
router.post('/by-price', async (req, res) => {
  try {
    const { origin, destination, departureDate, maxPrice } = req.body;

    if (!origin || !destination || !departureDate || !maxPrice) {
      return res.status(400).json({
        error: 'Missing required fields: origin, destination, departureDate, and maxPrice are required',
      });
    }

    const flights = await flightService.getFlightsByPrice(
      origin,
      destination,
      parseFloat(maxPrice),
      departureDate
    );

    res.json({
      success: true,
      count: flights.length,
      data: flights,
    });
  } catch (error) {
    console.error('Flights by price error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
