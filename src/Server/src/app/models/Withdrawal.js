const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Withdrawal extends Model {
        static associate(models) {
            Withdrawal.belongsTo(models.Teacher, {
                foreignKey: 'teacher_id',
                as: 'teacher'
            });
            Withdrawal.belongsTo(models.Account, {
                foreignKey: 'processed_by',
                as: 'processor'
            });
        }
    }

    Withdrawal.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        teacher_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid'),
            defaultValue: 'pending'
        },
        bank_name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        bank_account: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        bank_holder_name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        processed_by: {
            type: DataTypes.UUID,
            allowNull: true,
            // Note: This references Account.id but we don't enforce FK constraint
            // because database might have old FK to admins table
        },
        processed_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Withdrawal',
        tableName: 'withdrawals',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Withdrawal;
};
