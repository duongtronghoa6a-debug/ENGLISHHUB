const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Course extends Model {
        static associate(models) {
            Course.belongsTo(models.Teacher, {
                foreignKey: 'teacher_id',
                as: 'teacher'
            });
            Course.belongsTo(models.Account, {
                foreignKey: 'created_by',
                as: 'creator'
            });
            Course.hasMany(models.Lesson, {
                foreignKey: 'course_id',
                as: 'lessons'
            });
            Course.hasMany(models.Enrollment, {
                foreignKey: 'course_id',
                as: 'enrollments'
            });
            Course.hasMany(models.Review, {
                foreignKey: 'course_id',
                as: 'reviews'
            });
        }
    }

    Course.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        teacher_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: true
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        thumbnail_url: {
            type: DataTypes.STRING(2048),
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        level: {
            type: DataTypes.ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
            defaultValue: 'B1'
        },
        category: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        is_published: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        total_lessons: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        total_duration_minutes: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        course_type: {
            type: DataTypes.ENUM('standard', 'video', 'offline'),
            defaultValue: 'standard'
        },
        video_playlist_url: {
            type: DataTypes.STRING(2048),
            allowNull: true
        },
        approval_status: {
            type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'rejected'),
            defaultValue: 'draft'
        },
        rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Course',
        tableName: 'courses',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Course;
};