# Firebase Setup Instructions

## 🔥 Setting up Firebase Storage for EduTube

Your EduTube platform now uses Firebase Storage for video hosting. Follow these steps to complete the setup:

### 1. Firebase Project Setup

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `nextlearn-fe31f`
3. **Enable Storage**:
   - Go to "Storage" in the left sidebar
   - Click "Get Started"
   - Choose "Start in production mode" (we'll configure rules later)
   - Select your preferred location

### 2. Configure Storage Rules

In the Firebase Console, go to Storage > Rules and replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access to all files
    match /{allPaths=**} {
      allow read: if true;
      allow write: if true; // In production, add proper authentication
    }
  }
}
```

**Important**: The above rules allow anyone to upload. For production, implement proper authentication.

### 3. Set up Authentication (Optional but Recommended)

For production use, enable Authentication:

1. Go to "Authentication" in Firebase Console
2. Click "Get Started"
3. Enable your preferred sign-in methods (Email/Password, Google, etc.)

### 4. Install Dependencies

Make sure you have the required dependencies:

```bash
npm install
```

### 5. Configure Service Account (For Production)

For production deployment:

1. **Generate Service Account Key**:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file

2. **Set Environment Variable**:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
   ```

   Or on Windows:
   ```cmd
   set GOOGLE_APPLICATION_CREDENTIALS=path\to\your\service-account-key.json
   ```

### 6. Start Your Server

```bash
npm start
```

## 🚀 Features with Firebase Storage

### ✅ Benefits

- **Global CDN**: Videos load fast worldwide
- **Scalable**: Handle unlimited uploads
- **Secure**: Enterprise-grade security
- **Cost-effective**: Pay only for what you use
- **Automatic backups**: Google handles redundancy
- **Direct Client Uploads**: Files upload directly from browser to Firebase (much faster!)
- **Real-time Progress**: Live upload progress tracking
- **Resumable Uploads**: Firebase handles network interruptions

### 📊 Current Configuration

- **Storage Location**: Firebase Cloud Storage
- **Public Access**: Enabled (videos accessible via URLs)
- **File Size Limit**: 100MB (configurable)
- **Supported Formats**: MP4, WebM, MOV, AVI
- **Thumbnail Generation**: Automatic

### 🔧 File Organization

```
Firebase Storage Bucket:
├── videos/
│   ├── {videoId}.mp4
│   ├── {videoId}.webm
│   └── ...
└── thumbnails/
    ├── {videoId}_thumbnail.png
    └── ...
```

### 🌐 Access URLs

Videos are accessible via:
- **Direct URL**: `https://storage.googleapis.com/{bucket}/videos/{filename}`
- **Signed URL**: For private content (when authentication is added)

### 📱 CORS Configuration

Firebase Storage automatically handles CORS for web applications.

### 💰 Pricing

Firebase Storage pricing (as of 2024):
- **Storage**: $0.026/GB/month
- **Downloads**: $0.12/GB
- **Uploads**: Free up to 1GB/day

### 🛡️ Security Best Practices

1. **Enable Authentication**: Don't allow anonymous uploads in production
2. **Validate File Types**: Server-side validation implemented
3. **Limit File Sizes**: Currently set to 100MB
4. **Monitor Usage**: Set up billing alerts in Firebase Console
5. **Regular Backups**: Firebase handles this automatically

### 🔧 Troubleshooting

**Issue**: "Permission denied" errors
**Solution**: Check Storage Rules in Firebase Console

**Issue**: "Firebase app not initialized"
**Solution**: Verify firebase-config.js has correct credentials

**Issue**: Videos not loading
**Solution**: Ensure files are set to public in Storage Rules

**Issue**: Upload timeout
**Solution**: Check internet connection and file size

### 📞 Support

- **Firebase Documentation**: https://firebase.google.com/docs/storage
- **Firebase Support**: https://firebase.google.com/support
- **Stack Overflow**: Tag questions with `firebase-storage`

## 🎯 Next Steps

1. **Test Upload**: Try uploading a video through the interface
2. **Check Firebase Console**: Verify files appear in Storage
3. **Test Playback**: Ensure videos play correctly
4. **Monitor Usage**: Set up billing alerts
5. **Add Authentication**: Implement user accounts (optional)

Your EduTube platform is now powered by Firebase Storage! 🎉