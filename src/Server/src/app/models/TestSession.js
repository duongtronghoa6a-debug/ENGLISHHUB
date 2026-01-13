const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class TestSession extends Model {
        static associate(models) {
            TestSession.belongsTo(models.Learner, {
                foreignKey: 'learner_id',
                as: 'learner'
            });
            TestSession.belongsTo(models.Lesson, {
                foreignKey: 'lesson_id',
                as: 'lesson'
            });
        }
    }

    TestSession.init({
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
        score: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        total_questions: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        correct_answers: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        started_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'TestSession',
        tableName: 'test_sessions',
        timestamps: false
    });

    return TestSession;
};