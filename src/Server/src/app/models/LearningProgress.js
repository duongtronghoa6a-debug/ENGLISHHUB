const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class LearningProgress extends Model {
        static associate(models) {
            LearningProgress.belongsTo(models.Enrollment, {
                foreignKey: 'enrollment_id',
                as: 'enrollment'
            });
            LearningProgress.belongsTo(models.Lesson, {
                foreignKey: 'lesson_id',
                as: 'lesson'
            });
        }
    }

    LearningProgress.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        enrollment_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        lesson_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        is_completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'LearningProgress',
        tableName: 'learning_progress',
        timestamps: false
    });

    return LearningProgress;
};