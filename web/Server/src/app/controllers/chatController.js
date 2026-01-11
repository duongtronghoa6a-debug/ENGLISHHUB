/**
 * Chat Controller
 * Handles messaging, conversations, and user search for chat
 */

const db = require('../models');
const { Conversation, ConversationParticipant, Message, Account, Learner, Teacher, OfflineClass } = db;
const { Op } = require('sequelize');

/**
 * Get all conversations for current user
 * GET /api/v1/chat/conversations
 */
const getConversations = async (req, res) => {
    try {
        const accountId = req.user.id;

        // Find all conversations the user is part of
        const participations = await ConversationParticipant.findAll({
            where: { account_id: accountId },
            include: [{
                model: Conversation,
                as: 'conversation',
                include: [
                    {
                        model: ConversationParticipant,
                        as: 'participants',
                        include: [{
                            model: Account,
                            as: 'account',
                            attributes: ['id', 'email', 'role'],
                            include: [{
                                model: Learner,
                                as: 'learnerInfo',
                                attributes: ['full_name', 'avatar_url']
                            }, {
                                model: Teacher,
                                as: 'teacherInfo',
                                attributes: ['full_name', 'avatar_url']
                            }]
                        }]
                    },
                    {
                        model: Message,
                        as: 'messages',
                        limit: 1,
                        order: [['created_at', 'DESC']]
                    },
                    {
                        model: OfflineClass,
                        as: 'offlineClass',
                        attributes: ['id', 'class_name']
                    }
                ]
            }],
            order: [[{ model: Conversation, as: 'conversation' }, 'last_message_at', 'DESC']]
        });

        const conversations = participations.map(p => {
            const conv = p.conversation;
            const otherParticipants = conv.participants
                .filter(part => part.account_id !== accountId)
                .map(part => {
                    const acc = part.account;
                    return {
                        accountId: acc.id,
                        email: acc.email,
                        name: acc.learnerInfo?.full_name || acc.teacherInfo?.full_name || acc.email.split('@')[0],
                        avatar: acc.learnerInfo?.avatar_url || acc.teacherInfo?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.email)}&background=random`,
                        role: acc.role
                    };
                });

            return {
                id: conv.id,
                type: conv.type,
                participants: otherParticipants,
                lastMessage: conv.messages[0] || null,
                lastMessageAt: conv.last_message_at,
                offlineClass: conv.offlineClass,
                unreadCount: 0 // TODO: Calculate unread
            };
        });

        res.status(200).json({ success: true, data: conversations });
    } catch (error) {
        console.error('getConversations error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get messages in a conversation
 * GET /api/v1/chat/conversations/:conversationId/messages
 */
const getMessages = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { conversationId } = req.params;
        const { limit = 50, before } = req.query;

        // Verify user is participant
        const participation = await ConversationParticipant.findOne({
            where: { conversation_id: conversationId, account_id: accountId }
        });

        if (!participation) {
            return res.status(403).json({ success: false, message: 'Not a participant' });
        }

        const whereClause = { conversation_id: conversationId };
        if (before) {
            whereClause.created_at = { [Op.lt]: before };
        }

        const messages = await Message.findAll({
            where: whereClause,
            include: [{
                model: Account,
                as: 'sender',
                attributes: ['id', 'email', 'role'],
                include: [{
                    model: Learner,
                    as: 'learnerInfo',
                    attributes: ['full_name', 'avatar_url']
                }, {
                    model: Teacher,
                    as: 'teacherInfo',
                    attributes: ['full_name', 'avatar_url']
                }]
            }],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit)
        });

        // Update last read
        await participation.update({ last_read_at: new Date() });

        res.status(200).json({
            success: true,
            data: messages.reverse().map(m => ({
                id: m.id,
                content: m.content,
                messageType: m.message_type,
                fileUrl: m.file_url,
                createdAt: m.created_at,
                isOwn: m.sender_id === accountId,
                sender: {
                    id: m.sender.id,
                    name: m.sender.learnerInfo?.full_name || m.sender.teacherInfo?.full_name || m.sender.email.split('@')[0],
                    avatar: m.sender.learnerInfo?.avatar_url || m.sender.teacherInfo?.avatar_url || `https://ui-avatars.com/api/?name=U&background=random`,
                    role: m.sender.role
                }
            }))
        });
    } catch (error) {
        console.error('getMessages error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Send a message
 * POST /api/v1/chat/conversations/:conversationId/messages
 */
const sendMessage = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { conversationId } = req.params;
        const { content, messageType = 'text', fileUrl } = req.body;

        // Verify user is participant
        const participation = await ConversationParticipant.findOne({
            where: { conversation_id: conversationId, account_id: accountId }
        });

        if (!participation) {
            return res.status(403).json({ success: false, message: 'Not a participant' });
        }

        const message = await Message.create({
            conversation_id: conversationId,
            sender_id: accountId,
            content,
            message_type: messageType,
            file_url: fileUrl
        });

        // Update conversation last message time
        await Conversation.update(
            { last_message_at: new Date() },
            { where: { id: conversationId } }
        );

        // Get sender info for response
        const sender = await Account.findByPk(accountId, {
            include: [
                { model: Learner, as: 'learnerInfo', attributes: ['full_name', 'avatar_url'] },
                { model: Teacher, as: 'teacherInfo', attributes: ['full_name', 'avatar_url'] }
            ]
        });

        res.status(201).json({
            success: true,
            data: {
                id: message.id,
                content: message.content,
                messageType: message.message_type,
                fileUrl: message.file_url,
                createdAt: message.created_at,
                isOwn: true,
                sender: {
                    id: sender.id,
                    name: sender.learnerInfo?.full_name || sender.teacherInfo?.full_name || sender.email.split('@')[0],
                    avatar: sender.learnerInfo?.avatar_url || sender.teacherInfo?.avatar_url
                }
            }
        });
    } catch (error) {
        console.error('sendMessage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Start a new conversation or get existing one
 * POST /api/v1/chat/conversations
 */
const createConversation = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { targetAccountId, type = 'direct', offlineClassId, initialMessage } = req.body;

        if (!targetAccountId) {
            return res.status(400).json({ success: false, message: 'Target account ID required' });
        }

        // Check if direct conversation already exists
        if (type === 'direct') {
            const existing = await db.sequelize.query(`
                SELECT c.id FROM conversations c
                JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.account_id = :accountId
                JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.account_id = :targetAccountId
                WHERE c.type = 'direct'
                LIMIT 1
            `, {
                replacements: { accountId, targetAccountId },
                type: db.sequelize.QueryTypes.SELECT
            });

            if (existing.length > 0) {
                return res.status(200).json({ success: true, data: { id: existing[0].id, existing: true } });
            }
        }

        // Create new conversation
        const conversation = await Conversation.create({
            type,
            offline_class_id: offlineClassId || null
        });

        // Add participants
        await ConversationParticipant.bulkCreate([
            { conversation_id: conversation.id, account_id: accountId },
            { conversation_id: conversation.id, account_id: targetAccountId }
        ]);

        // Send initial message if provided
        if (initialMessage) {
            await Message.create({
                conversation_id: conversation.id,
                sender_id: accountId,
                content: initialMessage,
                message_type: 'text'
            });
            await conversation.update({ last_message_at: new Date() });
        }

        res.status(201).json({
            success: true,
            data: { id: conversation.id, existing: false }
        });
    } catch (error) {
        console.error('createConversation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Search users by email
 * GET /api/v1/chat/search-users
 */
const searchUsers = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { q, limit = 10 } = req.query;

        if (!q || q.length < 2) {
            return res.status(200).json({ success: true, data: [] });
        }

        const users = await Account.findAll({
            where: {
                id: { [Op.ne]: accountId },
                email: { [Op.iLike]: `%${q}%` },
                is_active: true
            },
            attributes: ['id', 'email', 'role'],
            include: [
                { model: Learner, as: 'learnerInfo', attributes: ['full_name', 'avatar_url'] },
                { model: Teacher, as: 'teacherInfo', attributes: ['full_name', 'avatar_url'] }
            ],
            limit: parseInt(limit)
        });

        res.status(200).json({
            success: true,
            data: users.map(u => ({
                id: u.id,
                email: u.email,
                name: u.learnerInfo?.full_name || u.teacherInfo?.full_name || u.email.split('@')[0],
                avatar: u.learnerInfo?.avatar_url || u.teacherInfo?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.email)}&background=random`,
                role: u.role
            }))
        });
    } catch (error) {
        console.error('searchUsers error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Request offline class consultation (sends chat to teacher)
 * POST /api/v1/chat/consultation
 */
const requestConsultation = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { offlineClassId } = req.body;

        // Get offline class - teacher_id references Account directly
        const offlineClass = await OfflineClass.findByPk(offlineClassId, {
            include: [{ model: Account, as: 'teacher' }]
        });

        if (!offlineClass) {
            return res.status(404).json({ success: false, message: 'Offline class not found' });
        }

        // Teacher's account_id is stored directly in teacher_id
        const teacherAccountId = offlineClass.teacher?.id;
        if (!teacherAccountId) {
            return res.status(400).json({ success: false, message: 'Teacher not found for this class' });
        }

        // Check for existing consultation conversation for this class with this user
        const existingParticipation = await ConversationParticipant.findOne({
            where: { account_id: accountId },
            include: [{
                model: Conversation,
                as: 'conversation',
                where: {
                    type: 'consultation',
                    offline_class_id: offlineClassId
                }
            }]
        });

        if (existingParticipation?.conversation) {
            // Return existing conversation instead of creating new one
            return res.status(200).json({
                success: true,
                message: 'Đã có cuộc trò chuyện với khóa học này',
                data: { conversationId: existingParticipation.conversation.id }
            });
        }

        // Get learner info for message
        const learner = await Learner.findOne({ where: { account_id: accountId } });
        const learnerName = learner?.full_name || 'Một học viên';

        // Create consultation conversation
        const conversation = await Conversation.create({
            type: 'consultation',
            offline_class_id: offlineClassId
        });

        await ConversationParticipant.bulkCreate([
            { conversation_id: conversation.id, account_id: accountId },
            { conversation_id: conversation.id, account_id: teacherAccountId }
        ]);

        // Send consultation message
        const consultationMessage = `Xin chào Thầy/Cô! Em là ${learnerName}, em muốn tham gia khóa học "${offlineClass.class_name}". Em muốn biết thêm thông tin về chi phí, lịch học và cách đăng ký ạ. Mong Thầy/Cô phản hồi sớm. Cảm ơn Thầy/Cô!`;

        await Message.create({
            conversation_id: conversation.id,
            sender_id: accountId,
            content: consultationMessage,
            message_type: 'text'
        });

        await conversation.update({ last_message_at: new Date() });

        res.status(201).json({
            success: true,
            message: 'Đã gửi yêu cầu tư vấn tới giáo viên',
            data: { conversationId: conversation.id }
        });
    } catch (error) {
        console.error('requestConsultation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getConversations,
    getMessages,
    sendMessage,
    createConversation,
    searchUsers,
    requestConsultation
};
