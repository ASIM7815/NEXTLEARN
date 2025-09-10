const fs = require('fs-extra');
const path = require('path');

async function setupPlatform() {
    console.log('🚀 Setting up YouTube-like Video Platform...\n');

    try {
        // Create necessary directories
        const directories = [
            './uploads',
            './data',
            './temp'
        ];

        for (const dir of directories) {
            await fs.ensureDir(dir);
            console.log(`✅ Created directory: ${dir}`);
        }

        // Create videos database file if it doesn't exist
        const videosDbPath = './data/videos.json';
        if (!await fs.pathExists(videosDbPath)) {
            await fs.writeJson(videosDbPath, []);
            console.log('✅ Created videos database file');
        }

        // Create sample config for Google Cloud Storage
        const configPath = './config/gcs-config.json';
        await fs.ensureDir('./config');
        
        if (!await fs.pathExists(configPath)) {
            const sampleConfig = {
                "type": "service_account",
                "project_id": "your-project-id",
                "private_key_id": "your-private-key-id",
                "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
                "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
                "client_id": "your-client-id",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            };
            
            await fs.writeJson(configPath, sampleConfig, { spaces: 2 });
            console.log('✅ Created sample GCS config file');
            console.log('⚠️  Please update ./config/gcs-config.json with your actual Google Cloud Storage credentials');
        }

        // Create environment variables template
        const envPath = './.env.example';
        if (!await fs.pathExists(envPath)) {
            const envContent = `# Server Configuration
PORT=3000
NODE_ENV=development

# Google Cloud Storage
GCS_BUCKET_NAME=your-bucket-name
GCS_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./config/gcs-config.json

# Optional: Admin settings
ADMIN_PASSWORD=admin123
MAX_FILE_SIZE=100MB
ALLOWED_VIDEO_TYPES=mp4,avi,mov,wmv,flv,webm
`;
            
            await fs.writeFile(envPath, envContent);
            console.log('✅ Created environment variables template');
            console.log('⚠️  Copy .env.example to .env and update with your settings');
        }

        console.log('\n🎉 Setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Update ./config/gcs-config.json with your Google Cloud Storage credentials');
        console.log('2. Copy .env.example to .env and configure your settings');
        console.log('3. Run "npm start" to start the server');
        console.log('4. Open http://localhost:3000 in your browser');
        console.log('\n📚 For Google Cloud Storage setup, visit:');
        console.log('   https://cloud.google.com/storage/docs/creating-buckets');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

setupPlatform();