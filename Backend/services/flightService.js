import Amadeus from 'amadeus';
import { config } from '../config/apiConfig.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

class FlightService {
  constructor() {
    this.amadeus = new Amadeus({
      clientId: config.amadeus.apiKey,
      clientSecret: config.amadeus.apiSecret,
    });
  }

  /**
   * Search for flights based on origin, destination, and date
   */
  async searchFlights(origin, destination, departureDate, returnDate = null, passengers = 1) {
    const cacheKey = `flights_${origin}_${destination}_${departureDate}_${returnDate}_${passengers}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const searchParams = {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departureDate,
        adults: passengers,
        max: 50,
      };

      if (returnDate) {
        searchParams.returnDate = returnDate;
      }

      const response = await this.amadeus.shopping.flightOffersSearch.get(searchParams);
      
      const results = response.data.map(offer => ({
        id: offer.id,
        price: {
          total: offer.price.total,
          currency: offer.price.currency,
        },
        itineraries: offer.itineraries.map(itinerary => ({
          duration: itinerary.duration,
          segments: itinerary.segments.map(segment => ({
            departure: {
              airport: segment.departure.iataCode,
              time: segment.departure.at,
            },
            arrival: {
              airport: segment.arrival.iataCode,
              time: segment.arrival.at,
            },
            carrier: segment.carrierCode,
            flightNumber: segment.number,
            duration: segment.duration,
          })),
        })),
        numberOfBookableSeats: offer.numberOfBookableSeats,
      }));

      cache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Flight search error:', error);
      throw new Error(`Failed to search flights: ${error.message}`);
    }
  }

  /**
   * Get last-minute flight deals
   */
  async getLastMinuteDeals(origin, maxPrice = 500) {
    try {
      // Get current date and date 7 days from now
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const departureDate = today.toISOString().split('T')[0];
      
      // Search for flights in the next 7 days
      const response = await this.amadeus.shopping.flightDestinations.get({
        origin: origin,
        maxPrice: maxPrice,
        departureDate: departureDate,
      });

      return response.data.map(deal => ({
        destination: deal.destination,
        departureDate: deal.departureDate,
        returnDate: deal.returnDate,
        price: {
          total: deal.price.total,
          currency: 'USD',
        },
        type: deal.type,
      }));
    } catch (error) {
      console.error('Last-minute deals error:', error);
      throw new Error(`Failed to get last-minute deals: ${error.message}`);
    }
  }

  /**
   * Get flight offers by price for specific destination
   */
  async getFlightsByPrice(origin, destination, maxPrice, departureDate) {
    try {
      const allFlights = await this.searchFlights(origin, destination, departureDate);
      
      return allFlights
        .filter(flight => parseFloat(flight.price.total) <= maxPrice)
        .sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total));
    } catch (error) {
      console.error('Flights by price error:', error);
      throw new Error(`Failed to get flights by price: ${error.message}`);
    }
  }
}

export default new FlightService();
