const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Order extends Model {
        static associate(models) {
            Order.belongsTo(models.Learner, {
                foreignKey: 'learner_id',
                as: 'learner'
            });
            Order.hasMany(models.OrderItem, {
                foreignKey: 'order_id',
                as: 'items'
            });
        }
    }

    Order.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        learner_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
            defaultValue: 'pending'
        },
        payment_method: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        items_json: {
            type: DataTypes.JSON,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'Order',
        tableName: 'orders',
        timestamps: false
    });

    return Order;
};