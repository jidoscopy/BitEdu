import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import userRoutes from './routes/users.js';
import certificationRoutes from './routes/certifications.js';
import analyticsRoutes from './routes/analytics.js';
import stacksRoutes from './routes/stacks.js';

import { errorHandler } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bitedu', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

console.log('Connected to MongoDB');

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/certifications', authenticateToken, certificationRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/stacks', stacksRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'BitEdu Backend API',
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`BitEdu Backend running on port ${PORT}`);
});