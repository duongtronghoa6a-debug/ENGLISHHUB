import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Settings, Leaf, BookOpen, PlayCircle, User, Sparkles, Trophy, FileText, MessageCircle } from 'lucide-react';
import logo from '../../assets/logo.png';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: Home, label: "Trang chủ", path: "/home", active: location.pathname === "/home" },
        { icon: Leaf, label: "Tài liệu miễn phí", path: "/documents/free", active: location.pathname === "/documents/free" },
        { icon: BookOpen, label: "Tài liệu trả phí", path: "/documents/paid", active: location.pathname === "/documents/paid" },
        { icon: PlayCircle, label: "Khóa học offline", path: "/offline-courses", active: location.pathname === "/offline-courses" },
        { icon: Sparkles, label: "Luyện tập với AI", path: "/ai-practice", active: location.pathname === "/ai-practice" },
        { icon: Trophy, label: "Xếp hạng & Streak", path: "/leaderboard", active: location.pathname === "/leaderboard" },
        { icon: FileText, label: "Bài kiểm tra", path: "/tests", active: location.pathname === "/tests" },
        { icon: User, label: "Quản lý tài khoản", path: "/profile", active: location.pathname === "/profile" },
    ];

    const bottomItems = [
        { icon: MessageCircle, label: "Tin nhắn", path: "/chat", active: location.pathname === "/chat" },
        { icon: Settings, label: "Cài đặt", path: "/settings", active: location.pathname === "/settings" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                ></div>
            )}

            <div className={`
                bg-primary text-white h-screen fixed left-0 top-0 flex flex-col justify-between overflow-y-auto border-r border-white/5 z-50 transition-transform duration-300 w-64
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div>
                    {/* Logo Area */}
                    <div className="p-6 flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                            {/* Use Image Logo */}
                            <img src={logo} alt="English HUB Logo" className="w-10 h-10 object-contain" />
                            <div>
                                <h1 className="font-bold text-xl leading-none tracking-wide text-white">ENGLISH</h1>
                                <h2 className="font-bold text-xl leading-none tracking-wide text-white">HUB</h2>
                            </div>
                        </div>
                        {/* Mobile Close Button */}
                        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <nav className="px-4 space-y-2">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${item.active
                                    ? 'bg-accent text-white shadow-lg shadow-accent/20 font-bold'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <item.icon size={22} strokeWidth={item.active ? 2.5 : 2} className={`transition-transform duration-300 group-hover:scale-110 ${item.active ? 'scale-110' : ''}`} />
                                <span className="text-sm tracking-wide">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-white/10">
                    <div className="space-y-2 mb-4">
                        {bottomItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${item.active
                                    ? 'bg-accent text-white font-bold'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon size={22} strokeWidth={2} />
                                <span className="text-sm font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="text-center py-2">
                        <span className="text-xs text-gray-500 font-medium">V1.0.0</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
