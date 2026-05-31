const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  asgardeoId: {
    type: String,
    required: true,
    unique: true, // Maps to the token's "sub" claim
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  savedTrails: [{
    type: String, // Storing trail slug IDs e.g. 'hirikatuoya', 'wangedigala'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
