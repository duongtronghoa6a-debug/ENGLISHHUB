import { useNavigate } from 'react-router-dom';

const IntroPage = () => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen bg-gray-900 flex items-center justify-center overflow-hidden font-sans">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2670&auto=format&fit=crop"
                    alt="Future VR Education"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-5xl w-full px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        WELCOME! <br />
                        YOUR ENGLISH <br />
                        JOURNEY STARTS <br />
                        HERE
                    </h1>
                    <p className="text-xl text-gray-300 mb-10 max-w-lg leading-relaxed">
                        Interactive lessons, practice exercises, and real-life conversation tips.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => navigate('/test/00000000-0000-0000-0001-000000000001/take')}
                            className="bg-cyan-500 text-white text-lg font-bold px-8 py-4 rounded-xl hover:bg-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-1"
                        >
                            Làm bài kiểm tra đầu vào
                        </button>
                        <button
                            onClick={() => navigate('/home')}
                            className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-lg font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-all shadow-lg transform hover:-translate-y-1"
                        >
                            Bỏ qua
                        </button>
                    </div>
                </div>

                {/* Features / Steps (Optional visual element matching design) */}
                <div className="hidden md:flex gap-6 mt-12 md:mt-0">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex-1 transform translate-y-8">
                        <h3 className="text-3xl font-bold text-white mb-2">01</h3>
                        <p className="text-gray-300 text-sm">Interactive Lessons: Learn English through real-life conversations.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex-1">
                        <h3 className="text-3xl font-bold text-white mb-2">02</h3>
                        <p className="text-gray-300 text-sm">Track Your Progress: See your improvement with personalized reports.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex-1 transform translate-y-8">
                        <h3 className="text-3xl font-bold text-white mb-2">03</h3>
                        <p className="text-gray-300 text-sm">Expert Teachers: Get guidance from experienced English instructors.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntroPage;
