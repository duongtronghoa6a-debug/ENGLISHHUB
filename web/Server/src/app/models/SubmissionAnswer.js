const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SubmissionAnswer extends Model {
        static associate(models) {
            SubmissionAnswer.belongsTo(models.ExamSubmission, {
                foreignKey: 'submission_id',
                as: 'submission'
            });
            SubmissionAnswer.belongsTo(models.Question, {
                foreignKey: 'question_id',
                as: 'question'
            });
        }
    }

    SubmissionAnswer.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        submission_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        question_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        answer_type: {
            type: DataTypes.ENUM('text', 'audio_url', 'file_url', 'option_id'),
            allowNull: false,
            defaultValue: 'text'
        },
        content_text: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        content_url: {
            type: DataTypes.STRING(2048),
            allowNull: true
        },
        selected_options: {
            type: DataTypes.JSON,
            allowNull: true
        },
        is_correct: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        score: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        teacher_feedback: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        ai_analysis: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'SubmissionAnswer',
        tableName: 'submission_answers',
        timestamps: false
    });

    return SubmissionAnswer;
};
