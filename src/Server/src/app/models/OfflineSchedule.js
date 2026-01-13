const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class OfflineSchedule extends Model {
        static associate(models) {
            OfflineSchedule.belongsTo(models.Course, {
                foreignKey: 'course_id',
                as: 'course'
            });
        }
    }

    OfflineSchedule.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        course_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        location: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: true
        },
        max_students: {
            type: DataTypes.INTEGER,
            defaultValue: 30
        },
        syllabus: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'OfflineSchedule',
        tableName: 'offline_schedules',
        timestamps: false
    });

    return OfflineSchedule;
};