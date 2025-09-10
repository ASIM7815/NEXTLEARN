const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '/')));

// Route to serve index.html for the root path
// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'searchbar.html'));
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Initialize Google Cloud Storage
let storage;
try {
  if (process.env.GOOGLE_CLOUD_PRIVATE_KEY && process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
    // Use environment variables (for Vercel deployment)
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'trim-glazing-468422-d6',
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }
    });
    console.log('✅ Google Cloud Storage initialized with environment variables');
  } else {
    // Fallback to service account file (for local development)
    storage = new Storage({
      projectId: 'trim-glazing-468422-d6',
      keyFilename: './service-account-key.json'
    });
    console.log('✅ Google Cloud Storage initialized with service account file');
  }
} catch (error) {
  console.error('❌ Failed to initialize Google Cloud Storage:', error.message);
  console.log('Make sure environment variables are set or service-account-key.json exists');
}

const bucketName = 'asimsaadz';
const bucket = storage.bucket(bucketName);

// Database file path
const DB_FILE = path.join(__dirname, 'videos-db.json');

// Load videos from database
async function loadVideos() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data).videos || [];
  } catch (error) {
    console.log('No existing database found, creating new one...');
    return [];
  }
}

// Save videos to database
async function saveVideos(videos) {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify({ videos }, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving to database:', error);
    return false;
  }
}

// Store uploaded videos metadata
let uploadedVideos = [];

// Generate signed URL for upload
app.post('/api/generate-upload-url', async (req, res) => {
  try {
    console.log('📤 Upload request received:', JSON.stringify(req.body));
    const { fileName, fileType } = req.body;
    
    if (!fileName || !fileType) {
      console.log('❌ Missing fileName or fileType');
      return res.status(400).json({ 
        error: 'fileName and fileType are required',
        received: { fileName, fileType }
      });
    }

    // Generate unique file key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileKey = `videos/${timestamp}-${sanitizedFileName}`;
    console.log('🔑 Generated file key:', fileKey);

    // Check if storage is initialized
    if (!storage) {
      console.error('❌ Storage not initialized');
      return res.status(500).json({ 
        error: 'Storage service not initialized',
        envVars: {
          hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY,
          hasClientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID
        }
      });
    }

    // Check if bucket exists
    console.log('🪣 Checking bucket:', bucketName);
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        console.error(`❌ Bucket does not exist: ${bucketName}`);
        return res.status(500).json({ 
          error: `Bucket '${bucketName}' does not exist`,
          action: 'Please create this bucket in Google Cloud Console'
        });
      }
      console.log('✅ Bucket exists and is accessible');
    } catch (bucketError) {
      console.error('❌ Error accessing bucket:', bucketError);
      return res.status(500).json({
        error: 'Failed to access storage bucket',
        details: bucketError.message,
        code: bucketError.code
      });
    }

    // Generate signed URL for upload (expires in 15 minutes)
    console.log('🔗 Generating signed URL...');
    const [uploadUrl] = await bucket.file(fileKey).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: fileType,
    });

    console.log('✅ Signed URL generated successfully');
    res.json({ 
      uploadUrl, 
      fileKey,
      bucket: bucketName,
      expiresIn: '15m'
    });
  } catch (error) {
    console.error('❌ Error in generate-upload-url:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      requestBody: req.body
    });
    
    res.status(500).json({ 
      error: 'Failed to generate upload URL', 
      details: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
});

// Handle upload completion
app.post('/api/upload-complete', async (req, res) => {
  try {
    const { fileKey, title, description } = req.body;
    
    if (!fileKey || !title) {
      return res.status(400).json({ error: 'fileKey and title are required' });
    }

    // Load existing videos
    uploadedVideos = await loadVideos();

    // Generate public URL for the uploaded file
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileKey}`;
    
    // Create video thumbnail (placeholder for now, can be enhanced with actual video thumbnail generation)
    const thumbnailUrl = `https://via.placeholder.com/320x180/1a1a1a/ffffff?text=${encodeURIComponent(title.substring(0, 20))}`;
    
    // Store video metadata
    const videoData = {
      id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      description: description?.trim() || '',
      fileKey,
      publicUrl,
      uploadedAt: new Date().toISOString(),
      thumbnailUrl,
      channel: 'Your Channel',
      type: 'video',
      views: 0,
      duration: '00:00', // Will be populated later
      fileSize: req.body.fileSize || 0
    };
    
    uploadedVideos.push(videoData);
    
    // Save to database
    await saveVideos(uploadedVideos);
    
    console.log(`✅ Video saved: ${videoData.title} (ID: ${videoData.id})`);
    
    res.json({ success: true, videoData });
  } catch (error) {
    console.error('Error handling upload completion:', error);
    res.status(500).json({ error: 'Failed to process upload completion' });
  }
});

// Get uploaded videos
app.get('/api/my-videos', async (req, res) => {
  try {
    uploadedVideos = await loadVideos();
    res.json(uploadedVideos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get all public videos (for browsing)
app.get('/api/videos', async (req, res) => {
  try {
    uploadedVideos = await loadVideos();
    
    // Return all public videos with view counts
    const publicVideos = uploadedVideos.map(video => ({
      ...video,
      views: video.views || 0
    }));
    
    res.json(publicVideos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
  } catch (error) {
    console.error('Error fetching public videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get a specific video and increment view count
app.get('/api/videos/:id', async (req, res) => {
  try {
    uploadedVideos = await loadVideos();
    const video = uploadedVideos.find(v => v.id === req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Increment view count
    video.views = (video.views || 0) + 1;
    await saveVideos(uploadedVideos);
    
    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Delete uploaded video
app.delete('/api/videos/:id', async (req, res) => {
  try {
    uploadedVideos = await loadVideos();
    const { id } = req.params;
    const videoIndex = uploadedVideos.findIndex(v => v.id === id);
    
    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const video = uploadedVideos[videoIndex];
    
    // Delete from Google Cloud Storage
    try {
      await bucket.file(video.fileKey).delete();
      console.log(`✅ File deleted from cloud storage: ${video.fileKey}`);
    } catch (error) {
      console.warn(`⚠️ Could not delete file from cloud storage: ${error.message}`);
      // Continue with database deletion even if cloud deletion fails
    }
    
    // Remove from database
    uploadedVideos.splice(videoIndex, 1);
    await saveVideos(uploadedVideos);
    
    console.log(`✅ Video deleted: ${video.title} (ID: ${id})`);
    
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Initialize database on server start
async function initializeDatabase() {
  try {
    uploadedVideos = await loadVideos();
    console.log(`📚 Loaded ${uploadedVideos.length} videos from database`);
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Start the server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Access your platform at: http://localhost:${PORT}`);
  await initializeDatabase();
});

module.exports = app;
