/**
 * R2 Storage Service
 * Handles file uploads to Cloudflare R2
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize R2 client
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'english-hub-storage';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

/**
 * Upload file to R2
 * @param {Buffer} fileBuffer - File content
 * @param {string} originalName - Original filename
 * @param {string} folder - Folder path in bucket (e.g., 'lessons', 'resources')
 * @param {string} contentType - MIME type
 * @returns {Object} - { key, url }
 */
async function uploadFile(fileBuffer, originalName, folder = 'uploads', contentType = 'application/octet-stream') {
    const ext = path.extname(originalName).toLowerCase();
    const key = `${folder}/${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType
    });

    await r2Client.send(command);

    return {
        key,
        url: `${PUBLIC_URL}/${key}`
    };
}

/**
 * Delete file from R2
 * @param {string} key - Object key in bucket
 */
async function deleteFile(key) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });

    await r2Client.send(command);
}

/**
 * Get content type from file extension
 * @param {string} filename
 * @returns {string}
 */
function getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const types = {
        '.pdf': 'application/pdf',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    };
    return types[ext] || 'application/octet-stream';
}

module.exports = {
    uploadFile,
    deleteFile,
    getContentType,
    r2Client,
    BUCKET_NAME,
    PUBLIC_URL
};
