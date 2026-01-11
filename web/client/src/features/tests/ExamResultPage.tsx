import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Layout from '../../layouts/Layout';
import { CheckCircle2, XCircle, Trophy, Clock, Target, ArrowLeft, Home } from 'lucide-react';

interface ResultData {
    examId: string;
    examTitle: string;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    score: number;
    maxScore: number;
    percentage: number;
    timeSpent: number;
    answers: Record<string, { userAnswer: string; correctAnswer: string; isCorrect: boolean; questionText: string }>;
}

const ExamResultPage = () => {
    const { isDarkMode } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [result, setResult] = useState<ResultData | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        // Get result from navigation state
        const stateResult = location.state?.result;
        if (stateResult) {
            setResult(stateResult);
        } else {
            // If no result in state, redirect back
            navigate('/tests');
        }
    }, [location.state, navigate]);

    if (!result) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                </div>
            </Layout>
        );
    }

    const isPassed = result.percentage >= 60;

    return (
        <Layout>
            <div className={`min-h-screen py-12 px-4 ${isDarkMode ? 'bg-[#0a0f1a]' : 'bg-gray-50'}`}>
                <div className="max-w-3xl mx-auto">
                    {/* Result Header */}
                    <div className={`rounded-2xl p-8 mb-8 text-center ${isDarkMode
                            ? 'bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] border border-white/10'
                            : 'bg-white shadow-xl'
                        }`}>
                        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${isPassed
                                ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                                : 'bg-gradient-to-br from-orange-400 to-red-500'
                            }`}>
                            {isPassed ? (
                                <Trophy className="w-12 h-12 text-white" />
                            ) : (
                                <Target className="w-12 h-12 text-white" />
                            )}
                        </div>

                        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {isPassed ? 'Chúc mừng!' : 'Cố gắng hơn nhé!'}
                        </h1>
                        <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {result.examTitle}
                        </p>

                        {/* Score Circle */}
                        <div className="relative w-40 h-40 mx-auto mb-6">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    className={`fill-none stroke-current ${isDarkMode ? 'text-gray-700' : 'text-gray-200'}`}
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    className={`fill-none stroke-current ${isPassed ? 'text-green-500' : 'text-orange-500'}`}
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 70 * result.percentage / 100} ${2 * Math.PI * 70}`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {Math.round(result.percentage)}%
                                </span>
                            </div>
                        </div>

                        {/* Score Details */}
                        <div className={`text-xl font-bold ${isPassed ? 'text-green-500' : 'text-orange-500'}`}>
                            {result.score} / {result.maxScore} điểm
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className={`rounded-xl p-4 text-center ${isDarkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50'
                            }`}>
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                            <div className="text-2xl font-bold text-green-500">{result.correctAnswers}</div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Đúng</div>
                        </div>
                        <div className={`rounded-xl p-4 text-center ${isDarkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50'
                            }`}>
                            <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                            <div className="text-2xl font-bold text-red-500">{result.wrongAnswers}</div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sai</div>
                        </div>
                        <div className={`rounded-xl p-4 text-center ${isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50'
                            }`}>
                            <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                            <div className="text-2xl font-bold text-blue-500">
                                {Math.floor(result.timeSpent / 60)}:{String(result.timeSpent % 60).padStart(2, '0')}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Thời gian</div>
                        </div>
                    </div>

                    {/* Toggle Details Button */}
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className={`w-full py-3 rounded-xl font-bold mb-4 transition-all ${isDarkMode
                                ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                    >
                        {showDetails ? 'Ẩn chi tiết' : 'Xem chi tiết đáp án'}
                    </button>

                    {/* Answer Details */}
                    {showDetails && (
                        <div className={`rounded-xl p-6 mb-8 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white shadow-lg'
                            }`}>
                            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Chi tiết bài làm
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(result.answers).map(([questionId, answer], index) => (
                                    <div
                                        key={questionId}
                                        className={`p-4 rounded-lg ${answer.isCorrect
                                                ? isDarkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
                                                : isDarkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {answer.isCorrect ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <p className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    Câu {index + 1}: {answer.questionText}
                                                </p>
                                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    <span>Câu trả lời: </span>
                                                    <span className={answer.isCorrect ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                                                        {answer.userAnswer || '(Không trả lời)'}
                                                    </span>
                                                    {!answer.isCorrect && (
                                                        <>
                                                            <span className="mx-2">•</span>
                                                            <span>Đáp án đúng: </span>
                                                            <span className="text-green-500 font-bold">{answer.correctAnswer}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/tests')}
                            className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isDarkMode
                                    ? 'bg-white/10 hover:bg-white/20 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Làm bài khác
                        </button>
                        <button
                            onClick={() => navigate('/home')}
                            className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all"
                        >
                            <Home className="w-5 h-5" />
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ExamResultPage;
