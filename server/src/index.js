require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const registerSocketHandlers = require('./socket');

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true }
});

// Make io available to controllers (e.g. to push chat messages from REST calls)
app.set('io', io);

// --- Security & parsing middleware ---
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '5mb' })); // signature data URLs can be large
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { success: false, message: 'Too many auth attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
  })
);

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/collaborations', require('./routes/collaborations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/payments', require('./routes/payments'));

// Uploaded files are served through the authenticated download endpoint,
// not statically, so access control stays in one place.
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    // The in-memory dev database starts empty on every boot - seed it so
    // the demo accounts and sample data are always available.
    if (!process.env.MONGODB_URI && process.env.NODE_ENV !== 'production') {
      const seedDatabase = require('./seedData');
      await seedDatabase();
    }
    server.listen(PORT, () => {
      console.log(`Nexus API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });

module.exports = { app, server };
