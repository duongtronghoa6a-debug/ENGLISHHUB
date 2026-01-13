const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Account extends Model {
        static associate(models) {
            // Account has one Learner profile
            Account.hasOne(models.Learner, {
                foreignKey: 'account_id',
                as: 'learnerInfo'
            });

            // Account has one Admin profile
            Account.hasOne(models.Admin, {
                foreignKey: 'account_id',
                as: 'adminInfo'
            });

            // Account has one Teacher profile
            Account.hasOne(models.Teacher, {
                foreignKey: 'account_id',
                as: 'teacherInfo'
            });

            // Account creates Questions
            Account.hasMany(models.Question, {
                foreignKey: 'creator_id',
                as: 'questions'
            });

            // Account creates Exams
            Account.hasMany(models.Exam, {
                foreignKey: 'creator_id',
                as: 'exams'
            });

            // Account teaches OfflineClasses
            Account.hasMany(models.OfflineClass, {
                foreignKey: 'teacher_id',
                as: 'offlineClasses'
            });
        }
    }

    Account.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('admin', 'teacher', 'learner'),
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        reset_password_token: {
            type: DataTypes.STRING,
            allowNull: true
        },
        reset_password_expires: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Account',
        tableName: 'accounts',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at'
    });

    return Account;
};