/**
 * Message Model
 * Chat messages within conversations
 */

module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        conversation_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'conversations',
                key: 'id'
            }
        },
        sender_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'accounts',
                key: 'id'
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        message_type: {
            type: DataTypes.ENUM('text', 'image', 'file', 'system'),
            defaultValue: 'text'
        },
        file_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'messages',
        timestamps: true,
        underscored: true
    });

    Message.associate = (models) => {
        Message.belongsTo(models.Conversation, {
            foreignKey: 'conversation_id',
            as: 'conversation'
        });
        Message.belongsTo(models.Account, {
            foreignKey: 'sender_id',
            as: 'sender'
        });
    };

    return Message;
};
