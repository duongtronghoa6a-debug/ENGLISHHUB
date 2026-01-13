const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Question extends Model {
        static associate(models) {
            Question.belongsTo(models.Account, {
                foreignKey: 'creator_id',
                as: 'creator'
            });
            Question.belongsTo(models.Rubric, {
                foreignKey: 'rubric_id',
                as: 'rubric'
            });
            Question.hasMany(models.SubmissionAnswer, {
                foreignKey: 'question_id',
                as: 'answers'
            });
        }
    }

    Question.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        creator_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        skill: {
            type: DataTypes.ENUM('listening', 'speaking', 'reading', 'writing', 'grammar', 'vocabulary'),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('multiple_choice', 'fill_in_blank', 'essay', 'recording', 'matching'),
            allowNull: false
        },
        level: {
            type: DataTypes.ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
            allowNull: false,
            defaultValue: 'B1'
        },
        content_text: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        media_url: {
            type: DataTypes.STRING(2048),
            allowNull: true
        },
        media_type: {
            type: DataTypes.ENUM('image', 'audio', 'video', 'none'),
            defaultValue: 'none'
        },
        options: {
            type: DataTypes.JSON,
            allowNull: true
        },
        correct_answer: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        explanation: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        rubric_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'Question',
        tableName: 'questions',
        timestamps: false
    });

    return Question;
};