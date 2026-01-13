/**
 * ActivityLog Model
 * Records admin and user activity for audit trail
 */

module.exports = (sequelize, DataTypes) => {
    const ActivityLog = sequelize.define('ActivityLog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        account_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'accounts',
                key: 'id'
            }
        },
        action: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'login, logout, update_settings, approve_teacher, etc.'
        },
        action_type: {
            type: DataTypes.ENUM('success', 'warning', 'error', 'info'),
            defaultValue: 'info'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        target_type: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'course, user, teacher, exam, etc.'
        },
        target_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        ip_address: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        user_agent: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Additional context data'
        }
    }, {
        tableName: 'activity_logs',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['account_id'] },
            { fields: ['action'] },
            { fields: ['created_at'] }
        ]
    });

    ActivityLog.associate = (models) => {
        ActivityLog.belongsTo(models.Account, {
            foreignKey: 'account_id',
            as: 'account'
        });
    };

    // Helper to log activity
    ActivityLog.log = async function (data) {
        try {
            return await this.create({
                account_id: data.account_id,
                action: data.action,
                action_type: data.action_type || 'info',
                description: data.description,
                target_type: data.target_type,
                target_id: data.target_id,
                ip_address: data.ip_address,
                user_agent: data.user_agent,
                metadata: data.metadata
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
            return null;
        }
    };

    return ActivityLog;
};
