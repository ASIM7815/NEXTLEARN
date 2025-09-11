const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { bucket } = require('./firebase-config');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Create necessary directories for temporary files and database
const tempDir = path.join(__dirname, 'temp');
const dataDir = path.join(__dirname, 'data');

// Ensure directories exist
[tempDir, dataDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// Log storage configuration
console.log('� Firebase Storage Configuration:');
console.log(`   Storage Bucket: ${bucket.name}`);
console.log(`   Temp Directory: ${tempDir}`);
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

// Configure multer for temporary file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
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
        const videoFileName = `${videoId}${path.extname(req.file.originalname)}`;
        const thumbnailFileName = `${videoId}_thumbnail.png`;
        const tempVideoPath = req.file.path;

        console.log(`📤 Uploading video to Firebase: ${title}`);

        // Upload video to Firebase Storage
        const videoFile = bucket.file(`videos/${videoFileName}`);
        await videoFile.save(fs.readFileSync(tempVideoPath), {
            metadata: {
                contentType: req.file.mimetype,
                metadata: {
                    originalName: req.file.originalname,
                    uploadedBy: 'anonymous', // You can extend this with user authentication
                    title: title.trim()
                }
            }
        });

        // Make video publicly accessible
        await videoFile.makePublic();
        const videoPublicUrl = `https://storage.googleapis.com/${bucket.name}/videos/${videoFileName}`;

        // Generate and upload thumbnail
        const tempThumbnailPath = path.join(tempDir, `${videoId}_temp_thumbnail.png`);
        let thumbnailPublicUrl;

        try {
            await generateThumbnail(tempVideoPath, tempThumbnailPath);
            const thumbnailFile = bucket.file(`thumbnails/${thumbnailFileName}`);
            await thumbnailFile.save(fs.readFileSync(tempThumbnailPath), {
                metadata: {
                    contentType: 'image/png'
                }
            });
            await thumbnailFile.makePublic();
            thumbnailPublicUrl = `https://storage.googleapis.com/${bucket.name}/thumbnails/${thumbnailFileName}`;

            // Clean up temp thumbnail
            if (fs.existsSync(tempThumbnailPath)) {
                fs.unlinkSync(tempThumbnailPath);
            }
        } catch (error) {
            console.log('Thumbnail generation failed, using default:', error.message);
            thumbnailPublicUrl = `https://via.placeholder.com/320x180/1a1a1a/ffffff?text=Video`;
        }

        // Clean up temp video file
        if (fs.existsSync(tempVideoPath)) {
            fs.unlinkSync(tempVideoPath);
        }

        // Create video entry
        const videoEntry = {
            id: videoId,
            title: title.trim(),
            description: description || '',
            fileName: videoFileName,
            thumbnailFileName: thumbnailFileName,
            publicUrl: videoPublicUrl,
            thumbnailUrl: thumbnailPublicUrl,
            firebaseVideoPath: `videos/${videoFileName}`,
            firebaseThumbnailPath: `thumbnails/${thumbnailFileName}`,
            channel: 'Anonymous User', // You can extend this with user authentication
            views: 0,
            uploadedAt: new Date().toISOString(),
            fileSize: req.file.size,
            mimeType: req.file.mimetype
        };

        // Add to database
        videosDatabase.push(videoEntry);
        saveVideosDatabase();

        console.log(`✅ Video uploaded to Firebase: ${title} (ID: ${videoId})`);
        
        res.json({
            success: true,
            message: 'Video uploaded successfully to Firebase Storage',
            video: videoEntry
        });

    } catch (error) {
        console.error('Firebase upload error:', error);
        
        // Clean up temp files on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
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
app.delete('/api/videos/:id', async (req, res) => {
    try {
        const videoId = req.params.id;
        const videoIndex = videosDatabase.findIndex(v => v.id === videoId);
        
        if (videoIndex === -1) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const video = videosDatabase[videoIndex];
        
        // Delete files from Firebase Storage
        try {
            if (video.firebaseVideoPath) {
                await bucket.file(video.firebaseVideoPath).delete();
                console.log(`🗑️ Deleted video from Firebase: ${video.firebaseVideoPath}`);
            }
        } catch (error) {
            console.log(`Warning: Could not delete video file: ${error.message}`);
        }

        try {
            if (video.firebaseThumbnailPath) {
                await bucket.file(video.firebaseThumbnailPath).delete();
                console.log(`🗑️ Deleted thumbnail from Firebase: ${video.firebaseThumbnailPath}`);
            }
        } catch (error) {
            console.log(`Warning: Could not delete thumbnail file: ${error.message}`);
        }

        // Remove from database
        videosDatabase.splice(videoIndex, 1);
        saveVideosDatabase();

        console.log(`✅ Video deleted: ${video.title} (ID: ${videoId})`);
        
        res.json({ success: true, message: 'Video deleted successfully from Firebase Storage' });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: 'Failed to delete video: ' + error.message });
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
app.get('/api/storage-info', async (req, res) => {
    try {
        let totalSize = 0;
        let videoCount = videosDatabase.length;
        
        // Calculate total storage used from database
        videosDatabase.forEach(video => {
            totalSize += video.fileSize || 0;
        });
        
        res.json({
            storageType: 'Firebase Storage',
            storageLocation: {
                bucket: bucket.name,
                videos: 'videos/',
                thumbnails: 'thumbnails/',
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
            },
            firebaseInfo: {
                bucketName: bucket.name,
                publicAccess: true,
                cdnEnabled: true
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
