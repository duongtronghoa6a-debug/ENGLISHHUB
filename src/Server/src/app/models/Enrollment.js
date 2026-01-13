const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Enrollment extends Model {
        static associate(models) {
            Enrollment.belongsTo(models.Learner, {
                foreignKey: 'learner_id',
                as: 'learner'
            });
            Enrollment.belongsTo(models.Course, {
                foreignKey: 'course_id',
                as: 'course'
            });
            Enrollment.hasMany(models.LearningProgress, {
                foreignKey: 'enrollment_id',
                as: 'progress'
            });
        }
    }

    Enrollment.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        learner_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        course_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        enrolled_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        progress_percent: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('active', 'completed', 'dropped'),
            defaultValue: 'active'
        }
    }, {
        sequelize,
        modelName: 'Enrollment',
        tableName: 'enrollments',
        timestamps: false
    });

    return Enrollment;
};