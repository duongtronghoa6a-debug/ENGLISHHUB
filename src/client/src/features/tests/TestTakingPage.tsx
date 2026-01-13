import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { examService, type Question } from '../../services/exam.service';
import { Clock, ChevronRight, Loader2, Volume2, Mic } from 'lucide-react';
import Layout from '../../layouts/Layout';

interface ExamData {
    id: string;
    title: string;
    description?: string;
    duration_minutes: number;
    grading_method: string;
    questions: Question[];
}

const TestTakingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    const [exam, setExam] = useState<ExamData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Fetch exam data
    useEffect(() => {
        const fetchExam = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await examService.getExamById(id);
                if (res.success && res.data) {
                    setExam(res.data);
                    setTimeLeft((res.data.duration_minutes || 45) * 60);
                } else {
                    setError('Không thể tải bài kiểm tra');
                }
            } catch (err) {
                console.error(err);
                setError('Lỗi kết nối server');
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [id]);

    // Timer Logic
    useEffect(() => {
        if (isSubmitted || !exam) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isSubmitted, exam]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAnswer = (questionId: string, answer: string) => {
        if (isSubmitted) return;
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = async () => {
        if (!exam || !id) return;
        if (isSubmitted) return; // Prevent double submission

        // Calculate time spent
        const initialTime = (exam.duration_minutes || 45) * 60;
        const timeSpent = initialTime - timeLeft;

        setIsSubmitted(true);

        try {
            // Call backend API to submit and get results with correct answers
            const res = await examService.submitExam(id, answers, timeSpent);

            if (res.success && res.data) {
                // Navigate to results page with server-calculated data
                navigate(`/test/${id}/result`, {
                    state: { result: res.data }
                });
            } else {
                // Fallback: Navigate with basic data if API fails
                setError('Có lỗi khi nộp bài. Vui lòng thử lại.');
                setIsSubmitted(false);
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('Lỗi kết nối. Vui lòng thử lại.');
            setIsSubmitted(false);
        }
    };

    // Helper to get options array from Question
    const getOptionsArray = (question: Question): { key: string; value: string }[] => {
        if (!question.options) return [];
        if (Array.isArray(question.options)) {
            return question.options.map((v, i) => ({ key: String.fromCharCode(65 + i), value: v }));
        }
        // options is object like { A: "...", B: "...", C: "...", D: "..." }
        return Object.entries(question.options).map(([key, value]) => ({ key, value }));
    };

    // Loading state
    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
                </div>
            </Layout>
        );
    }

    // Error state
    if (error || !exam || !exam.questions || exam.questions.length === 0) {
        return (
            <Layout>
                <div className={`min-h-[60vh] flex flex-col items-center justify-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="text-6xl mb-4">😕</div>
                    <h2 className="text-2xl font-bold mb-2">Không tìm thấy bài kiểm tra</h2>
                    <p className="mb-6">{error || 'Bài kiểm tra này không tồn tại hoặc chưa có câu hỏi.'}</p>
                    <button
                        onClick={() => navigate('/tests')}
                        className="bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </Layout>
        );
    }

    const currentQuestion = exam.questions[currentQuestionIndex];
    const options = getOptionsArray(currentQuestion);

    // --- RESULT VIEW ---
    if (isSubmitted) {
        // Calculate score for auto-graded questions only
        const autoGradable = exam.questions.filter(q =>
            q.type === 'multiple_choice' || q.type === 'fill_in_blank'
        );
        const correctCount = autoGradable.reduce((acc, q) => {
            return acc + (answers[q.id] === q.correct_answer ? 1 : 0);
        }, 0);
        const score = autoGradable.length > 0
            ? Math.round((correctCount / autoGradable.length) * 100)
            : 0;
        const hasManualGrading = exam.questions.some(q =>
            q.type === 'essay' || q.type === 'recording'
        );

        return (
            <Layout>
                <div className="max-w-3xl mx-auto py-12">
                    <div className={`rounded-3xl p-8 text-center ${isDarkMode ? 'bg-[#151e32]' : 'bg-white shadow-lg'}`}>
                        <div className="text-6xl mb-4">🎉</div>
                        <h1 className="text-3xl font-bold mb-2">Hoàn thành bài kiểm tra!</h1>

                        {hasManualGrading ? (
                            <>
                                <div className={`text-xl my-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <p>Bài làm của bạn đã được gửi đi.</p>
                                    <p className="mt-2">Giáo viên sẽ chấm điểm câu tự luận/nói.</p>
                                </div>
                                {autoGradable.length > 0 && (
                                    <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Trắc nghiệm: {correctCount}/{autoGradable.length} câu đúng
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                <div className={`text-6xl font-bold my-8 ${score >= 70 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {score}%
                                </div>
                                <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Bạn trả lời đúng {correctCount}/{autoGradable.length} câu hỏi.
                                </p>
                            </>
                        )}

                        <button
                            onClick={() => navigate('/tests')}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-xl font-bold"
                        >
                            Quay về danh sách bài kiểm tra
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    // --- TAKING TEST VIEW ---
    return (
        <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#0B1120] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <div className={`h-20 border-b flex items-center justify-between px-8 shadow-sm z-20 ${isDarkMode ? 'bg-[#151e32] border-white/5' : 'bg-white border-gray-200'}`}>
                <h1 className="font-bold text-xl truncate max-w-[50%]">{exam.title}</h1>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${timeLeft < 60 ? 'bg-red-500/20 text-red-500' : 'bg-cyan-500/20 text-cyan-500'}`}>
                        <Clock size={20} />
                        {formatTime(timeLeft)}
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg"
                    >
                        Nộp bài
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-8">
                            <div className="flex items-center gap-3">
                                <span className="text-cyan-500 font-bold uppercase tracking-wider text-sm">
                                    Câu {currentQuestionIndex + 1} / {exam.questions.length}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                                    {currentQuestion.skill}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                                    {currentQuestion.level}
                                </span>
                            </div>
                            <div className={`h-2 w-full mt-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <div
                                    className="h-full bg-cyan-500 transition-all duration-300"
                                    style={{ width: `${((currentQuestionIndex + 1) / exam.questions.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Media */}
                        {currentQuestion.media_url && currentQuestion.media_type !== 'none' && (
                            <div className="mb-6">
                                {currentQuestion.media_type === 'image' && (
                                    <img src={currentQuestion.media_url} alt="Question media" className="max-w-full h-auto rounded-lg" />
                                )}
                                {currentQuestion.media_type === 'audio' && (
                                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                                        <div className="flex items-center gap-3">
                                            <Volume2 className="text-cyan-500" />
                                            <audio controls src={currentQuestion.media_url} className="w-full" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <h2 className="text-2xl font-medium mb-10 leading-relaxed">
                            {currentQuestion.content_text}
                        </h2>

                        {/* Multiple Choice / Fill in blank */}
                        {(currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'matching') && options.length > 0 && (
                            <div className="space-y-4">
                                {options.map((opt) => (
                                    <div
                                        key={opt.key}
                                        onClick={() => handleAnswer(currentQuestion.id, opt.key)}
                                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 group ${answers[currentQuestion.id] === opt.key
                                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/10'
                                            : isDarkMode
                                                ? 'border-gray-700 hover:border-cyan-400'
                                                : 'border-gray-200 hover:border-cyan-300'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${answers[currentQuestion.id] === opt.key
                                            ? 'border-cyan-500 bg-cyan-500 text-white'
                                            : isDarkMode
                                                ? 'border-gray-600 group-hover:border-cyan-400'
                                                : 'border-gray-300 group-hover:border-cyan-400'
                                            }`}>
                                            {opt.key}
                                        </div>
                                        <span className="text-lg">{opt.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Fill in blank */}
                        {currentQuestion.type === 'fill_in_blank' && !options.length && (
                            <input
                                type="text"
                                value={answers[currentQuestion.id] || ''}
                                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                                placeholder="Nhập câu trả lời..."
                                className={`w-full p-4 rounded-xl border-2 text-lg ${isDarkMode
                                    ? 'bg-white/5 border-gray-700 focus:border-cyan-500'
                                    : 'bg-white border-gray-200 focus:border-cyan-500'} outline-none`}
                            />
                        )}

                        {/* Essay */}
                        {currentQuestion.type === 'essay' && (
                            <textarea
                                value={answers[currentQuestion.id] || ''}
                                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                                placeholder="Viết câu trả lời của bạn..."
                                rows={8}
                                className={`w-full p-4 rounded-xl border-2 text-lg resize-none ${isDarkMode
                                    ? 'bg-white/5 border-gray-700 focus:border-cyan-500'
                                    : 'bg-white border-gray-200 focus:border-cyan-500'} outline-none`}
                            />
                        )}

                        {/* Recording */}
                        {currentQuestion.type === 'recording' && (
                            <div className={`p-6 rounded-xl border-2 text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <Mic size={48} className="mx-auto mb-4 text-cyan-500" />
                                <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Nhấn nút bên dưới để ghi âm câu trả lời
                                </p>
                                <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold">
                                    🎤 Bắt đầu ghi âm
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between mt-12">
                            <button
                                disabled={currentQuestionIndex === 0}
                                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                className={`px-6 py-3 rounded-lg font-bold disabled:opacity-30 transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                            >
                                Câu trước
                            </button>
                            <button
                                disabled={currentQuestionIndex === exam.questions.length - 1}
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                className={`px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${isDarkMode ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'}`}
                            >
                                Câu tiếp <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className={`w-80 border-l p-6 hidden lg:block overflow-y-auto ${isDarkMode ? 'bg-[#151e32] border-white/5' : 'bg-white border-gray-200'}`}>
                    <h3 className="font-bold text-lg mb-6">Điều hướng câu hỏi</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {exam.questions.map((q, idx) => {
                            const isAnswered = answers[q.id] !== undefined;
                            const isCurrent = currentQuestionIndex === idx;
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`aspect-square rounded-lg font-bold flex items-center justify-center transition-all text-sm ${isCurrent
                                        ? 'bg-cyan-600 text-white ring-2 ring-cyan-300'
                                        : isAnswered
                                            ? isDarkMode
                                                ? 'bg-cyan-900/30 text-cyan-400'
                                                : 'bg-cyan-100 text-cyan-700'
                                            : isDarkMode
                                                ? 'bg-white/5 text-gray-500'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    <div className={`mt-8 p-4 rounded-xl text-sm space-y-2 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-cyan-600 rounded-full"></div> Đang làm
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-cyan-900/50' : 'bg-cyan-100'}`}></div> Đã trả lời
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`}></div> Chưa trả lời
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestTakingPage;
