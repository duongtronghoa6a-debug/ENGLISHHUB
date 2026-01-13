/**
 * UserActivity Model
 * Tracks daily user activity for streak calculation
 */

module.exports = (sequelize, DataTypes) => {
    const UserActivity = sequelize.define('UserActivity', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        account_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'accounts',
                key: 'id'
            }
        },
        activity_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        login_count: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        lessons_completed: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        exams_taken: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        minutes_studied: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'user_activities',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['account_id', 'activity_date']
            }
        ]
    });

    UserActivity.associate = (models) => {
        UserActivity.belongsTo(models.Account, {
            foreignKey: 'account_id',
            as: 'account'
        });
    };

    return UserActivity;
};
