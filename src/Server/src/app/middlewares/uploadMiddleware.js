const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Config Cloudinary 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// 2. Config Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'learning-app-assets', // Folder trên cloud
    resource_type: 'auto', // Tự động nhận diện (Image/Video/Audio)
    allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'avi', 'mp3', 'mp4', 'wav', 'webm', 'pdf', 'docx', 'pptx'], // Định dạng file được phép upload
  },
});

const upload = multer({ storage: storage });

module.exports = upload;