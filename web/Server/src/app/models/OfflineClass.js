const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class OfflineClass extends Model {
        static associate(models) {
            OfflineClass.belongsTo(models.Account, {
                foreignKey: 'teacher_id',
                as: 'teacher'
            });
            OfflineClass.hasMany(models.Attendance, {
                foreignKey: 'class_id',
                as: 'attendances'
            });
            OfflineClass.hasMany(models.ClassEnrollment, {
                foreignKey: 'class_id',
                as: 'enrollments'
            });
        }
    }

    OfflineClass.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        teacher_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        class_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        organizer_name: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        address: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        room: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        schedule_text: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        syllabus_json: {
            type: DataTypes.JSON,
            allowNull: true
        },
        commitment_text: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        },
        capacity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 30
        },
        current_enrolled: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        thumbnail_url: {
            type: DataTypes.STRING(2048),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('open', 'closed', 'full', 'in_progress', 'completed'),
            defaultValue: 'open'
        }
    }, {
        sequelize,
        modelName: 'OfflineClass',
        tableName: 'offline_classes',
        timestamps: false
    });

    return OfflineClass;
};
