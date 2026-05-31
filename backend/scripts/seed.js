const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Trail = require('../models/Trail');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
  // 1. Copy images recursively from frontend/assets/images to backend/public/images
  const srcDir = path.join(__dirname, '../../frontend/assets/images');
  const destDir = path.join(__dirname, '../public/images');
  
  console.log('Copying images from frontend assets to backend public/images folder...');
  if (fs.existsSync(srcDir)) {
    copyDirectoryRecursive(srcDir, destDir);
    console.log('Images copied successfully.');
  } else {
    console.warn(`Warning: Source image directory not found at ${srcDir}. Skipping image copy.`);
  }

  // 2. Read and parse trailData.ts
  const trailDataPath = path.join(__dirname, '../../frontend/src/utils/trailData.ts');
  if (!fs.existsSync(trailDataPath)) {
    throw new Error(`Trail data not found at ${trailDataPath}`);
  }

  console.log('Reading and parsing trailData.ts...');
  let content = fs.readFileSync(trailDataPath, 'utf8');

  // Replace ES module export with CommonJS export
  content = content.replace('export const TRAILS =', 'module.exports =');

  // Replace require('@/assets/images/...') with relative URL strings "/images/..."
  content = content.replace(/require\(['"]@\/assets\/images\/(.*?)['"]\)/g, '"/images/$1"');

  // Write a temporary file
  const tempFile = path.join(__dirname, 'tempTrailData.js');
  fs.writeFileSync(tempFile, content, 'utf8');

  // Require the temp file to get the array
  const trails = require(tempFile);

  // Delete the temp file
  fs.unlinkSync(tempFile);

  console.log(`Successfully parsed ${trails.length} trails.`);

  // 3. Connect to MongoDB Atlas and seed
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error('MONGO_URI is not defined in your backend/.env file.');
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoURI);
  console.log('Connected successfully.');

  console.log('Clearing existing trails from collection...');
  await Trail.deleteMany({});
  console.log('Collection cleared.');

  console.log('Mapping and seeding trails...');
  const trailsToInsert = trails.map(trail => {
    const { id, ...rest } = trail;
    return {
      _id: id,
      ...rest
    };
  });

  const result = await Trail.insertMany(trailsToInsert);
  console.log(`Seeded ${result.length} trails successfully into MongoDB!`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

// Helper function to copy directories recursively
function copyDirectoryRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Exclude tabIcons or other specific system folders if desired, otherwise copy
      if (entry.name !== 'expo.icon') {
        copyDirectoryRecursive(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

seed().catch(err => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
