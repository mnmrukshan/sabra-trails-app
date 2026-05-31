const express = require('express');
const router = express.Router();
const Trail = require('../models/Trail');

// GET /api/trails - Fetch all trails with optional search & filters
router.get('/', async (req, res) => {
  try {
    const { search, difficulty, hiddenGem, category } = req.query;
    let query = {};

    // 1. Search filter (matches name, location, or description case-insensitively)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 2. Difficulty filter
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // 3. Hidden Gem filter
    if (hiddenGem !== undefined) {
      query.hiddenGem = hiddenGem === 'true';
    }

    // 4. Fetch matching trails from MongoDB
    let trails = await Trail.find(query);

    // 5. Category filter matching frontend gallery logic
    if (category) {
      trails = trails.filter(trail => {
        const name = trail.name.toLowerCase();
        const desc = trail.description.toLowerCase();
        
        if (category === 'Waterfalls & Rivers') {
          return (
            name.includes('falls') || 
            name.includes('waterfall') || 
            name.includes('ella') || 
            name.includes('lake') || 
            name.includes('pond') || 
            name.includes('pokuna') || 
            name.includes('reservoir') || 
            name.includes('wewa') ||
            name.includes('hirikatuoya') ||
            desc.includes('stream') ||
            desc.includes('cascade') ||
            desc.includes('plunge pool')
          );
        }
        
        if (category === 'Estates & Forests') {
          return (
            name.includes('estate') ||
            name.includes('sanctuary') ||
            name.includes('forest') ||
            name.includes('bungalow') ||
            name.includes('bridge') ||
            name.includes('route') ||
            name.includes('park') ||
            name.includes('station') ||
            name.includes('path') ||
            name.includes('adisham') ||
            name.includes('plains') ||
            name.includes('plain') ||
            desc.includes('plantation') ||
            desc.includes('sanctuary') ||
            desc.includes('monastery') ||
            desc.includes('railway station')
          );
        }
        
        if (category === 'Peaks & Viewpoints') {
          const isWaterfall = (
            name.includes('falls') || name.includes('waterfall') || name.includes('ella') || 
            name.includes('lake') || name.includes('pond') || name.includes('pokuna') || 
            name.includes('reservoir') || name.includes('wewa') || name.includes('hirikatuoya') ||
            desc.includes('stream') || desc.includes('cascade') || desc.includes('plunge pool')
          );
          const isEstate = (
            name.includes('estate') || name.includes('sanctuary') || name.includes('forest') ||
            name.includes('bungalow') || name.includes('bridge') || name.includes('route') ||
            name.includes('park') || name.includes('station') || name.includes('path') ||
            name.includes('adisham') || name.includes('plains') || name.includes('plain') ||
            desc.includes('plantation') || desc.includes('sanctuary') || desc.includes('monastery') ||
            desc.includes('railway station')
          );
          return !isWaterfall && !isEstate;
        }
        return true;
      });
    }

    res.json(trails);
  } catch (error) {
    console.error('Error fetching trails:', error);
    res.status(500).json({ error: 'Server error while fetching trails' });
  }
});

// GET /api/trails/:id - Fetch single trail details by slug id
router.get('/:id', async (req, res) => {
  try {
    const trail = await Trail.findById(req.params.id);
    if (!trail) {
      return res.status(404).json({ error: 'Trail not found' });
    }
    res.json(trail);
  } catch (error) {
    console.error('Error fetching trail detail:', error);
    res.status(500).json({ error: 'Server error while fetching trail details' });
  }
});

module.exports = router;
