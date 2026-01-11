/**
 * Conversation Model
 * Represents a chat conversation between users
 */

module.exports = (sequelize, DataTypes) => {
    const Conversation = sequelize.define('Conversation', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        type: {
            type: DataTypes.ENUM('direct', 'consultation', 'support'),
            defaultValue: 'direct'
        },
        offline_class_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'offline_classes',
                key: 'id'
            }
        },
        last_message_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'conversations',
        timestamps: true,
        underscored: true
    });

    Conversation.associate = (models) => {
        Conversation.hasMany(models.Message, {
            foreignKey: 'conversation_id',
            as: 'messages'
        });
        Conversation.hasMany(models.ConversationParticipant, {
            foreignKey: 'conversation_id',
            as: 'participants'
        });
        Conversation.belongsTo(models.OfflineClass, {
            foreignKey: 'offline_class_id',
            as: 'offlineClass'
        });
    };

    return Conversation;
};
