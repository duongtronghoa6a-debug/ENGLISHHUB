const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SpeakingResult extends Model {
        static associate(models) {
            SpeakingResult.belongsTo(models.Learner, {
                foreignKey: 'learner_id',
                as: 'learner'
            });
            SpeakingResult.belongsTo(models.Lesson, {
                foreignKey: 'lesson_id',
                as: 'lesson'
            });
        }
    }

    SpeakingResult.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        learner_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        lesson_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        audio_url: {
            type: DataTypes.STRING(2048),
            allowNull: true
        },
        score: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        feedback: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'SpeakingResult',
        tableName: 'speaking_results',
        timestamps: false
    });

    return SpeakingResult;
};