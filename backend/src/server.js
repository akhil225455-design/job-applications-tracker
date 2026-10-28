import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import applicationsRouter from './routes/applications.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Job Application Tracker API is running.', data: { status: 'ok' } }));
app.use('/api/applications', applicationsRouter);
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
try {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing. Add your MongoDB Atlas connection string to backend/.env.');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
} catch (err) {
  console.error(`Startup failed: ${err.message}`);
  process.exit(1);
}
