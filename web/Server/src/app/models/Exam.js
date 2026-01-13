const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Exam extends Model {
        static associate(models) {
            Exam.belongsTo(models.Account, {
                foreignKey: 'creator_id',
                as: 'creator'
            });
            Exam.hasMany(models.ExamSubmission, {
                foreignKey: 'exam_id',
                as: 'submissions'
            });
        }
    }

    Exam.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        creator_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        duration_minutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 60
        },
        pass_score: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 60
        },
        grading_method: {
            type: DataTypes.ENUM('auto', 'manual', 'hybrid'),
            defaultValue: 'auto'
        },
        list_question_ids: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: []
        },
        status: {
            type: DataTypes.ENUM('draft', 'published', 'archived'),
            defaultValue: 'draft'
        },
        approval_status: {
            type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'rejected'),
            defaultValue: 'draft'
        },
        rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'Exam',
        tableName: 'exams',
        timestamps: false
    });

    return Exam;
};
