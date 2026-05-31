const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Adventure = require('../models/Adventure');
const Trail = require('../models/Trail');

// Haversine formula helper to calculate distance between two coordinates in kilometers
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// GET /api/adventures/active - Retrieve current user's active adventure (if any)
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const activeAdventure = await Adventure.findOne({
      userId: req.user._id,
      status: 'active'
    }).populate('trailId');

    if (!activeAdventure) {
      return res.status(200).json({ active: false, adventure: null });
    }

    res.json({ active: true, adventure: activeAdventure });
  } catch (error) {
    console.error('Error fetching active adventure:', error);
    res.status(500).json({ error: 'Server error while fetching active adventure' });
  }
});

// POST /api/adventures/start - Start a new adventure
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { trailId, initialLocation } = req.body;
    if (!trailId) {
      return res.status(400).json({ error: 'Trail ID (slug) is required' });
    }

    // Verify trail exists
    const trail = await Trail.findById(trailId);
    if (!trail) {
      return res.status(404).json({ error: 'Trail not found' });
    }

    // Check if user already has an active adventure
    let activeAdventure = await Adventure.findOne({
      userId: req.user._id,
      status: 'active'
    });

    if (activeAdventure) {
      // Return the existing active adventure
      console.log(`User "${req.user.name}" already has an active adventure for trail: ${activeAdventure.trailId}`);
      return res.json({
        message: 'Resuming existing active adventure',
        adventure: activeAdventure,
        resumed: true
      });
    }

    // Create new adventure
    const pathPoints = [];
    if (initialLocation && initialLocation.latitude && initialLocation.longitude) {
      pathPoints.push({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        timestamp: new Date()
      });
    }

    activeAdventure = new Adventure({
      userId: req.user._id,
      trailId: trailId,
      status: 'active',
      startTime: new Date(),
      path: pathPoints,
      currentCoordinates: initialLocation || null,
      stats: {
        distance: 0,
        duration: 0,
        avgSpeed: 0,
        maxElevation: 0
      }
    });

    await activeAdventure.save();
    console.log(`User "${req.user.name}" started a new hike on trail: "${trail.name}"`);
    res.status(201).json({
      message: 'Adventure started successfully',
      adventure: activeAdventure,
      resumed: false
    });
  } catch (error) {
    console.error('Error starting adventure:', error);
    res.status(500).json({ error: 'Server error while starting adventure' });
  }
});

// POST /api/adventures/track - Record location updates (breadcrumbs) for active adventure
router.post('/track', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude, elevation } = req.body;
    
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude coordinates are required' });
    }

    // Find the active adventure
    const adventure = await Adventure.findOne({
      userId: req.user._id,
      status: 'active'
    });

    if (!adventure) {
      return res.status(404).json({ error: 'No active adventure found to track' });
    }

    // Calculate incremental distance if there is a previous point
    let distanceIncrement = 0;
    const newPoint = {
      latitude,
      longitude,
      timestamp: new Date()
    };

    if (adventure.path.length > 0) {
      const lastPoint = adventure.path[adventure.path.length - 1];
      distanceIncrement = calculateHaversineDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        latitude,
        longitude
      );
    }

    // Append to path and update current position
    adventure.path.push(newPoint);
    adventure.currentCoordinates = { latitude, longitude };

    // Update stats
    adventure.stats.distance = (adventure.stats.distance || 0) + distanceIncrement;
    
    // Duration in minutes
    const now = new Date();
    const durationMin = Math.max(1, Math.round((now - adventure.startTime) / 60000));
    adventure.stats.duration = durationMin;
    
    // Speed in km/h
    adventure.stats.avgSpeed = parseFloat((adventure.stats.distance / (durationMin / 60)).toFixed(2));
    
    // Elevation tracker
    if (elevation && elevation > (adventure.stats.maxElevation || 0)) {
      adventure.stats.maxElevation = elevation;
    }

    await adventure.save();
    res.json({
      message: 'Location tracked successfully',
      stats: adventure.stats,
      pointsCount: adventure.path.length
    });
  } catch (error) {
    console.error('Error tracking adventure:', error);
    res.status(500).json({ error: 'Server error while tracking adventure' });
  }
});

// POST /api/adventures/end - Complete active adventure and save stats
router.post('/end', authMiddleware, async (req, res) => {
  try {
    const { finalStats } = req.body;

    const adventure = await Adventure.findOne({
      userId: req.user._id,
      status: 'active'
    });

    if (!adventure) {
      return res.status(404).json({ error: 'No active adventure found to end' });
    }

    adventure.status = 'completed';
    adventure.endTime = new Date();

    // Use stats sent from the frontend if provided (often more accurate due to background sensor polling),
    // otherwise fall back to server calculated values
    if (finalStats) {
      adventure.stats = {
        distance: finalStats.distance !== undefined ? finalStats.distance : adventure.stats.distance,
        duration: finalStats.duration !== undefined ? finalStats.duration : adventure.stats.duration,
        avgSpeed: finalStats.avgSpeed !== undefined ? finalStats.avgSpeed : adventure.stats.avgSpeed,
        maxElevation: finalStats.maxElevation !== undefined ? finalStats.maxElevation : adventure.stats.maxElevation
      };
    } else {
      // Calculate final duration on server
      const finalDuration = Math.max(1, Math.round((adventure.endTime - adventure.startTime) / 60000));
      adventure.stats.duration = finalDuration;
      adventure.stats.avgSpeed = parseFloat((adventure.stats.distance / (finalDuration / 60)).toFixed(2));
    }

    await adventure.save();
    console.log(`User "${req.user.name}" completed their hike (ID: ${adventure._id}). Distance: ${adventure.stats.distance}km`);
    res.json({
      message: 'Adventure completed successfully',
      adventure
    });
  } catch (error) {
    console.error('Error ending adventure:', error);
    res.status(500).json({ error: 'Server error while ending adventure' });
  }
});

// GET /api/adventures/history - Retrieve list of completed hikes for user
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await Adventure.find({
      userId: req.user._id,
      status: 'completed'
    })
    .populate('trailId')
    .sort({ endTime: -1 });

    res.json(history);
  } catch (error) {
    console.error('Error fetching adventure history:', error);
    res.status(500).json({ error: 'Server error while fetching adventure history' });
  }
});

module.exports = router;
