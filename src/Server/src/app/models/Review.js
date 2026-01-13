const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Review extends Model {
        static associate(models) {
            Review.belongsTo(models.Learner, {
                foreignKey: 'learner_id',
                as: 'learner'
            });
            Review.belongsTo(models.Course, {
                foreignKey: 'course_id',
                as: 'course'
            });
        }
    }

    Review.init({
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
        course_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 5 }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'Review',
        tableName: 'reviews',
        timestamps: false
    });

    return Review;
};