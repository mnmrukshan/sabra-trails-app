const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Trail = require('../models/Trail');

const Gallery = require('../models/Gallery');

// GET /api/users/profile - Get current user profile (with bookmarked trails populated and stats)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Fetch full detail objects of all saved trails
    const bookmarkedTrails = await Trail.find({ _id: { $in: user.savedTrails } });

    // Aggregate counts for profile stats
    const totalBookmarked = user.savedTrails.length;
    const totalPhotos = await Gallery.countDocuments({ userEmail: user.email || '' });

    res.json({
      _id: user._id,
      asgardeoId: user.asgardeoId,
      name: user.name,
      email: user.email,
      savedTrails: user.savedTrails, // Array of trail slug IDs
      bookmarkedTrailsDetails: bookmarkedTrails, // Full trail objects
      createdAt: user.createdAt,
      stats: {
        totalBookmarked,
        totalPhotos
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error while fetching user profile' });
  }
});

// POST /api/users/bookmarks/toggle - Toggle save/bookmark for a trail
router.post('/bookmarks/toggle', authMiddleware, async (req, res) => {
  try {
    const { trailId } = req.body;
    if (!trailId) {
      return res.status(400).json({ error: 'Trail ID (slug) is required' });
    }

    // Verify trail exists in the database
    const trail = await Trail.findById(trailId);
    if (!trail) {
      return res.status(404).json({ error: 'Trail not found' });
    }

    const user = await User.findById(req.user._id);
    const index = user.savedTrails.indexOf(trailId);

    let isBookmarked = false;
    if (index > -1) {
      // Remove from bookmarks
      user.savedTrails.splice(index, 1);
      isBookmarked = false;
      console.log(`User "${user.name}" removed trail "${trailId}" from bookmarks`);
    } else {
      // Add to bookmarks
      user.savedTrails.push(trailId);
      isBookmarked = true;
      console.log(`User "${user.name}" added trail "${trailId}" to bookmarks`);
    }

    await user.save();

    res.json({
      message: isBookmarked ? 'Trail bookmarked successfully' : 'Trail removed from bookmarks',
      isBookmarked,
      savedTrails: user.savedTrails
    });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ error: 'Server error while updating bookmarks' });
  }
});

// DELETE /api/users/account - Delete current authenticated user's account and data
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Delete user from MongoDB User collection
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Delete user's adventure tracking sessions if any
    const Adventure = require('../models/Adventure');
    await Adventure.deleteMany({ user: userId });

    console.log(`User "${deletedUser.name}" (${deletedUser.email}) account deleted successfully.`);

    // 3. Respond success
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Server error while deleting user account' });
  }
});

module.exports = router;
