import axios from 'axios';
import { config } from '../config/apiConfig.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 });

class AccommodationService {
  constructor() {
    this.baseUrl = 'https://airbnb13.p.rapidapi.com';
    this.headers = {
      'X-RapidAPI-Key': config.airbnb.apiKey,
      'X-RapidAPI-Host': 'airbnb13.p.rapidapi.com',
    };
  }

  /**
   * Search for Airbnb accommodations
   */
  async searchAccommodations(location, checkIn, checkOut, guests = 2, maxPrice = null) {
    const cacheKey = `accommodation_${location}_${checkIn}_${checkOut}_${guests}_${maxPrice}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // First, get location ID
      const searchResponse = await axios.get(`${this.baseUrl}/search-location`, {
        headers: this.headers,
        params: { location },
      });

      if (!searchResponse.data || searchResponse.data.length === 0) {
        throw new Error('Location not found');
      }

      const locationId = searchResponse.data[0].id;

      // Search for properties
      const listingsResponse = await axios.get(`${this.baseUrl}/search-listings`, {
        headers: this.headers,
        params: {
          locationId,
          checkIn,
          checkOut,
          guests,
          currency: 'USD',
        },
      });

      let results = listingsResponse.data.results || [];

      // Filter by price if maxPrice is provided
      if (maxPrice) {
        results = results.filter(listing => {
          const price = parseFloat(listing.price?.rate || 0);
          return price <= maxPrice;
        });
      }

      // Format results
      const formattedResults = results.map(listing => ({
        id: listing.id,
        name: listing.name,
        type: listing.type,
        price: {
          rate: listing.price?.rate,
          total: listing.price?.total,
          currency: listing.price?.currency || 'USD',
        },
        rating: listing.rating,
        reviewsCount: listing.reviewsCount,
        images: listing.images || [],
        location: {
          city: listing.city,
          country: listing.country,
        },
        amenities: listing.amenities || [],
        beds: listing.beds,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        url: listing.url,
      }));

      cache.set(cacheKey, formattedResults);
      return formattedResults;
    } catch (error) {
      console.error('Accommodation search error:', error.message);
      
      // Return mock data for development if API fails
      return this.getMockAccommodations(location, maxPrice);
    }
  }

  /**
   * Get accommodation deals (sorted by best value)
   */
  async getDeals(location, checkIn, checkOut, guests = 2, maxBudget = 200) {
    try {
      const accommodations = await this.searchAccommodations(location, checkIn, checkOut, guests, maxBudget);

      // Sort by best value (rating/price ratio)
      return accommodations
        .map(acc => ({
          ...acc,
          valueScore: acc.rating ? (acc.rating / parseFloat(acc.price?.rate || 100)) * 100 : 0,
        }))
        .sort((a, b) => b.valueScore - a.valueScore)
        .slice(0, 20);
    } catch (error) {
      console.error('Deals search error:', error);
      throw new Error(`Failed to get accommodation deals: ${error.message}`);
    }
  }

  /**
   * Mock data for development
   */
  getMockAccommodations(location, maxPrice = null) {
    const mockData = [
      {
        id: '1',
        name: 'Cozy Downtown Apartment',
        type: 'Entire apartment',
        price: { rate: 85, total: 595, currency: 'USD' },
        rating: 4.8,
        reviewsCount: 124,
        images: ['https://via.placeholder.com/400x300'],
        location: { city: location, country: 'US' },
        amenities: ['WiFi', 'Kitchen', 'Air conditioning'],
        beds: 2,
        bedrooms: 1,
        bathrooms: 1,
        url: 'https://airbnb.com/example',
      },
      {
        id: '2',
        name: 'Modern Studio with City View',
        type: 'Studio',
        price: { rate: 120, total: 840, currency: 'USD' },
        rating: 4.9,
        reviewsCount: 89,
        images: ['https://via.placeholder.com/400x300'],
        location: { city: location, country: 'US' },
        amenities: ['WiFi', 'Gym', 'Pool'],
        beds: 1,
        bedrooms: 1,
        bathrooms: 1,
        url: 'https://airbnb.com/example',
      },
    ];

    if (maxPrice) {
      return mockData.filter(acc => acc.price.rate <= maxPrice);
    }

    return mockData;
  }
}

export default new AccommodationService();
