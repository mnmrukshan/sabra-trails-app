const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Gallery = require('../models/Gallery');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

let storage;
let isCloudinaryConfigured = false;

// Configure Cloudinary if credentials exist in .env
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'sabratrails_gallery',
      allowed_formats: ['jpg', 'png', 'jpeg'],
      public_id: (req, file) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        return `gallery-${uniqueSuffix}`;
      }
    },
  });
  isCloudinaryConfigured = true;
  console.log('Multer configured to upload directly to Cloudinary.');
} else {
  // Local disk fallback
  const localUploadDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, localUploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  console.log('Cloudinary credentials missing in .env. Multer configured to save uploads locally at public/uploads/.');
}

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET /api/gallery - Fetch all community photos (newest first)
router.get('/', async (req, res) => {
  try {
    const photos = await Gallery.find().sort({ createdAt: -1 });
    res.json(photos);
  } catch (error) {
    console.error('Error fetching gallery photos:', error);
    res.status(500).json({ error: 'Server error while fetching gallery feed' });
  }
});

// POST /api/gallery - Upload a photo to community feed
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, location, category } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image file' });
    }
    
    if (!title || !location || !category) {
      // Clean up uploaded local file if validation fails
      if (!isCloudinaryConfigured && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.error('Failed to clean up file:', e.message);
        }
      }
      return res.status(400).json({ error: 'Title, location, and category are required' });
    }

    // Determine URL path
    let imageUrl = '';
    if (isCloudinaryConfigured) {
      imageUrl = req.file.path || req.file.secure_url;
    } else {
      // In local mode, store relative URL e.g. /uploads/gallery-xxxx.jpg
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const newPhoto = new Gallery({
      image: imageUrl,
      title: title.trim(),
      location: location.trim(),
      category: category.trim(),
      userEmail: req.user.email,
      userName: req.user.name
    });

    await newPhoto.save();
    console.log(`User "${req.user.name}" uploaded a new photo: "${title}"`);
    res.status(201).json(newPhoto);
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Server error while uploading photo' });
  }
});

// DELETE /api/gallery/:id - Delete user-owned photo
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Check ownership
    if (photo.userEmail !== req.user.email) {
      return res.status(403).json({ error: 'Unauthorized to delete this photo' });
    }

    // Clean up media file from storage
    if (photo.image.startsWith('/uploads/')) {
      const filename = photo.image.replace('/uploads/', '');
      const localFilePath = path.join(__dirname, '../public/uploads', filename);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (e) {
          console.error('Failed to delete local file:', e.message);
        }
      }
    } else if (photo.image.includes('cloudinary.com')) {
      // Extract public_id from Cloudinary URL and delete
      try {
        const urlParts = photo.image.split('/');
        const fileWithExtension = urlParts[urlParts.length - 1];
        const publicId = `sabratrails_gallery/${fileWithExtension.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryErr) {
        console.error('Failed to delete image from Cloudinary:', cloudinaryErr);
      }
    }

    await Gallery.findByIdAndDelete(req.params.id);
    console.log(`Deleted photo "${photo.title}" (ID: ${photo._id})`);
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Server error while deleting photo' });
  }
});

module.exports = router;
