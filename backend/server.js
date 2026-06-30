const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========================== 
// CORS Configuration (FIXED)
// ==========================

const corsOptions = {
    origin: [
        'http://localhost:5500',  // Live Server default
        'http://localhost:5502',
        'http://localhost:3000',  // React default
        'http://127.0.0.1:5500',  // Alternative localhost
        'http://127.0.0.1:5502',  // ← ADD THIS LINE
        'http://127.0.0.1:3000',
        `http://localhost:${PORT}` // Same port as server
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'x-auth-token']
};

// Apply CORS middleware ONCE with proper options
app.use(cors(corsOptions));

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            frameSrc: ["'self'", "https://www.youtube.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:5000"]
        }
    }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger for development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
        console.log('Origin:', req.get('Origin'));
        console.log('User-Agent:', req.get('User-Agent'));
        next();
    });
}

// ==========================
// Database Connection
// ==========================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindcare_db';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// ==========================
// Serve Static Frontend Files
// ==========================

const FRONTEND_PATH = path.join(__dirname, '..', 'frontend', 'public');
app.use(express.static(FRONTEND_PATH));

// ==========================
// API Routes
// ==========================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/assessment', require('./routes/assessment'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/therapists', require('./routes/therapist')); 
// ==========================
// HTML Page Routes
// ==========================

app.get('/', (req, res) => {
    res.sendFile('Home.html', { root: FRONTEND_PATH });
});

app.get('/signup.html', (req, res) => {
    res.sendFile('signup.html', { root: FRONTEND_PATH });
});

app.get('/login.html', (req, res) => {
    res.sendFile('Login.html', { root: FRONTEND_PATH });
});
app.get('/peer-support-blog.html', (req, res) => {
    res.sendFile('community.html', { root: FRONTEND_PATH });
});
app.get('/add-experience.html', (req, res) => {
    res.sendFile('addexperience.html', { root: FRONTEND_PATH });
});
// ==========================
// Health Check Route
// ==========================

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        cors: 'enabled',
        allowedOrigins: corsOptions.origin
    });
});

// ==========================
// CORS Testing Route
// ==========================

app.get('/api/cors-test', (req, res) => {
    res.json({
        success: true,
        message: 'CORS is working!',
        origin: req.get('Origin'),
        headers: req.headers
    });
});

// ==========================
// Catch-all for SPA / 404s
// ==========================

app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    } else {
        // Serve the main HTML file for SPA routing
        res.sendFile('signup.html', { root: FRONTEND_PATH });
    }
});

// ==========================
// Global Error Handler
// ==========================

app.use((err, req, res, next) => {
    console.error('🚨 Server Error:', err.stack || err.message);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Something broke!'
    });
});

// ==========================
// Start Server
// ==========================

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📝 Visit http://localhost:${PORT} to view your app`);
    console.log(`🔗 API endpoints available at http://localhost:${PORT}/api/`);
    console.log(`🌐 CORS enabled for origins:`, corsOptions.origin);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🧪 Test CORS: http://localhost:${PORT}/api/cors-test\n`);
});