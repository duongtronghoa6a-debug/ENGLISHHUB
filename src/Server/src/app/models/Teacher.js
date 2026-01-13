const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Teacher extends Model {
        static associate(models) {
            Teacher.belongsTo(models.Account, {
                foreignKey: 'account_id',
                as: 'account'
            });
            Teacher.hasMany(models.Course, {
                foreignKey: 'teacher_id',
                as: 'courses'
            });
        }
    }

    Teacher.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        account_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        full_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        avatar_url: {
            type: DataTypes.STRING(2048),
            allowNull: true
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        specialization: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Teacher',
        tableName: 'teachers',
        timestamps: false
    });

    return Teacher;
};