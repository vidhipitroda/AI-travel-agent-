import dotenv from 'dotenv';

dotenv.config();

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview',
  },
  amadeus: {
    apiKey: process.env.AMADEUS_API_KEY,
    apiSecret: process.env.AMADEUS_API_SECRET,
    baseUrl: 'https://test.api.amadeus.com',
  },
  airbnb: {
    apiKey: process.env.AIRBNB_API_KEY,
  },
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
};
