const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Rubric extends Model {
        static associate(models) {
            Rubric.hasMany(models.Question, {
                foreignKey: 'rubric_id',
                as: 'questions'
            });
        }
    }

    Rubric.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        criteria: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Rubric',
        tableName: 'rubrics',
        timestamps: false
    });

    return Rubric;
};
