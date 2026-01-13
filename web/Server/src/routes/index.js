
const express = require('express');

const authRouter = require('./auth');
const userRouter = require('./users');
const courseRouter = require('./courses');
const lessonRouter = require('./lessons');
const enrollmentRouter = require('./enrollments');
const progressRouter = require('./progress');
const reviewRouter = require('./reviews');
const orderRouter = require('./orders');
const cartRouter = require('./cart');
const questionRouter = require('./questions');
const examRouter = require('./exams');
const offlineClassRouter = require('./offlineClasses');
const offlineScheduleRouter = require('./offlineSchedule'); // Legacy
const speakingResultRouter = require('./speakingResults');
const testSessionRouter = require('./testSessions');
const adminRouter = require('./admin');
const libraryRouter = require('./library');
const teacherRouter = require('./teacher');
const streakRouter = require('./streak');
const chatRouter = require('./chat');
const aiRouter = require('./ai');
const classEnrollmentRouter = require('./classEnrollments');
const resourceRouter = require('./resources');
const notificationRouter = require('./notification');

function route(app) {
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/courses', courseRouter);
  app.use('/api/v1/lessons', lessonRouter);
  app.use('/api/v1/enrollments', enrollmentRouter);
  app.use('/api/v1/progress', progressRouter);
  app.use('/api/v1/reviews', reviewRouter);
  app.use('/api/v1/orders', orderRouter);
  app.use('/api/v1/cart', cartRouter);
  app.use('/api/v1/questions', questionRouter);
  app.use('/api/v1/exams', examRouter);
  app.use('/api/v1/offline-classes', offlineClassRouter);
  app.use('/api/v1/offlineSchedule', offlineScheduleRouter); // Legacy
  app.use('/api/v1/speakingResults', speakingResultRouter);
  app.use('/api/v1/testSessions', testSessionRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/library', libraryRouter);
  app.use('/api/v1/teacher', teacherRouter);
  app.use('/api/v1/streak', streakRouter);
  app.use('/api/v1/chat', chatRouter);
  app.use('/api/v1/ai', aiRouter);
  app.use('/api/v1/class-enrollments', classEnrollmentRouter);
  app.use('/api/v1/resources', resourceRouter);
  app.use('/api/v1/notifications', notificationRouter);

}

module.exports = route;

