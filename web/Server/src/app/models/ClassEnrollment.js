const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ClassEnrollment extends Model {
        static associate(models) {
            ClassEnrollment.belongsTo(models.OfflineClass, {
                foreignKey: 'class_id',
                as: 'offlineClass'
            });
            ClassEnrollment.belongsTo(models.Account, {
                foreignKey: 'learner_account_id',
                as: 'learner'
            });
        }
    }

    ClassEnrollment.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        class_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        learner_account_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending'
        },
        requested_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        reviewed_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'ClassEnrollment',
        tableName: 'class_enrollments',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['class_id', 'learner_account_id']
            }
        ]
    });

    return ClassEnrollment;
};
