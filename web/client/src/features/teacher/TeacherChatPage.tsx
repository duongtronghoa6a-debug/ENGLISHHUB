import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { MessageCircle, Search, Send, Plus, Loader2, ArrowLeft } from 'lucide-react';

interface Conversation {
    id: string;
    type: string;
    participants: { accountId: string; name: string; avatar: string; email: string; role: string; }[];
    lastMessage: { content: string; createdAt: string; } | null;
    lastMessageAt: string;
    offlineClass?: { id: string; class_name: string };
    unreadCount: number;
}

interface Message {
    id: string;
    content: string;
    messageType: string;
    createdAt: string;
    isOwn: boolean;
    sender: { id: string; name: string; avatar: string; role: string; };
}

interface SearchUser {
    id: string;
    email: string;
    name: string;
    avatar: string;
    role: string;
}

const TeacherChatPage = () => {
    const { isDarkMode } = useTheme();
    const { isAuthenticated } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [showNewChat, setShowNewChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetchConversations();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/chat/conversations');
            if (res.data.success) {
                setConversations(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        try {
            setMessagesLoading(true);
            const res = await api.get(`/chat/conversations/${conversationId}/messages`);
            if (res.data.success) {
                setMessages(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleSelectConversation = (conv: Conversation) => {
        setActiveConversation(conv);
        fetchMessages(conv.id);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        try {
            const res = await api.post(`/chat/conversations/${activeConversation.id}/messages`, {
                content: newMessage.trim()
            });
            if (res.data.success) {
                setMessages(prev => [...prev, res.data.data]);
                setNewMessage('');
                fetchConversations();
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setSearchLoading(true);
            const res = await api.get(`/chat/search-users?q=${encodeURIComponent(query)}`);
            if (res.data.success) {
                setSearchResults(res.data.data);
            }
        } catch (error) {
            console.error('Failed to search users:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleStartConversation = async (targetUser: SearchUser) => {
        try {
            const res = await api.post('/chat/conversations', {
                targetAccountId: targetUser.id,
                type: 'direct'
            });
            if (res.data.success) {
                setShowNewChat(false);
                setSearchQuery('');
                setSearchResults([]);
                await fetchConversations();
                const newConvId = res.data.data.id;
                const conv = conversations.find(c => c.id === newConvId) || {
                    id: newConvId,
                    type: 'direct',
                    participants: [targetUser],
                    lastMessage: null,
                    lastMessageAt: new Date().toISOString(),
                    unreadCount: 0
                };
                handleSelectConversation(conv as Conversation);
            }
        } catch (error) {
            console.error('Failed to start conversation:', error);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Hôm qua';
        } else if (days < 7) {
            return date.toLocaleDateString('vi-VN', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Tin nhắn</h1>

            <div className={`flex h-[calc(100vh-200px)] rounded-2xl overflow-hidden ${isDarkMode ? 'bg-[#0d1117]' : 'bg-white'
                } shadow-xl`}>
                {/* Sidebar - Conversation List */}
                <div className={`w-80 flex-shrink-0 border-r ${isDarkMode ? 'border-white/10 bg-[#151e32]' : 'border-gray-200 bg-gray-50'
                    } ${activeConversation ? 'hidden md:flex' : 'flex'} flex-col`}>
                    {/* Header */}
                    <div className="p-4 border-b border-inherit">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Cuộc trò chuyện</h2>
                            <button
                                onClick={() => setShowNewChat(true)}
                                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white'
                            }`}>
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm cuộc trò chuyện..."
                                className="bg-transparent flex-1 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Chưa có cuộc trò chuyện nào
                                </p>
                                <button
                                    onClick={() => setShowNewChat(true)}
                                    className="text-indigo-500 text-sm mt-2 hover:underline"
                                >
                                    Bắt đầu chat ngay
                                </button>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <div
                                    key={conv.id}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${activeConversation?.id === conv.id
                                            ? isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'
                                            : isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                                        }`}
                                >
                                    <img
                                        src={conv.participants[0]?.avatar || 'https://ui-avatars.com/api/?name=U'}
                                        alt=""
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold truncate">
                                                {conv.participants[0]?.name || 'Unknown'}
                                            </span>
                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {conv.lastMessage?.content || 'Bắt đầu cuộc trò chuyện'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className={`p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'} flex items-center gap-4`}>
                                <button
                                    onClick={() => setActiveConversation(null)}
                                    className="md:hidden p-2 hover:bg-gray-500/10 rounded-lg"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <img
                                    src={activeConversation.participants[0]?.avatar}
                                    alt=""
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                    <h3 className="font-bold">{activeConversation.participants[0]?.name}</h3>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {activeConversation.participants[0]?.role === 'teacher' ? 'Giáo viên' :
                                            activeConversation.participants[0]?.role === 'admin' ? 'Quản trị viên' : 'Học viên'}
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messagesLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Bắt đầu cuộc trò chuyện
                                        </p>
                                    </div>
                                ) : (
                                    messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%] ${msg.isOwn
                                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                                    : isDarkMode ? 'bg-white/10' : 'bg-gray-100'
                                                } rounded-2xl px-4 py-3`}>
                                                {!msg.isOwn && (
                                                    <p className={`text-xs font-bold mb-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                        {msg.sender.name}
                                                    </p>
                                                )}
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                <p className={`text-xs mt-1 ${msg.isOwn ? 'text-white/60' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {formatTime(msg.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className={`p-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Nhập tin nhắn..."
                                        className={`flex-1 px-4 py-3 rounded-xl outline-none ${isDarkMode ? 'bg-white/5 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900'
                                            }`}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <MessageCircle className="w-24 h-24 text-indigo-500 mb-4 opacity-30" />
                            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Chọn cuộc trò chuyện
                            </h3>
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Hoặc bắt đầu một cuộc trò chuyện mới
                            </p>
                        </div>
                    )}
                </div>

                {/* New Chat Modal */}
                {showNewChat && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className={`w-full max-w-md rounded-2xl p-6 ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'
                            }`}>
                            <h3 className="text-xl font-bold mb-4">Cuộc trò chuyện mới</h3>

                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'
                                }`}>
                                <Search className="w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Tìm kiếm bằng email..."
                                    className="bg-transparent flex-1 outline-none"
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto">
                                {searchLoading ? (
                                    <div className="py-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(usr => (
                                        <div
                                            key={usr.id}
                                            onClick={() => handleStartConversation(usr)}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                                                }`}
                                        >
                                            <img
                                                src={usr.avatar}
                                                alt=""
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div>
                                                <p className="font-bold">{usr.name}</p>
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {usr.email}
                                                </p>
                                            </div>
                                            <span className={`ml-auto text-xs px-2 py-1 rounded ${usr.role === 'teacher' ? 'bg-purple-500/20 text-purple-400' :
                                                    usr.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {usr.role === 'teacher' ? 'Giáo viên' :
                                                    usr.role === 'admin' ? 'Admin' : 'Học viên'}
                                            </span>
                                        </div>
                                    ))
                                ) : searchQuery.length >= 2 ? (
                                    <div className="py-8 text-center text-gray-400">
                                        Không tìm thấy người dùng
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-400">
                                        Nhập email để tìm kiếm
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setShowNewChat(false);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className={`w-full mt-4 py-2 rounded-lg font-bold ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                                    }`}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherChatPage;
