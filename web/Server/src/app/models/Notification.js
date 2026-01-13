const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Notification extends Model {
        static associate(models) {
            Notification.belongsTo(models.Account, {
                foreignKey: 'account_id',
                as: 'recipient'
            });
            Notification.belongsTo(models.Account, {
                foreignKey: 'sender_id',
                as: 'sender'
            });
        }
    }

    Notification.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        account_id: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Recipient account ID'
        },
        sender_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'Sender account ID (null for system notifications)'
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
            defaultValue: 'info'
        },
        category: {
            type: DataTypes.ENUM('message', 'purchase', 'exam', 'achievement', 'reminder', 'promo', 'system', 'course_review', 'enrollment'),
            defaultValue: 'system'
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        related_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'Related entity ID (course, exam, etc.)'
        },
        related_type: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Related entity type (course, exam, etc.)'
        },
        action_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
            comment: 'URL to navigate when clicking notification'
        }
    }, {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Notification;
};
