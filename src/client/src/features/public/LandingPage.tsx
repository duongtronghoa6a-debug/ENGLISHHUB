import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, FileText, Bell, ChevronLeft, ChevronRight, Leaf, BookOpen, PlayCircle, User, MessageSquare, Phone, MapPin, Mail, Facebook, Linkedin, Youtube, Menu, Moon, Sun, LogOut } from 'lucide-react';
import logo from '../../assets/logo.png';
import Sidebar from '../../components/common/Sidebar';
import { APP_INFO } from '../../shared';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { courseService } from '../../services/course.service';
import { useEffect } from 'react';

const LandingPage = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Hooks
    const { cartCount } = useCart();
    const { unreadCount, notifications, markAsRead, clearAll } = useNotification();
    const [showNotifications, setShowNotifications] = useState(false);

    // Use global theme state
    const { isDarkMode, toggleTheme } = useTheme();
    // Use auth state
    const { user, isAuthenticated, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const featureItems = [
        { icon: Leaf, label: "Tài liệu\nmiễn phí", path: "/documents/free" },
        { icon: BookOpen, label: "Tài liệu\nTrả phí", path: "/documents/paid" },
        { icon: PlayCircle, label: "Khóa học\nOnline", path: "/courses" },
        { icon: User, label: "Quản lý\ntài khoản", path: "/profile" },
    ];

    return (
        <div className={`min-h-screen transition-all duration-500 font-sans ${isDarkMode
            ? 'bg-[#0B1120] text-gray-100 dark'
            : 'bg-gray-50 text-gray-800'
            }`}>

            {isDarkMode && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[128px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[128px]"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                </div>
            )}

            <div className="flex relative z-10">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <div className="flex-1 md:ml-64 transition-all duration-300 flex flex-col min-h-screen relative">

                    {/* Header - Fixed Z-Index issue */}
                    <header className={`sticky top-0 z-50 flex justify-between md:justify-end items-center px-6 md:px-10 py-4 md:py-5 gap-6 border-b transition-all duration-500 ${isDarkMode
                        ? 'bg-[#0B1120]/80 backdrop-blur-xl border-white/5 shadow-2xl shadow-black/5'
                        : 'bg-white/80 backdrop-blur-md border-gray-100'
                        }`}>
                        <button
                            className={`md:hidden hover:text-primary ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={28} />
                        </button>

                        <div className="flex items-center gap-4 md:gap-6">
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-full transition-all duration-300 ${isDarkMode
                                    ? 'bg-white/10 text-yellow-400 hover:bg-white/20 ring-1 ring-white/10'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            <div className="flex items-center gap-2 md:gap-4 relative">
                                {/* Cart Icon */}
                                <button
                                    onClick={() => navigate('/cart')}
                                    className={`p-2 transition-colors relative ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-primary'}`}
                                >
                                    <ShoppingCart size={24} strokeWidth={1.5} />
                                    {cartCount > 0 && (
                                        <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Icon */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className={`p-2 transition-colors relative ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-primary'}`}
                                    >
                                        <Bell size={24} strokeWidth={1.5} />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-0 right-1 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white dark:ring-black"></span>
                                        )}
                                    </button>

                                    {/* Notifications Dropdown */}
                                    {showNotifications && (
                                        <div className={`absolute right-0 top-full mt-4 w-80 rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in slide-in-from-top-2 ${isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-100'}`}>
                                            <div className="p-4 border-b border-gray-100/10 flex justify-between items-center">
                                                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Thông báo</h3>
                                                <button onClick={clearAll} className="text-xs text-red-500 hover:underline">Xóa tất cả</button>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-500 text-sm">Chưa có thông báo nào</div>
                                                ) : (
                                                    notifications.map(n => (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => markAsRead(n.id)}
                                                            className={`p-4 border-b border-gray-100/5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                                        >
                                                            <h4 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{n.title}</h4>
                                                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{n.message}</p>
                                                            <span className="text-[10px] text-gray-400 mt-2 block">{new Date(n.created_at).toLocaleTimeString()}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isAuthenticated && user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-3 p-1 pr-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                                    >
                                        <img
                                            src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                            alt="User Avatar"
                                            className="w-9 h-9 rounded-full bg-indigo-100"
                                        />
                                        <span className={`text-sm font-bold hidden sm:block ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                            {user.name}
                                        </span>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showUserMenu && (
                                        <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl p-2 border transition-all ${isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-100'
                                            }`}>
                                            <div className="px-4 py-2 border-b border-gray-100/10 mb-2">
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Signed in as</p>
                                                <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.email}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setShowUserMenu(false);
                                                }}
                                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${isDarkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                                                    }`}
                                            >
                                                <LogOut size={16} />
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate('/login')}
                                    className="bg-accent hover:bg-accent-hover text-white px-6 md:px-8 py-2 md:py-2.5 rounded-full font-bold shadow-lg shadow-accent/30 transition-all text-sm whitespace-nowrap active:scale-95"
                                >
                                    Đăng nhập
                                </button>
                            )}
                        </div>
                    </header>

                    <main className="flex-1">
                        <div className="px-6 md:px-10 pb-20">
                            {/* Banner */}
                            <div className="mt-6 md:mt-8 relative w-full h-[300px] md:h-[480px] rounded-[24px] md:rounded-[32px] overflow-hidden group shadow-2xl ring-1 ring-white/10">
                                <img
                                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop"
                                    alt="Students Learning"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

                                {/* Deep Glass Card */}
                                <div className="absolute left-6 md:left-16 top-1/2 -translate-y-1/2 max-w-xs md:max-w-lg w-full pr-4">
                                    <div className="bg-black/30 backdrop-blur-xl border border-white/20 p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-2xl">
                                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 md:mb-4 leading-tight drop-shadow-lg">{APP_INFO.name.first} {APP_INFO.name.last}</h2>
                                        <p className="text-sm md:text-lg text-gray-100 leading-relaxed font-light drop-shadow">
                                            Interactive lessons, practice exercises, and real-life conversation tips.
                                        </p>
                                    </div>
                                </div>

                                <button className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full items-center justify-center text-white border border-white/20 hover:bg-white hover:text-primary transition-all">
                                    <ChevronLeft size={24} />
                                </button>
                                <button className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full items-center justify-center text-white border border-white/20 hover:bg-white hover:text-primary transition-all">
                                    <ChevronRight size={24} />
                                </button>
                            </div>

                            {/* About Us */}
                            <section className="mt-12 md:mt-20">
                                <h3 className={`text-2xl md:text-3xl font-bold mb-6 md:mb-8 ml-2 ${isDarkMode ? 'text-white drop-shadow-lg' : 'text-primary'}`}>About us</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
                                    <div className="space-y-6 md:space-y-8 order-2 md:order-1">
                                        <p className={`leading-loose text-base md:text-lg text-justify font-light ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {APP_INFO.name.first} {APP_INFO.name.last} is a promising and rapidly growing educational technology startup in Vietnam.
                                            It is a comprehensive English learning platform designed to guide learners from basic to advanced levels,
                                            making English accessible and engaging for everyone. It currently serves more than 13 million users across 101 countries worldwide.
                                        </p>
                                        <button className="border-2 border-accent text-accent hover:bg-accent hover:text-white px-8 md:px-10 py-2.5 md:py-3 rounded-full font-bold transition-all text-sm uppercase tracking-wider w-full md:w-auto shadow-lg shadow-accent/20">
                                            Xem chi tiết
                                        </button>
                                    </div>
                                    <div className="relative group order-1 md:order-2">
                                        <div className="absolute inset-0 bg-accent/20 rounded-[32px] md:rounded-[40px] rotate-3 transform transition-transform group-hover:rotate-6"></div>
                                        <img
                                            src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=2574&auto=format&fit=crop"
                                            alt="About Us Team"
                                            className="relative rounded-[32px] md:rounded-[40px] shadow-xl w-full h-[240px] md:h-[320px] object-cover ring-1 ring-white/10"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Features */}
                            <section className="mt-16 md:mt-24 text-center">
                                <h2 className={`text-2xl md:text-3xl font-bold mb-8 md:mb-12 ${isDarkMode ? 'text-white drop-shadow-lg' : 'text-primary'}`}>{APP_INFO.name.first} {APP_INFO.name.last}</h2>
                                <div className="flex justify-center flex-wrap gap-8 md:gap-12">
                                    {featureItems.map((item, index) => (
                                        <div key={index} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-4 group cursor-pointer w-24 md:w-auto">
                                            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isDarkMode
                                                ? 'bg-white/5 text-gray-300 backdrop-blur-md border border-white/10 group-hover:bg-accent group-hover:text-white group-hover:border-accent'
                                                : 'bg-gray-100 text-gray-600 group-hover:bg-accent group-hover:text-white'
                                                }`}>
                                                <item.icon className="w-7 h-7 md:w-8 md:h-8" strokeWidth={1.5} />
                                            </div>
                                            <span className={`text-sm md:text-base whitespace-pre-line leading-tight transition-colors ${isDarkMode ? 'text-gray-400 group-hover:text-accent' : 'text-gray-500 group-hover:text-accent'
                                                }`}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Featured Courses */}
                            <FeaturedCoursesSection />

                            {/* Test Level */}
                            <section className="mt-16 md:mt-24 mb-6 md:mb-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
                                    <div className="order-2 md:order-1">
                                        <h2 className={`text-2xl md:text-3xl font-bold mb-4 md:mb-6 ${isDarkMode ? 'text-white drop-shadow-lg' : 'text-primary'}`}>Làm bài kiểm tra thử</h2>
                                        <p className={`text-base md:text-lg mb-6 md:mb-8 leading-relaxed font-light ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {APP_INFO.name.first} {APP_INFO.name.last} helps you check your English level from there to have a good orientation for yourself
                                        </p>
                                        <button
                                            onClick={() => navigate('/test/00000000-0000-0000-0001-000000000001/take')}
                                            className="border-2 border-accent text-accent hover:bg-accent hover:text-white px-10 md:px-12 py-2.5 md:py-3 rounded-full font-bold transition-all w-full md:w-auto shadow-lg shadow-accent/20"
                                        >
                                            {user?.hasTakenPlacementTest ? 'Xem kết quả đánh giá' : 'Làm bài ngay'}
                                        </button>
                                    </div>
                                    <div className="rounded-[32px] md:rounded-[40px] overflow-hidden shadow-xl order-1 md:order-2 ring-1 ring-white/10">
                                        <img
                                            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2670&auto=format&fit=crop"
                                            alt="Students High Five"
                                            className="w-full h-[240px] md:h-[300px] object-cover hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <footer className={`pt-12 md:pt-16 pb-8 px-6 md:px-10 border-t transition-all duration-500 ${isDarkMode
                            ? 'bg-black/40 backdrop-blur-xl border-white/5'
                            : 'bg-gray-100 border-gray-200'
                            }`}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
                                <div className="col-span-1">
                                    <div className={`p-4 w-fit flex items-center gap-3 rounded-lg ${isDarkMode ? 'bg-white/5 backdrop-blur-sm border border-white/10 text-white' : 'bg-primary text-white'}`}>
                                        <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                                        <div>
                                            <h1 className="font-bold text-lg md:text-xl leading-none">{APP_INFO.name.first}</h1>
                                            <h2 className="font-bold text-lg md:text-xl leading-none">{APP_INFO.name.last}</h2>
                                        </div>
                                    </div>
                                    <p className={`mt-6 text-sm leading-relaxed max-w-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Interactive lessons, practice exercises, and real-life conversation tips.
                                    </p>
                                </div>

                                <div className="hidden md:block col-span-1"></div>

                                <div className="col-span-1 space-y-4">
                                    <div className={`flex items-center gap-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <Phone size={20} className="text-gray-500" />
                                        <span className="font-medium">{APP_INFO.contact.phone}</span>
                                    </div>
                                    <div className={`flex items-center gap-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <MapPin size={20} className="text-gray-500" />
                                        <span className="font-medium">{APP_INFO.contact.address}</span>
                                    </div>
                                    <div className={`flex items-center gap-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <Mail size={20} className="text-gray-500" />
                                        <span className="font-medium">{APP_INFO.contact.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={`flex justify-center md:justify-end gap-4 mt-8 pt-8 border-t ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
                                <button className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"><Facebook size={18} /></button>
                                <button className="bg-blue-700 text-white p-2 rounded-md hover:bg-blue-800"><Linkedin size={18} /></button>
                                <button className={`p-2 rounded-md border hover:bg-gray-50 ${isDarkMode ? 'bg-white/5 text-red-500 border-white/10 hover:bg-white/10' : 'bg-white text-red-500 border-gray-200'}`}><Mail size={18} /></button>
                                <button className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700"><Youtube size={18} /></button>
                            </div>
                        </footer>
                    </main>
                </div>
            </div>
        </div>
    );
};

const FeaturedCoursesSection = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const data = await courseService.getAllCourses();
                // API returns { courses: [...] } based on controller
                if (data && data.courses) {
                    setCourses(data.courses.slice(0, 3)); // Show top 3
                } else if (Array.isArray(data)) {
                    setCourses(data.slice(0, 3));
                }
            } catch (error) {
                console.error("Failed to fetch courses", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    if (loading) return <div className="text-center py-10">Loading courses...</div>;
    if (courses.length === 0) return null;

    return (
        <section className="mt-16 md:mt-24">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-12 text-primary dark:text-white text-center">Khóa học nổi bật</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {courses.map((course) => (
                    <div
                        key={course.id}
                        onClick={() => window.location.href = `/documents/${course.id}`}
                        className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-white/10 group cursor-pointer"
                    >
                        <div className="relative h-48 overflow-hidden">
                            <img
                                src={course.thumbnail_url || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2671&auto=format&fit=crop"}
                                alt={course.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-4 right-4 bg-accent/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full">
                                {course.level || 'Beginner'}
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-lg mb-2 line-clamp-2 dark:text-gray-100 group-hover:text-accent transition-colors">{course.title}</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <img
                                    src={course.teacher?.profile?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                    className="w-8 h-8 rounded-full bg-gray-200"
                                    alt="Teacher"
                                />
                                <span className="text-sm text-gray-500 dark:text-gray-400">{course.teacher?.profile?.full_name || 'Teacher'}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-white/10">
                                <span className="font-bold text-accent text-lg">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}
                                </span>
                                <button className="text-sm font-semibold text-gray-500 hover:text-accent flex items-center gap-1 transition-colors">
                                    Xem chi tiết <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-10 text-center space-x-4">
                <button
                    onClick={() => window.location.href = '/courses'}
                    className="inline-flex items-center gap-2 border-2 border-accent text-accent hover:bg-accent hover:text-white px-8 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-accent/20"
                >
                    Xem tất cả khóa học <ChevronRight size={20} />
                </button>
            </div>
        </section>
    );
};

export default LandingPage;
