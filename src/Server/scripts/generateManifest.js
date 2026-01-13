/**
 * Generate Manifest from Cloudflare R2
 * 
 * This script lists all files in the R2 bucket and creates _manifest.json
 * 
 * Run: node scripts/generateManifest.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const R2_CONFIG = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME || 'english-hub-storage',
    publicUrl: process.env.R2_PUBLIC_URL || 'https://pub-6d07f507d8fe46d9b39f2fc6d63eb8ff.r2.dev'
};

// Create S3 client configured for R2
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey
    }
});

async function listAllObjects() {
    const allObjects = [];
    let continuationToken = undefined;

    do {
        const command = new ListObjectsV2Command({
            Bucket: R2_CONFIG.bucketName,
            ContinuationToken: continuationToken
        });

        const response = await s3Client.send(command);

        if (response.Contents) {
            allObjects.push(...response.Contents);
        }

        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;

        console.log(`Fetched ${allObjects.length} objects...`);
    } while (continuationToken);

    return allObjects;
}

function parseFilePath(key) {
    // Expected path format: courses/category/teacher/course/filename.pdf
    // Example: courses/toeic/Mai-Phuong/Khoa-Lay-Goc/lesson001.pdf

    const parts = key.split('/');

    // Must start with 'courses' and have at least 5 parts
    if (parts[0] !== 'courses' || parts.length < 5) {
        return null;
    }

    const file = parts[parts.length - 1];
    const ext = path.extname(file).replace('.', '');

    // Only process PDF, MP3, MP4 files
    if (!['pdf', 'mp3', 'mp4'].includes(ext.toLowerCase())) {
        return null;
    }

    // courses/category/teacher/course/file
    // parts[0] = 'courses'
    // parts[1] = category (toeic, ielts, vstep, giao-tiep)
    // parts[2] = teacher
    // parts[3] = course name
    // parts[4+] = lesson file (may have subdirectories)

    return {
        exam: parts[1],           // category
        teacher: parts[2],        // teacher folder name
        course: parts[3],         // course folder name
        section: parts.length > 5 ? parts[4] : 'main',
        file: file,
        ext: ext
    };
}

async function generateManifest() {
    console.log('🚀 Starting manifest generation from R2...');
    console.log(`Bucket: ${R2_CONFIG.bucketName}`);
    console.log(`Public URL: ${R2_CONFIG.publicUrl}\n`);

    try {
        // List all objects
        const objects = await listAllObjects();
        console.log(`\nTotal objects found: ${objects.length}`);

        // Parse and filter
        const manifest = [];

        for (const obj of objects) {
            const key = obj.Key;

            // Skip hidden files and non-content files
            if (key.startsWith('.') || key.startsWith('_')) continue;

            const parsed = parseFilePath(key);
            if (!parsed) continue;

            manifest.push({
                ...parsed,
                path: key,
                urlPath: key,
                url: `${R2_CONFIG.publicUrl}/${encodeURIComponent(key).replace(/%2F/g, '/')}`,
                sizeBytes: obj.Size,
                lastModified: obj.LastModified
            });
        }

        console.log(`Parsed ${manifest.length} content files`);

        // Save manifest
        const manifestDir = path.join(__dirname, '../storage/manifest');
        if (!fs.existsSync(manifestDir)) {
            fs.mkdirSync(manifestDir, { recursive: true });
        }

        const manifestPath = path.join(manifestDir, '_manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        console.log(`\n✅ Manifest saved to: ${manifestPath}`);

        // Print summary
        const exams = [...new Set(manifest.map(m => m.exam))];
        const teachers = [...new Set(manifest.map(m => m.teacher))];
        const courses = [...new Set(manifest.map(m => `${m.teacher}/${m.course}`))];

        console.log('\n📊 Summary:');
        console.log(`  - Categories: ${exams.join(', ')}`);
        console.log(`  - Teachers: ${teachers.length}`);
        console.log(`  - Courses: ${courses.length}`);
        console.log(`  - Files: ${manifest.length}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('Could not load credentials')) {
            console.log('\n⚠️ Check your R2 credentials in .env file:');
            console.log('  R2_ACCOUNT_ID=...');
            console.log('  R2_ACCESS_KEY_ID=...');
            console.log('  R2_SECRET_ACCESS_KEY=...');
        }
        process.exit(1);
    }
}

generateManifest();
