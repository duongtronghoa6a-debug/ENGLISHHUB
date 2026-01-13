const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Admin extends Model {
        static associate(models) {
            Admin.belongsTo(models.Account, {
                foreignKey: 'account_id',
                as: 'account'
            });
        }
    }

    Admin.init({
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
        }
    }, {
        sequelize,
        modelName: 'Admin',
        tableName: 'admins',
        timestamps: false
    });

    return Admin;
};