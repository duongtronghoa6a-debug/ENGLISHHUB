/**
 * SystemSetting Model
 * Stores system-wide settings as key-value pairs
 */

module.exports = (sequelize, DataTypes) => {
    const SystemSetting = sequelize.define('SystemSetting', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        value_type: {
            type: DataTypes.ENUM('string', 'boolean', 'number', 'json'),
            defaultValue: 'string'
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true
        }
    }, {
        tableName: 'system_settings',
        timestamps: true,
        underscored: true
    });

    // Helper to get parsed value
    SystemSetting.getValue = async function (key, defaultValue = null) {
        const setting = await this.findOne({ where: { key } });
        if (!setting) return defaultValue;

        switch (setting.value_type) {
            case 'boolean':
                return setting.value === 'true';
            case 'number':
                return parseFloat(setting.value);
            case 'json':
                try { return JSON.parse(setting.value); } catch { return defaultValue; }
            default:
                return setting.value;
        }
    };

    // Helper to set value
    SystemSetting.setValue = async function (key, value, value_type = 'string', description = null) {
        const stringValue = value_type === 'json' ? JSON.stringify(value) : String(value);
        const [setting, created] = await this.findOrCreate({
            where: { key },
            defaults: { value: stringValue, value_type, description }
        });
        if (!created) {
            setting.value = stringValue;
            if (description) setting.description = description;
            await setting.save();
        }
        return setting;
    };

    return SystemSetting;
};
