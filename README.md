# EduTube - Video Upload Platform

A YouTube-like platform where users can upload, view, and manage videos using Firebase Storage.

## Features

- 📹 Video upload with drag & drop support
- � Firebase Storage integration for cloud hosting
- �🖼️ Automatic thumbnail generation
- 📱 Responsive design for mobile and desktop
- 🔍 Search functionality (YouTube integration)
- 👥 Community video sharing
- 📊 View tracking
- 🗑️ Video management (delete videos)
- 🌐 Global CDN for fast video delivery

## Quick Start

### 1. Install Dependencies

Make sure you have Node.js installed (version 14 or higher), then run:

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### 3. Open Your Browser

Navigate to: `http://localhost:3000`

## File Structure

```
NEXTLEARN/
├── server.js              # Backend server
├── searchbar.html         # Frontend application
├── package.json           # Dependencies
├── firebase-config.js     # Firebase backend configuration
├── firebase-frontend.js   # Firebase frontend configuration
├── FIREBASE_SETUP.md      # Firebase setup instructions
├── temp/                  # Temporary files (auto-created)
└── data/                  # Database files (auto-created)
    └── videos.json        # Video metadata
```

**Firebase Storage Structure:**
```
Firebase Storage Bucket:
├── videos/
│   ├── {videoId}.mp4
│   └── {videoId}.webm
└── thumbnails/
    └── {videoId}_thumbnail.png
```

## Usage

### Uploading Videos

1. Click the "Upload" button in the navigation
2. Drag & drop a video file or click to select
3. Enter a title (required) and description (optional)
4. Click "Upload" and wait for completion
5. Video will appear in the "Community Videos" section

### Supported Formats

- MP4 (recommended)
- WebM
- QuickTime (MOV)
- AVI

### File Size Limit

- Maximum: 100MB per video

### Features Available

- **Home**: View community videos and YouTube content
- **Search**: Search YouTube videos (requires API key)
- **Upload**: Upload your own videos
- **Browse**: View all community videos
- **My Videos**: Manage your uploaded videos

## Configuration

### YouTube API (Optional)

To enable YouTube search functionality:

1. Get a YouTube Data API v3 key from Google Cloud Console
2. Replace `YOUR_API_KEY_HERE` in `searchbar.html` with your actual API key

### Storage

Videos are stored in **Firebase Storage** with these benefits:

- ✅ **Global CDN**: Fast loading worldwide
- ✅ **Unlimited scalability**: Handle any number of uploads
- ✅ **Automatic backups**: Google handles redundancy
- ✅ **Cost-effective**: Pay only for usage
- ✅ **Enterprise security**: Google-grade protection

For enhanced features:
- Implement user authentication with Firebase Auth
- Add a proper database (Firestore, PostgreSQL, MongoDB)

## Development

### Adding Features

The codebase is modular and easy to extend:

- **Backend**: Modify `server.js` for new API endpoints
- **Frontend**: Update `searchbar.html` for UI changes
- **Storage**: Currently uses local files, easily replaceable

### Database

Currently uses JSON file storage. To upgrade:

1. Install database driver (e.g., `pg` for PostgreSQL)
2. Replace file operations in `server.js`
3. Create proper tables/collections

## Production Deployment

### Environment Variables

Set these for production:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Set to "production"

### Nginx Configuration (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /uploads/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Troubleshooting

### Common Issues

1. **Upload fails**: Check server logs, ensure write permissions
2. **Thumbnails not generating**: FFmpeg installation required
3. **Large files timeout**: Increase timeout settings
4. **CORS errors**: Server handles CORS, check network

### Logs

Server logs show:
- Upload success/failure
- File operations
- Error details

## Security Considerations

For production use:

- [ ] Add user authentication
- [ ] Implement file type validation
- [ ] Add virus scanning
- [ ] Rate limiting for uploads
- [ ] Input sanitization
- [ ] HTTPS enforcement

## License

MIT License - Feel free to modify and distribute.

## Support

If you encounter issues:

1. Check server logs in the terminal
2. Verify file permissions in `uploads/` directory
3. Ensure all dependencies are installed
4. Check browser console for frontend errors
