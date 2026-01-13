import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Home,
    BookOpen,
    FileText,
    ClipboardList,
    Settings,
    LogOut,
    Bell,
    Menu,
    User,
    Sun,
    Moon,
    Calendar,
    MessageCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const TeacherLayout = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Role restriction: Only allow teachers
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (user?.role !== 'teacher' && user?.role !== 'admin') {
            alert('Bạn không có quyền truy cập trang này. Chỉ dành cho giáo viên.');
            navigate('/home');
        }
    }, [isAuthenticated, user, navigate]);

    const menuItems = [
        { path: '/teacher', icon: Home, label: 'Trang chủ' },
        { path: '/teacher/courses', icon: BookOpen, label: 'Khóa học của tôi' },
        { path: '/teacher/lessons', icon: FileText, label: 'Bài học' },
        { path: '/teacher/offline-classes', icon: Calendar, label: 'Khóa học offline' },
        { path: '/teacher/exams', icon: ClipboardList, label: 'Quản lí đề thi' },
        { path: '/teacher/chat', icon: MessageCircle, label: 'Tin nhắn' },
        { path: '/teacher/settings', icon: Settings, label: 'Cài đặt' },
        { path: '/teacher/profile', icon: User, label: 'Hồ sơ' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={`min-h-screen flex font-sans ${isDarkMode ? 'bg-[#0B1120] text-gray-100' : 'bg-gray-50 text-gray-800'}`}>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 bg-[#1a237e] text-white transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>

                {/* Logo Area */}
                <div className="h-16 flex items-center px-4 border-b border-white/10">
                    <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                    {isSidebarOpen && <span className="ml-3 font-bold text-lg tracking-wide">ENGLISH HUB</span>}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 space-y-1 px-3">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center p-3 rounded-xl transition-all ${isActive
                                    ? 'bg-white/20 shadow-lg'
                                    : 'hover:bg-white/10 text-gray-300 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} className={isActive ? 'text-white' : ''} />
                                {isSidebarOpen && <span className="ml-3 text-sm font-medium">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center p-3 rounded-xl hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-all"
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="ml-3 text-sm font-medium">Đăng xuất</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>

                {/* Header */}
                <header className={`h-16 sticky top-0 z-40 px-6 flex items-center justify-between backdrop-blur-md shadow-sm ${isDarkMode ? 'bg-[#0B1120]/80' : 'bg-white/80'
                    }`}>

                    {/* Left: Sidebar Toggle & Welcome */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
                            <Menu size={20} />
                        </button>
                        <span className="text-sm text-gray-500">Chào mừng đến với English HUB</span>
                    </div>

                    {/* Right: Actions & User */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                            title={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
                            <Bell size={20} />
                        </button>

                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-white/10">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-bold">{user?.name || 'Giáo viên'}</div>
                                <div className="text-xs text-gray-500">Giáo viên</div>
                            </div>
                            <img
                                src={user?.avatar || "https://ui-avatars.com/api/?name=Teacher&background=1a237e&color=fff"}
                                alt="Avatar"
                                className="w-9 h-9 rounded-full border-2 border-blue-500"
                            />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default TeacherLayout;
