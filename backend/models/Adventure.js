const mongoose = require('mongoose');

const CoordinateSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const AdventureSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trailId: {
    type: String, // References Trail._id slug (e.g. 'hirikatuoya')
    ref: 'Trail',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  path: [CoordinateSchema], // Array of coordinates representing the tracked trail path
  currentCoordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  stats: {
    distance: { type: Number, default: 0 }, // Distance in kilometers
    duration: { type: Number, default: 0 }, // Duration in minutes
    avgSpeed: { type: Number, default: 0 }, // Average speed in km/h
    maxElevation: { type: Number, default: 0 } // Max elevation in meters
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Adventure', AdventureSchema);
