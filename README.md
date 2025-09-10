# Educational Video Platform - Setup Guide

# 🎥 YouTube-Like Video Platform

A full-featured video sharing platform that allows users to upload, view, and manage videos. Built with Node.js, Express, and Google Cloud Storage.

## ✨ Features

- **Video Upload**: Upload videos up to 100MB with drag-and-drop support
- **Video Streaming**: Stream videos directly from Google Cloud Storage
- **Video Management**: View, delete, and organize your uploaded videos
- **Community Videos**: Browse all videos uploaded by users
- **Search Functionality**: Search through available videos
- **Responsive Design**: Works on desktop and mobile devices
- **View Counter**: Track video views automatically
- **Real-time Updates**: Videos appear immediately after upload

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Google Cloud Storage account and bucket
- Google Cloud Service Account credentials

### Installation

1. **Clone or download** this project to your local machine

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run setup script**:
   ```bash
   npm run setup
   ```

4. **Configure Google Cloud Storage**:
   - Update `./config/gcs-config.json` with your service account credentials
   - Copy `.env.example` to `.env` and update the settings

5. **Start the server**:
   ```bash
   npm start
   ```

6. **Open your browser** and go to `http://localhost:3000`

## 🔧 Configuration

### Google Cloud Storage Setup

1. **Create a Google Cloud Project**
2. **Create a Storage Bucket**
3. **Create a Service Account** with Storage Admin permissions
4. **Download the service account key** as JSON
5. **Update** `./config/gcs-config.json` with your credentials
6. **Set your bucket name** in `.env` file

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3000
GCS_BUCKET_NAME=your-bucket-name
GCS_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./config/gcs-config.json
MAX_FILE_SIZE=100MB
```

## 📁 Project Structure

```
problemsbreakerz/
├── server.js              # Main server file
├── searchbar.html          # Frontend application
├── package.json           # Dependencies and scripts
├── setup.js              # Setup script
├── data/
│   └── videos.json       # Video database
├── config/
│   └── gcs-config.json   # Google Cloud Storage config
├── uploads/              # Temporary upload directory
└── temp/                # Temporary files
```

## 🎯 Usage

### Uploading Videos

1. **Click "Upload Video"** button or drag files to the upload area
2. **Select video file** (supported formats: MP4, AVI, MOV, WMV, FLV, WebM)
3. **Add title and description** (optional)
4. **Click "Upload"** and wait for completion
5. **Video appears** in "My Videos" and community section

### Viewing Videos

- **Browse** community videos on the home page
- **Search** for specific videos using the search bar
- **Click** on any video thumbnail to play
- **View count** increases automatically

### Managing Videos

- **View your videos** in the "My Videos" section
- **Delete videos** using the delete button
- **Edit details** (coming soon)

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Main application page |
| POST | `/upload` | Upload video file |
| GET | `/videos` | Get all videos |
| GET | `/my-videos` | Get user's videos |
| DELETE | `/videos/:id` | Delete specific video |
| POST | `/videos/:id/view` | Increment view count |

## 🔒 Security Features

- **File type validation** - Only video files allowed
- **File size limits** - Configurable max upload size
- **CORS protection** - Cross-origin request security
- **Input sanitization** - Prevents malicious uploads

## 🐛 Troubleshooting

### Common Issues

**Videos not uploading?**
- Check Google Cloud Storage credentials
- Verify bucket permissions
- Check file size limits

**Videos not playing?**
- Ensure bucket is publicly accessible
- Check video format compatibility
- Verify CORS settings on GCS bucket

**Server won't start?**
- Check if port 3000 is available
- Verify all dependencies are installed
- Check Node.js version (v14+ required)

### Getting Help

1. Check the console for error messages
2. Verify your `.env` configuration
3. Test Google Cloud Storage connection
4. Check network connectivity

## 📝 Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon for automatic server restarts.

### Adding New Features

The platform is designed to be easily extensible:
- Add new API endpoints in `server.js`
- Modify the frontend in `searchbar.html`
- Update database schema in `data/videos.json`

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the MIT License.

## Features
- 🎥 YouTube video search and playback
- 📤 Video upload to Google Cloud Storage
- 🎙️ Voice search functionality
- 📱 Mobile responsive design
- 🌊 Interactive background effects

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Google Cloud Setup
1. Create a Google Cloud project
2. Enable the Cloud Storage API
3. Create a service account with Storage Admin permissions
4. Download the service account key as `service-account-key.json`
5. Create a storage bucket named `asimsaadz` (or update the bucket name in `server.js`)

### 3. Update Configuration
- Replace `your-project-id` in `server.js` with your actual Google Cloud project ID
- Ensure your YouTube API key is set in `searchbar.html`

### 4. Run the Server
```bash
npm start
```

The platform will be available at `http://localhost:3000`

## File Structure
- `searchbar.html` - Main platform interface
- `server.js` - Backend server for Google Cloud Storage integration
- `index.html` - Landing page with Google sign-in
- `welcome.html` - Interactive welcome page with thunder effects

## Usage
1. Navigate to the platform
2. Search for educational videos using the search bar or voice search
3. Upload your own videos using the Upload button
4. View your uploaded videos in the "My Videos" section

## Security Notes
- The API key in the frontend should be replaced with environment variables in production
- Service account keys should be kept secure and not committed to version control
- Consider implementing proper authentication for production use
