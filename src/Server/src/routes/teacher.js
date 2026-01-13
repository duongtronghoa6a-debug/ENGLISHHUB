/**
 * Teacher Routes
 * /api/v1/teacher/*
 */

const express = require('express');
const router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');
const teacherController = require('../app/controllers/teacherController');

// All routes require authentication and teacher role
router.use(isAuth);
router.use(restrictTo('teacher', 'admin'));

// Dashboard stats
router.get('/dashboard-stats', teacherController.getDashboardStats);

// Profile
router.get('/profile', teacherController.getTeacherProfile);

// Recent activity
router.get('/recent-activity', teacherController.getRecentActivity);

// My courses
router.get('/my-courses', teacherController.getMyCourses);

// Course CRUD
router.post('/courses', teacherController.createCourse);
router.put('/courses/:id/submit-review', (req, res, next) => { console.log('HIT: submit-review route', req.params.id); next(); }, teacherController.submitCourseForReview);
router.put('/courses/:id', (req, res, next) => { console.log('HIT: update course route', req.params.id); next(); }, teacherController.updateCourse);
router.delete('/courses/:id', teacherController.deleteCourse);
router.get('/courses/:id/lessons', teacherController.getCourseLessons);

// Lesson CRUD
router.post('/lessons', teacherController.createLesson);
router.put('/lessons/:id', teacherController.updateLesson);
router.delete('/lessons/:id', teacherController.deleteLesson);

// Lesson with file upload (PDF, audio)
const lessonUploadController = require('../app/controllers/lessonUploadController');
router.post('/lessons/upload', lessonUploadController.uploadMiddleware, lessonUploadController.createLessonWithFile);

// Profile
router.get('/profile', teacherController.getTeacherProfile);

// My offline classes
router.get('/my-offline-classes', teacherController.getMyOfflineClasses);

// Course students
router.get('/courses/:id/students', teacherController.getCourseStudents);

// Pending enrollment requests for offline classes
router.get('/pending-requests', teacherController.getPendingEnrollmentRequests);

// Questions (with file upload for listening/reading)
const multer = require('multer');
const questionController = require('../app/controllers/questionController');
const { uploadFile, getContentType } = require('../app/services/r2Storage');

const questionUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 30 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'image/png', 'image/jpeg', 'image/gif'];
        cb(null, allowed.includes(file.mimetype));
    }
});

router.get('/questions', questionController.getAllQuestions);
router.post('/questions', questionUpload.single('file'), async (req, res, next) => {
    try {
        // Upload file to R2 if present
        if (req.file) {
            const contentType = getContentType(req.file.originalname);
            const result = await uploadFile(
                req.file.buffer,
                req.file.originalname,
                `questions/${req.body.skill || 'general'}`,
                contentType
            );
            req.file.path = result.url;
        }
        // Forward to original controller
        questionController.createQuestion(req, res, next);
    } catch (error) {
        next(error);
    }
});

// Exam submit for review
router.put('/exams/:id/submit-review', teacherController.submitExamForReview);

// Module CRUD
router.get('/courses/:id/modules', teacherController.getCourseModules);
router.post('/modules', teacherController.createModule);
router.put('/modules/:id', teacherController.updateModule);
router.delete('/modules/:id', teacherController.deleteModule);

module.exports = router;
