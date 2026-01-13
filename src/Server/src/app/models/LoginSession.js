/**
 * LoginSession Model
 * Tracks user login sessions for multi-device management
 */

module.exports = (sequelize, DataTypes) => {
    const LoginSession = sequelize.define('LoginSession', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        account_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'accounts',
                key: 'id'
            }
        },
        token_hash: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Hashed JWT token for identification'
        },
        device_info: {
            type: DataTypes.STRING(500),
            allowNull: true,
            comment: 'Browser/Device user agent info'
        },
        device_type: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Desktop, Mobile, Tablet'
        },
        browser: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        os: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        ip_address: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        location: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'City, Country from IP'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        is_current: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Is this the current session?'
        },
        last_activity: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'login_sessions',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['account_id'] },
            { fields: ['is_active'] },
            { fields: ['token_hash'] }
        ]
    });

    LoginSession.associate = (models) => {
        LoginSession.belongsTo(models.Account, {
            foreignKey: 'account_id',
            as: 'account'
        });
    };

    return LoginSession;
};
