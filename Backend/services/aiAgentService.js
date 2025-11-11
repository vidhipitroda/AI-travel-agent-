import OpenAI from 'openai';
import { config } from '../config/apiConfig.js';
import flightService from './flightService.js';
import accommodationService from './accommodationService.js';

class AIAgentService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Plan a complete trip within a given budget
   */
  async planTrip(params) {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      budget,
      passengers = 1,
      preferences = {},
    } = params;

    try {
      // 1. Search for flights within budget
      const allFlights = await flightService.searchFlights(
        origin,
        destination,
        departureDate,
        returnDate,
        passengers
      );

      // Filter flights to leave budget for accommodation
      const maxFlightBudget = budget * 0.6; // Allocate 60% for flights
      const affordableFlights = allFlights
        .filter(flight => parseFloat(flight.price.total) * passengers <= maxFlightBudget)
        .slice(0, 10);

      if (affordableFlights.length === 0) {
        return {
          success: false,
          message: 'No flights found within budget. Consider increasing your budget or changing dates.',
        };
      }

      // 2. Calculate remaining budget for accommodation
      const cheapestFlight = affordableFlights[0];
      const flightCost = parseFloat(cheapestFlight.price.total) * passengers;
      const accommodationBudget = budget - flightCost;

      // Calculate number of nights
      const checkIn = new Date(departureDate);
      const checkOut = new Date(returnDate || departureDate);
      const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
      const maxNightlyRate = accommodationBudget / nights;

      // 3. Search for accommodations
      const accommodations = await accommodationService.searchAccommodations(
        destination,
        departureDate,
        returnDate || departureDate,
        passengers,
        maxNightlyRate
      );

      // 4. Use AI to create personalized recommendations
      const aiRecommendation = await this.generateRecommendations({
        flights: affordableFlights.slice(0, 3),
        accommodations: accommodations.slice(0, 5),
        budget,
        flightCost,
        accommodationBudget,
        nights,
        preferences,
        destination,
      });

      return {
        success: true,
        budget: {
          total: budget,
          flights: flightCost,
          accommodation: accommodationBudget,
          estimated: flightCost + (accommodations[0]?.price.rate || 0) * nights,
        },
        flights: affordableFlights.slice(0, 3),
        accommodations: accommodations.slice(0, 5),
        aiRecommendation,
        nights,
      };
    } catch (error) {
      console.error('Trip planning error:', error);
      throw new Error(`Failed to plan trip: ${error.message}`);
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  async generateRecommendations(data) {
    try {
      const prompt = `As an expert travel advisor, analyze this trip data and provide personalized recommendations:

Budget: $${data.budget}
Destination: ${data.destination}
Number of nights: ${data.nights}
Flight cost: $${data.flightCost}
Remaining for accommodation: $${data.accommodationBudget}

Available Flights: ${data.flights.length}
Available Accommodations: ${data.accommodations.length}

User Preferences: ${JSON.stringify(data.preferences)}

Please provide:
1. Best flight and accommodation combination for value
2. Budget breakdown recommendations
3. Tips for saving money
4. What to do with any remaining budget
5. Alternative suggestions if budget is tight

Keep the response concise and practical.`;

      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional travel advisor helping users plan budget-friendly trips.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('AI recommendation error:', error);
      return 'Unable to generate AI recommendations at this time. Please review the available options above.';
    }
  }

  /**
   * Chat with AI agent about travel queries
   */
  async chat(message, context = {}) {
    try {
      const systemPrompt = `You are an AI travel agent assistant. Help users find:
- Flight deals and last-minute offers
- Accommodation options on Airbnb
- Complete trip planning within their budget
- Travel tips and recommendations

Be concise, helpful, and ask clarifying questions when needed.`;

      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('AI chat error:', error);
      throw new Error(`Failed to process chat: ${error.message}`);
    }
  }
}

export default new AIAgentService();
