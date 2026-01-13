/**
 * Achievement Model
 * Stores user achievements and ranking scores
 */

module.exports = (sequelize, DataTypes) => {
    const Achievement = sequelize.define('Achievement', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        account_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: {
                model: 'accounts',
                key: 'id'
            }
        },
        total_score: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        courses_completed: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        lessons_completed: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        exams_passed: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        current_streak: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        max_streak: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        last_activity_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        weekly_score: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        monthly_score: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'achievements',
        timestamps: true,
        underscored: true
    });

    Achievement.associate = (models) => {
        Achievement.belongsTo(models.Account, {
            foreignKey: 'account_id',
            as: 'account'
        });
    };

    return Achievement;
};
