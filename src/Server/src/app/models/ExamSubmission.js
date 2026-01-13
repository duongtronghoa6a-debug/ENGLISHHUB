const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExamSubmission extends Model {
        static associate(models) {
            ExamSubmission.belongsTo(models.Exam, {
                foreignKey: 'exam_id',
                as: 'exam'
            });
            ExamSubmission.belongsTo(models.Account, {
                foreignKey: 'learner_id',
                as: 'learner'
            });
            ExamSubmission.hasMany(models.SubmissionAnswer, {
                foreignKey: 'submission_id',
                as: 'answers'
            });
        }
    }

    ExamSubmission.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        exam_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        learner_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        started_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        submitted_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        total_score: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('in_progress', 'submitted', 'grading', 'completed'),
            defaultValue: 'in_progress'
        },
        teacher_general_feedback: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'ExamSubmission',
        tableName: 'exam_submissions',
        timestamps: false
    });

    return ExamSubmission;
};
