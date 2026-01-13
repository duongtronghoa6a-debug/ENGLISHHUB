const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Module extends Model {
        static associate(models) {
            Module.belongsTo(models.Course, {
                foreignKey: 'course_id',
                as: 'course'
            });
            Module.hasMany(models.Lesson, {
                foreignKey: 'module_id',
                as: 'lessons'
            });
        }
    }

    Module.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        course_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        order_index: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'Module',
        tableName: 'modules',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Module;
};
