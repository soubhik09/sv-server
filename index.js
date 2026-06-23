import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';
import errorMiddleware from './middleware/errorMiddleware.js';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import invoiceRoutes from './routes/invoices.js';
import reportRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';

dotenv.config();

const app = express();

// Logger
app.use(morgan(':method :url :status :response-time ms - :date[iso]'));

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

connectDB();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Siddhi Vinayak Enterprise API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
