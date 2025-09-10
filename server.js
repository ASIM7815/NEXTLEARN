const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Create necessary directories for local storage
const uploadsDir = path.join(__dirname, 'uploads');
const videosDir = path.join(uploadsDir, 'videos');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
const dataDir = path.join(__dirname, 'data');

// Ensure all directories exist
[uploadsDir, videosDir, thumbnailsDir, dataDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// Log storage locations
console.log('📂 Local Storage Configuration:');
console.log(`   Videos: ${videosDir}`);
console.log(`   Thumbnails: ${thumbnailsDir}`);
console.log(`   Database: ${path.join(dataDir, 'videos.json')}`);

// Serve static files
app.use('/uploads', express.static(uploadsDir));
app.use(express.static('.'));

// In-memory storage for videos (in production, use a database)
let videosDatabase = [];
const videosDbPath = path.join(dataDir, 'videos.json');

// Load existing videos from file
if (fs.existsSync(videosDbPath)) {
    try {
        const data = fs.readFileSync(videosDbPath, 'utf8');
        videosDatabase = JSON.parse(data);
    } catch (error) {
        console.log('No existing videos database found, starting fresh');
        videosDatabase = [];
    }
}

// Save videos to file
function saveVideosDatabase() {
    try {
        fs.writeFileSync(videosDbPath, JSON.stringify(videosDatabase, null, 2));
    } catch (error) {
        console.error('Error saving videos database:', error);
    }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, videosDir);
    },
    filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const extension = path.extname(file.originalname);
        cb(null, `${uniqueId}${extension}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only MP4, WebM, QuickTime, and AVI are allowed.'));
        }
    }
});

// Generate video thumbnail
function generateThumbnail(videoPath, thumbnailPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .screenshots({
                timestamps: ['50%'],
                filename: path.basename(thumbnailPath),
                folder: path.dirname(thumbnailPath),
                size: '320x180'
            })
            .on('end', () => resolve(thumbnailPath))
            .on('error', (err) => {
                console.log('Thumbnail generation failed:', err.message);
                // Create a default thumbnail
                const defaultThumbnail = path.join(thumbnailsDir, path.basename(thumbnailPath));
                sharp({
                    create: {
                        width: 320,
                        height: 180,
                        channels: 3,
                        background: { r: 30, g: 30, b: 30 }
                    }
                })
                .png()
                .toFile(defaultThumbnail)
                .then(() => resolve(defaultThumbnail))
                .catch(() => reject(err));
            });
    });
}

// API Routes

// Upload video endpoint
app.post('/api/upload', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        const { title, description } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const videoId = uuidv4();
        const videoFileName = req.file.filename;
        const videoPath = req.file.path;
        
        // Generate thumbnail
        const thumbnailFileName = `${path.parse(videoFileName).name}.png`;
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFileName);
        
        let finalThumbnailPath;
        try {
            finalThumbnailPath = await generateThumbnail(videoPath, thumbnailPath);
        } catch (error) {
            console.log('Using default thumbnail due to error:', error.message);
            finalThumbnailPath = thumbnailPath;
        }

        // Create video entry
        const videoEntry = {
            id: videoId,
            title: title.trim(),
            description: description || '',
            fileName: videoFileName,
            thumbnailFileName: thumbnailFileName,
            publicUrl: `/uploads/videos/${videoFileName}`,
            thumbnailUrl: `/uploads/thumbnails/${thumbnailFileName}`,
            channel: 'Anonymous User', // You can extend this with user authentication
            views: 0,
            uploadedAt: new Date().toISOString(),
            fileSize: req.file.size,
            mimeType: req.file.mimetype
        };

        // Add to database
        videosDatabase.push(videoEntry);
        saveVideosDatabase();

        console.log(`✅ Video uploaded successfully: ${title} (ID: ${videoId})`);
        
        res.json({
            success: true,
            message: 'Video uploaded successfully',
            video: videoEntry
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            error: 'Upload failed: ' + error.message 
        });
    }
});

// Get all videos
app.get('/api/videos', (req, res) => {
    try {
        // Sort by upload date (newest first)
        const sortedVideos = videosDatabase
            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        
        res.json(sortedVideos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

// Get my videos (for now, returns all videos - extend with user auth)
app.get('/api/my-videos', (req, res) => {
    try {
        // In a real app, filter by user ID
        const sortedVideos = videosDatabase
            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        
        res.json(sortedVideos);
    } catch (error) {
        console.error('Error fetching my videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

// Get single video and increment view count
app.get('/api/videos/:id', (req, res) => {
    try {
        const videoId = req.params.id;
        const video = videosDatabase.find(v => v.id === videoId);
        
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        // Increment view count
        video.views = (video.views || 0) + 1;
        saveVideosDatabase();

        res.json(video);
    } catch (error) {
        console.error('Error fetching video:', error);
        res.status(500).json({ error: 'Failed to fetch video' });
    }
});

// Delete video
app.delete('/api/videos/:id', (req, res) => {
    try {
        const videoId = req.params.id;
        const videoIndex = videosDatabase.findIndex(v => v.id === videoId);
        
        if (videoIndex === -1) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const video = videosDatabase[videoIndex];
        
        // Delete files
        const videoPath = path.join(videosDir, video.fileName);
        const thumbnailPath = path.join(thumbnailsDir, video.thumbnailFileName);
        
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }
        if (fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
        }

        // Remove from database
        videosDatabase.splice(videoIndex, 1);
        saveVideosDatabase();

        console.log(`🗑️ Video deleted: ${video.title} (ID: ${videoId})`);
        
        res.json({ success: true, message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: 'Failed to delete video' });
    }
});

// Legacy endpoints for compatibility with existing frontend
app.post('/api/generate-upload-url', (req, res) => {
    // This endpoint is not needed for direct upload, but kept for compatibility
    res.status(400).json({ 
        error: 'This endpoint is deprecated. Use /api/upload instead.' 
    });
});

app.post('/api/upload-complete', (req, res) => {
    // This endpoint is not needed for direct upload, but kept for compatibility
    res.status(400).json({ 
        error: 'This endpoint is deprecated. Use /api/upload instead.' 
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'searchbar.html'));
});

// Serve the storage manager page
app.get('/storage', (req, res) => {
    res.sendFile(path.join(__dirname, 'storage-manager.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'EduTube backend is running',
        videosCount: videosDatabase.length 
    });
});

// Storage info endpoint
app.get('/api/storage-info', (req, res) => {
    try {
        let totalSize = 0;
        let videoCount = 0;
        
        // Calculate total storage used
        if (fs.existsSync(videosDir)) {
            const files = fs.readdirSync(videosDir);
            files.forEach(file => {
                const filePath = path.join(videosDir, file);
                const stats = fs.statSync(filePath);
                totalSize += stats.size;
                videoCount++;
            });
        }
        
        res.json({
            storageLocation: {
                videos: videosDir,
                thumbnails: thumbnailsDir,
                database: path.join(dataDir, 'videos.json')
            },
            usage: {
                totalVideos: videoCount,
                totalSizeBytes: totalSize,
                totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
                totalSizeGB: Math.round(totalSize / (1024 * 1024 * 1024) * 100) / 100
            },
            limits: {
                maxFileSizeMB: 100,
                supportedFormats: ['MP4', 'WebM', 'QuickTime', 'AVI']
            }
        });
    } catch (error) {
        console.error('Error getting storage info:', error);
        res.status(500).json({ error: 'Failed to get storage information' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
        }
    }
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 EduTube server running on http://localhost:${PORT}`);
    console.log(`📁 Videos stored in: ${videosDir}`);
    console.log(`🖼️ Thumbnails stored in: ${thumbnailsDir}`);
    console.log(`📊 Videos in database: ${videosDatabase.length}`);
});

module.exports = app;
