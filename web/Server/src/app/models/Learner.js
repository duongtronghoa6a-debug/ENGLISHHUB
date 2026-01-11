const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Learner extends Model {
        static associate(models) {
            Learner.belongsTo(models.Account, {
                foreignKey: 'account_id',
                as: 'account'
            });
            Learner.hasMany(models.CartItem, {
                foreignKey: 'learner_id',
                as: 'cartItems'
            });
            Learner.hasMany(models.Order, {
                foreignKey: 'learner_id',
                as: 'orders'
            });
            Learner.hasMany(models.Enrollment, {
                foreignKey: 'learner_id',
                as: 'enrollments'
            });
            Learner.hasMany(models.Review, {
                foreignKey: 'learner_id',
                as: 'reviews'
            });
        }
    }

    Learner.init({
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
        current_xp: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        current_streak: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        english_level: {
            type: DataTypes.ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
            defaultValue: 'A2'
        },
        gender: {
            type: DataTypes.ENUM('male', 'female', 'other'),
            allowNull: true
        },
        date_of_birth: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        phone_number: {
            type: DataTypes.STRING(15),
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Learner',
        tableName: 'learners',
        timestamps: false
    });

    return Learner;
};