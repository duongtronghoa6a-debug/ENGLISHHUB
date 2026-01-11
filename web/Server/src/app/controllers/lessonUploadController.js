/**
 * Lesson Upload Controller
 * Handles lesson creation with file uploads (PDF, audio)
 */

const db = require('../models');
const { Course, Lesson, Teacher } = db;
const multer = require('multer');
const { uploadFile, getContentType } = require('../services/r2Storage');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            'audio/mp3',
            'video/mp4'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed. Allowed: PDF, MP3, WAV, OGG, MP4'));
        }
    }
});

/**
 * Create a lesson with optional file upload
 * POST /api/v1/teacher/lessons/upload
 */
const createLessonWithFile = async (req, res) => {
    try {
        const accountId = req.user.id;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }

        const { course_id, title, description, content_type, duration_minutes, order_index, is_free } = req.body;

        if (!course_id || !title) {
            return res.status(400).json({ success: false, message: 'course_id and title are required' });
        }

        // Verify teacher owns the course
        const course = await Course.findOne({ where: { id: course_id, teacher_id: teacher.id } });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found or not owned by you' });
        }

        let content_url = req.body.content_url || null;

        // If file was uploaded, upload to R2
        if (req.file) {
            const contentType = getContentType(req.file.originalname);
            const result = await uploadFile(
                req.file.buffer,
                req.file.originalname,
                `lessons/${course_id}`,
                contentType
            );
            content_url = result.url;
        }

        // Determine content type from file if not provided
        let finalContentType = content_type || 'video';
        if (req.file) {
            const ext = req.file.originalname.split('.').pop().toLowerCase();
            if (ext === 'pdf') finalContentType = 'pdf';
            else if (['mp3', 'wav', 'ogg'].includes(ext)) finalContentType = 'audio';
            else if (ext === 'mp4') finalContentType = 'video';
        }

        // Get next order_index if not provided
        let finalOrderIndex = order_index;
        if (finalOrderIndex === undefined) {
            const maxOrder = await Lesson.max('order_index', { where: { course_id } });
            finalOrderIndex = (maxOrder || 0) + 1;
        }

        const lesson = await Lesson.create({
            course_id,
            title,
            description,
            content_type: finalContentType,
            content_url,
            duration_minutes: parseInt(duration_minutes) || 0,
            order_index: parseInt(finalOrderIndex),
            is_free: is_free === 'true' || is_free === true
        });

        res.status(201).json({
            success: true,
            message: 'Đã tạo bài học thành công',
            data: lesson
        });
    } catch (error) {
        console.error('createLessonWithFile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Multer middleware for single file upload
const uploadMiddleware = upload.single('file');

module.exports = {
    createLessonWithFile,
    uploadMiddleware
};
