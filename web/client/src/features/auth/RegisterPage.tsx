import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import logo from '../../assets/logo.png';
import { useTheme } from '../../context/ThemeContext';
import { ROLES } from '../../data/mockData';
import { authService } from '../../services/auth.service';
import { useNotification } from '../../context/NotificationContext';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    const [role, setRole] = useState('student');
    const [isMockUser, setIsMockUser] = useState(false); // To bypass rule for mock

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Check if user is typing the mock credentials to bypass
        if (e.target.name === 'email' && e.target.value === '01@gmail.com') setIsMockUser(true);
    };

    const { addNotification } = useNotification();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu nhập lại không khớp!');
            return;
        }

        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }

        try {
            // role is state 'student' | 'teacher' (lowercase ids from ROLES)
            // API expects Uppercase probably? Docs say "LEARNER", "TEACHER".
            // ROLES in mockData are likely lowercase id.
            // Let's map it.
            const apiRole = role === 'teacher' ? 'TEACHER' : 'LEARNER';

            await authService.register(formData.email, formData.password, apiRole);

            addNotification('Đăng ký thành công!', 'Chào mừng bạn đến với English HUB. Hãy đăng nhập ngay.', 'success');
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Đăng ký thất bại. Email có thể đã tồn tại.');
        }
    };

    return (
        <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-500 overflow-hidden relative ${isDarkMode ? "bg-[#0B1120]" : "bg-white"
            }`}>
            {/* Back Button */}
            <div className="absolute top-6 left-6 z-30">
                <button
                    onClick={() => navigate('/login')}
                    className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all shadow-lg"
                >
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* Left Side - Dark Rich Gradient Area */}
            <div className="md:w-1/2 p-12 flex flex-col justify-between relative order-2 md:order-1 overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#3B82F6] z-0"></div>
                {isDarkMode && <div className="absolute inset-0 bg-black/40 z-0"></div>}

                {/* Decorative */}
                <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="w-20 h-20 rounded-full border-2 border-white/30 flex items-center justify-center p-2 mb-12 bg-white/10 backdrop-blur-sm">
                        <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>

                    <h1 className="text-5xl md:text-7xl font-light text-white italic leading-tight mb-8">
                        Log in and <br />
                        unlock your <br />
                        English <br />
                        potential!
                    </h1>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className={`md:w-1/2 flex items-center justify-center p-8 md:p-12 order-1 md:order-2 relative ${isDarkMode ? 'bg-[#0f172a]' : 'bg-white'
                }`}>
                <div className="w-full max-w-md relative z-10">
                    <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create an account</h2>
                    <p className={`mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start your 30-day free trial.</p>

                    <form onSubmit={handleRegister} className="space-y-5">

                        {/* Role Selection */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {ROLES.map((r: { id: string; label: string }) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setRole(r.id)}
                                    className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${role === r.id
                                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                                        : `border-transparent ${isDarkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`
                                        }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Email</label>
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="name@email.com"
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all ${isDarkMode
                                    ? 'bg-black/30 border-white/10 focus:border-blue-500 text-white'
                                    : 'bg-white border-gray-300 focus:border-blue-500'
                                    }`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Create a password"
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all pr-12 ${isDarkMode
                                        ? 'bg-black/30 border-white/10 focus:border-blue-500 text-white'
                                        : 'bg-white border-gray-300 focus:border-blue-500'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Confirm Password</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                placeholder="Confirm your password"
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all ${isDarkMode
                                    ? 'bg-black/30 border-white/10 focus:border-blue-500 text-white'
                                    : 'bg-white border-gray-300 focus:border-blue-500'
                                    }`}
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg active:scale-95"
                        >
                            Create account
                        </button>

                        <div className={`text-center mt-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Already Have An Account ? <span className="text-blue-600 font-bold cursor-pointer hover:underline" onClick={() => navigate('/login')}>Log In</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
