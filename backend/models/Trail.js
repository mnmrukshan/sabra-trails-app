const mongoose = require('mongoose');

const CoordinateSchema = new mongoose.Schema({
  lat: { type: Number },
  lon: { type: Number }
}, { _id: false });

const TrailSchema = new mongoose.Schema({
  _id: {
    type: String, // Use the trail's slug id (e.g. 'hirikatuoya') as the primary key
    required: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Moderate', 'Hard'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  elevation: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  climate: {
    type: String,
    required: true
  },
  hiddenGem: {
    type: Boolean,
    default: false
  },
  image: {
    type: String, // Relative URL e.g. '/images/hirikatuoya.jpeg' or remote URL
    required: true
  },
  images: [{
    type: String
  }],
  safetyTips: {
    type: [String],
    default: []
  },
  coordinates: {
    type: CoordinateSchema
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Trail', TrailSchema);
