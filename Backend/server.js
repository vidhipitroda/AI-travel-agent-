import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import flightRoutes from './routes/flightRoutes.js';
import accommodationRoutes from './routes/accommodationRoutes.js';
import tripPlannerRoutes from './routes/tripPlannerRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/flights', flightRoutes);
app.use('/api/accommodation', accommodationRoutes);
app.use('/api/trip-planner', tripPlannerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Travel Agent API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Travel Agent server running on port ${PORT}`);
});
