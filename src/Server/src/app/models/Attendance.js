const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Attendance extends Model {
        static associate(models) {
            Attendance.belongsTo(models.OfflineClass, {
                foreignKey: 'class_id',
                as: 'class'
            });
            Attendance.belongsTo(models.Account, {
                foreignKey: 'learner_id',
                as: 'learner'
            });
        }
    }

    Attendance.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        class_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        learner_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('enrolled', 'present', 'absent'),
            defaultValue: 'enrolled'
        }
    }, {
        sequelize,
        modelName: 'Attendance',
        tableName: 'attendances',
        timestamps: false
    });

    return Attendance;
};
