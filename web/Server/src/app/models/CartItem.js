const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CartItem extends Model {
        static associate(models) {
            CartItem.belongsTo(models.Learner, {
                foreignKey: 'learner_id',
                as: 'learner'
            });
            CartItem.belongsTo(models.Course, {
                foreignKey: 'course_id',
                as: 'course'
            });
        }
    }

    CartItem.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        learner_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        course_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        added_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'CartItem',
        tableName: 'cart_items',
        timestamps: false
    });

    return CartItem;
};