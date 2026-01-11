import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Bell, Menu, Sun, Moon, LogOut, Phone, MapPin, Mail, Facebook, Linkedin, Youtube, Search } from 'lucide-react';
import logo from '../assets/logo.png'; // Verify path
import Sidebar from '../components/common/Sidebar'; // Verify path
import { APP_INFO } from '../shared';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';

const Layout = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Hooks
    const { cartCount } = useCart();
    const { unreadCount, notifications, markAsRead, clearAll } = useNotification();
    const [showNotifications, setShowNotifications] = useState(false);

    // Use global theme state
    const { isDarkMode, toggleTheme } = useTheme();
    const { user, isAuthenticated, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    return (
        <div className={`min-h-screen transition-all duration-500 font-sans ${isDarkMode
            ? 'bg-[#0B1120] text-gray-100 dark'
            : 'bg-gray-50 text-gray-800'
            }`}>

            {/* Background Orbs */}
            {isDarkMode && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[128px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[128px]"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                </div>
            )}

            <div className="flex relative z-10">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <div className="flex-1 md:ml-64 transition-all duration-300 flex flex-col min-h-screen">

                    {/* Header */}
                    <header className={`sticky top-0 z-30 flex justify-between md:justify-end items-center px-6 md:px-10 py-4 md:py-5 gap-6 border-b transition-all duration-500 ${isDarkMode
                        ? 'bg-black/20 backdrop-blur-xl border-white/5 shadow-2xl shadow-black/5'
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
                                                            className={`p-4 border-b border-gray-100/5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                                        >
                                                            <h4 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{n.title}</h4>
                                                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{n.message}</p>
                                                            <span className="text-[10px] text-gray-400 mt-2 block">{new Date(n.timestamp).toLocaleTimeString()}</span>
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
                                            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                                            alt="User Avatar"
                                            className="w-9 h-9 rounded-full bg-indigo-100"
                                        />
                                        <span className={`text-sm font-bold hidden sm:block ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                            {user.name || user.email?.split('@')[0]}
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
                        <div className="px-6 md:px-10 pb-20 pt-6">
                            {children}
                        </div>
                    </main>

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
                </div>
            </div>
        </div>
    );
};

export default Layout;
