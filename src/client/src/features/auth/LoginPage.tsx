import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, ArrowLeft, EyeOff } from 'lucide-react';
import logo from '../../assets/logo.png';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../data/mockData';
import { authService } from '../../services/auth.service';

const LoginPage = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { login } = useAuth();

    const [role, setRole] = useState('student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Mock Admin Login Rule
        if (email === 'admin' && password === 'password') {
            // Mock Admin User Object
            const mockAdminUser = {
                email: 'admin@englishhub.com',
                name: 'Administrator',
                role: 'admin',
                avatar: 'https://ui-avatars.com/api/?name=Admin&background=random'
            };

            // Login with mock data (Bypassing API for this specific case as requested)
            // In a real scenario, this would still go through API
            // But if API doesn't support "admin" username (email format), we mock it here.
            login({ token: 'mock-admin-token', user: mockAdminUser });
            navigate('/admin');
            return;
        }

        try {
            // Map frontend role ('student') to backend role ('learner')
            const backendRole = role === 'student' ? 'learner' : role;
            const data = await authService.login(email, password, backendRole);
            login(data); // data contains { token, user }

            // Redirect based on role
            // The API returns role in UPPERCASE probably, so let's normalize
            const userRole = data.user.role?.toLowerCase();
            if (userRole === 'teacher') navigate('/teacher');
            else if (userRole === 'admin') navigate('/admin');
            else navigate('/home'); // Student

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Thông tin đăng nhập không chính xác!');
        }
    };

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-500 relative overflow-hidden ${isDarkMode
            ? "bg-[#0B1120] text-gray-100"
            : "bg-gray-50 text-gray-900"
            }`}>

            {/* Rich Gradient Background (Replaces simple colors) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${isDarkMode ? 'opacity-100' : 'opacity-100'}`}>
                {isDarkMode ? (
                    // Dark Mode: Deep Galactic Blue/Purple
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a237e] via-[#000000] to-[#000000]"></div>
                ) : (
                    // Light Mode: Vibrant Blue/Cyan Gradient (Like Reference)
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF] via-[#3B82F6] to-[#93C5FD]"></div>
                )}
            </div>

            {/* Back Button */}
            <div className="absolute top-8 left-8 z-20">
                <button
                    onClick={() => navigate('/home')}
                    className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all shadow-lg"
                >
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* Login Card */}
            <div className={`relative z-10 rounded-3xl p-8 md:p-12 w-full max-w-lg shadow-2xl transition-all duration-500 ${isDarkMode
                ? 'bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 shadow-black/50'
                : 'bg-white/95 backdrop-blur-xl border border-white/50 shadow-blue-900/20'
                }`}>
                <div className="flex justify-center mb-6">
                    <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
                </div>

                <h1 className={`text-3xl font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Welcome Back!
                </h1>
                <p className={`text-center mb-8 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Login to access your learning journey
                </p>

                <form onSubmit={handleLogin} className="space-y-6">

                    {/* Role Selection */}
                    <div className="grid grid-cols-2 gap-4 p-1 rounded-xl bg-gray-100/50 backdrop-blur-sm border border-gray-200/50">
                        {ROLES.map((r: { id: string; label: string }) => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => setRole(r.id)}
                                className={`py-2 rounded-lg text-sm font-bold transition-all ${role === r.id
                                    ? 'bg-white text-blue-600 shadow-md'
                                    : 'text-gray-500 hover:bg-white/50'
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className={`font-medium text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email / Username</label>
                        <input
                            type="text"
                            required
                            placeholder="example@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${isDarkMode
                                ? 'bg-black/40 border-white/10 focus:border-blue-500 text-white focus:ring-blue-500/20 placeholder:text-gray-600'
                                : 'bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900 focus:ring-blue-200'
                                }`}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className={`font-medium text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                            <Link to="/forgot-password" className="text-blue-500 text-sm hover:underline">Quên mật khẩu?</Link>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all pr-12 ${isDarkMode
                                    ? 'bg-black/40 border-white/10 focus:border-blue-500 text-white focus:ring-blue-500/20 placeholder:text-gray-600'
                                    : 'bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900 focus:ring-blue-200'
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 active:scale-95 text-lg"
                    >
                        Login
                    </button>

                    <div className={`text-center mt-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Don't Have An Account ? <span className="text-blue-500 font-bold cursor-pointer hover:underline" onClick={() => navigate('/register')}>Sign Up</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
