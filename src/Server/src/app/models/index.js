const Sequelize = require('sequelize');
const { sequelize } = require('../../config/db/connect');

const db = {};

// --- Core User Models ---
db.Account = require('./Account')(sequelize, Sequelize.DataTypes);
db.Admin = require('./Admin')(sequelize, Sequelize.DataTypes);
db.Learner = require('./Learner')(sequelize, Sequelize.DataTypes);
db.Teacher = require('./Teacher')(sequelize, Sequelize.DataTypes);

// --- Course Models ---
db.Course = require('./Course')(sequelize, Sequelize.DataTypes);
db.Module = require('./Module')(sequelize, Sequelize.DataTypes);
db.Lesson = require('./Lesson')(sequelize, Sequelize.DataTypes);

// --- Exam & Question Models ---
db.Rubric = require('./Rubric')(sequelize, Sequelize.DataTypes);
db.Question = require('./Question')(sequelize, Sequelize.DataTypes);
db.Exam = require('./Exam')(sequelize, Sequelize.DataTypes);
db.ExamSubmission = require('./ExamSubmission')(sequelize, Sequelize.DataTypes);
db.SubmissionAnswer = require('./SubmissionAnswer')(sequelize, Sequelize.DataTypes);

// --- Offline Class Models ---
db.OfflineClass = require('./OfflineClass')(sequelize, Sequelize.DataTypes);
db.Attendance = require('./Attendance')(sequelize, Sequelize.DataTypes);
db.OfflineSchedule = require('./OfflineSchedule')(sequelize, Sequelize.DataTypes);
db.ClassEnrollment = require('./ClassEnrollment')(sequelize, Sequelize.DataTypes);

// --- Enrollment & Progress ---
db.Enrollment = require('./Enrollment')(sequelize, Sequelize.DataTypes);
db.LearningProgress = require('./LearningProgress')(sequelize, Sequelize.DataTypes);
db.TestSession = require('./TestSession')(sequelize, Sequelize.DataTypes);
db.SpeakingResult = require('./SpeakingResult')(sequelize, Sequelize.DataTypes);

// --- Commerce ---
db.CartItem = require('./CartItem')(sequelize, Sequelize.DataTypes);
db.Order = require('./Order')(sequelize, Sequelize.DataTypes);
db.OrderItem = require('./OrderItem')(sequelize, Sequelize.DataTypes);
db.Review = require('./Review')(sequelize, Sequelize.DataTypes);
db.Withdrawal = require('./Withdrawal')(sequelize, Sequelize.DataTypes);

// --- Gamification & Streak ---
db.UserActivity = require('./UserActivity')(sequelize, Sequelize.DataTypes);
db.Achievement = require('./Achievement')(sequelize, Sequelize.DataTypes);

// --- Notifications ---
db.Notification = require('./Notification')(sequelize, Sequelize.DataTypes);

// --- Chat System ---
db.Conversation = require('./Conversation')(sequelize, Sequelize.DataTypes);
db.ConversationParticipant = require('./ConversationParticipant')(sequelize, Sequelize.DataTypes);
db.Message = require('./Message')(sequelize, Sequelize.DataTypes);

// --- System ---
db.SystemSetting = require('./SystemSetting')(sequelize, Sequelize.DataTypes);
db.LoginSession = require('./LoginSession')(sequelize, Sequelize.DataTypes);
db.ActivityLog = require('./ActivityLog')(sequelize, Sequelize.DataTypes);

// Activate Associations
Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;