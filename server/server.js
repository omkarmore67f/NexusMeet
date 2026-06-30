require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/error.middleware');

// Route files
const authRoutes = require('./routes/auth.routes');
const meetingRoutes = require('./routes/meeting.routes');
const messageRoutes = require('./routes/message.routes');
const userRoutes = require('./routes/user.routes');
const fileRoutes = require('./routes/file.routes');
const adminRoutes = require('./routes/admin.routes');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Enable Socket.io with robust CORS options
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [
  clientUrl,
  clientUrl.endsWith('/') ? clientUrl.slice(0, -1) : clientUrl + '/'
];

const io = socketio(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware configuration
app.use(
  helmet({
    contentSecurityPolicy: false, // Turn off for easier dynamic WebRTC connections locally
    crossOriginEmbedderPolicy: false
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const normOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      const normClient = clientUrl.endsWith('/') ? clientUrl.slice(0, -1) : clientUrl;
      if (normOrigin === normClient || normOrigin === 'http://localhost:5173') {
        return callback(null, origin);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Expose uploaded files directory statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting on standard APIs
app.use('/api', apiLimiter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);

// Healthy check route
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'Server is healthy', timestamp: new Date() });
});

// Register Sockets logic
require('./sockets/meeting.socket')(io);

// Error Handling Middleware (must be after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[NexusMeet Server] Running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = server; // Export for testing
