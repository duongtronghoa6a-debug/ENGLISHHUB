const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Lesson extends Model {
        static associate(models) {
            Lesson.belongsTo(models.Course, {
                foreignKey: 'course_id',
                as: 'course'
            });
            Lesson.hasMany(models.LearningProgress, {
                foreignKey: 'lesson_id',
                as: 'progress'
            });
        }
    }

    Lesson.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        course_id: {
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
        content_type: {
            type: DataTypes.ENUM('video', 'pdf', 'audio', 'quiz', 'link'),
            defaultValue: 'video'
        },
        content_url: {
            type: DataTypes.STRING(2048),
            allowNull: true
        },
        duration_minutes: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        order_index: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        is_free: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'Lesson',
        tableName: 'lessons',
        timestamps: false
    });

    return Lesson;
};