var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');

const adminController = require('../app/controllers/adminController');

// All admin routes require authentication and admin role
router.use(isAuth);
router.use(restrictTo('admin')); // lowercase

// Dashboard stats
router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/pending-actions', adminController.getPendingActions);

// User management
router.get('/users', adminController.getAllAccounts);
router.patch('/users/:id/status', adminController.updateAccountStatus);

// Legacy routes
router.get('/dashboard', adminController.getDashboardStats);
router.get('/accounts', adminController.getAllAccounts);

// Content review/approval routes
router.get('/pending-reviews', adminController.getPendingReviews);
router.put('/courses/:id/approve', adminController.approveCourse);
router.put('/courses/:id/reject', adminController.rejectCourse);

// Course CRUD
router.get('/courses', adminController.getAllCourses);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// User CRUD
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Exam CRUD
router.get('/exams', adminController.getAllExams);
router.post('/exams', adminController.createExam);
router.put('/exams/:id', adminController.updateExam);
router.delete('/exams/:id', adminController.deleteExam);
router.put('/exams/:id/approve', adminController.approveExam);
router.put('/exams/:id/reject', adminController.rejectExam);

// Question CRUD (within exams) - with file upload support
const multer = require('multer');
const { uploadFile, getContentType } = require('../app/services/r2Storage');

const questionUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 30 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'image/png', 'image/jpeg', 'image/gif'];
        cb(null, allowed.includes(file.mimetype));
    }
});

router.get('/exams/:examId/questions', adminController.getExamQuestions);
router.post('/exams/:examId/questions', questionUpload.single('file'), async (req, res, next) => {
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
            req.body.content_url = result.url;
        }
        // Forward to controller
        adminController.addQuestionToExam(req, res, next);
    } catch (error) {
        next(error);
    }
});
router.delete('/exams/:examId/questions/:questionId', adminController.removeQuestionFromExam);

// Course lessons (for viewing any course)
router.get('/courses/:courseId/lessons', adminController.getCourseLessons);
router.post('/courses/:courseId/lessons', adminController.addLessonToCourse);
router.delete('/courses/:courseId/lessons/:lessonId', adminController.deleteLesson);

// Revenue & Withdrawal Management
router.get('/teacher-revenues', adminController.getTeacherRevenues);
router.get('/withdrawals', adminController.getAllWithdrawals);
router.put('/withdrawals/:id', adminController.processWithdrawal);

module.exports = router;