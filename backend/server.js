const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static images and uploads
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const authMiddleware = require('./middleware/auth');
const trailsRouter = require('./routes/trails');
const usersRouter = require('./routes/users');
const galleryRouter = require('./routes/gallery');
const chatRouter = require('./routes/chat');
const adventuresRouter = require('./routes/adventures');

// Basic test route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Secure test route
app.get('/api/auth/test', authMiddleware, (req, res) => {
  res.json({
    message: 'Authentication successful!',
    user: req.user
  });
});

// Expose trails, users, gallery, chat, and adventures routers
app.use('/api/trails', trailsRouter);
app.use('/api/users', usersRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/chat', chatRouter);
app.use('/api/adventures', adventuresRouter);

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
if (mongoURI) {
  mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB Connection Error:', err));
} else {
  console.warn('Warning: MONGO_URI is not defined in the environment variables. Database features will be unavailable.');
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
