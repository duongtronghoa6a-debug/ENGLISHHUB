/**
 * ConversationParticipant Model
 * Links users to conversations they're part of
 */

module.exports = (sequelize, DataTypes) => {
    const ConversationParticipant = sequelize.define('ConversationParticipant', {
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
        account_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'accounts',
                key: 'id'
            }
        },
        last_read_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        is_muted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'conversation_participants',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['conversation_id', 'account_id']
            }
        ]
    });

    ConversationParticipant.associate = (models) => {
        ConversationParticipant.belongsTo(models.Conversation, {
            foreignKey: 'conversation_id',
            as: 'conversation'
        });
        ConversationParticipant.belongsTo(models.Account, {
            foreignKey: 'account_id',
            as: 'account'
        });
    };

    return ConversationParticipant;
};
