import { useState, useEffect } from 'react';
import { Trophy, Flame, Star, Medal, Loader2 } from 'lucide-react';
import Layout from '../../layouts/Layout';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface LeaderboardUser {
    rank: number;
    accountId: string;
    name: string;
    avatar: string;
    score: number;
    streak: number;
    lessonsCompleted: number;
    isCurrentUser: boolean;
}

interface StreakData {
    currentStreak: number;
    maxStreak: number;
    totalScore: number;
    lessonsCompleted: number;
    coursesCompleted: number;
    examsPassed: number;
    activeDays: string[];
}

const GamificationPage = () => {
    const { isDarkMode } = useTheme();
    const { isAuthenticated } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [streakData, setStreakData] = useState<StreakData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'all' | 'weekly' | 'monthly' | 'streak'>('all');
    const [currentUserRank, setCurrentUserRank] = useState<{ rank: number; score: number; streak: number } | null>(null);

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, [period, isAuthenticated]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch leaderboard
            const leaderRes = await api.get(`/streak/leaderboard?period=${period}&limit=10`);
            if (leaderRes.data.success) {
                setLeaderboard(leaderRes.data.data.leaderboard || []);
                setCurrentUserRank(leaderRes.data.data.currentUserRank);
            }

            // Fetch user's streak if authenticated
            if (isAuthenticated) {
                try {
                    const streakRes = await api.get('/streak/me');
                    if (streakRes.data.success) {
                        setStreakData(streakRes.data.data);
                    }
                } catch (e) {
                    // User might not have streak data yet
                    setStreakData(null);
                }

                // Record activity on page visit
                await api.post('/streak/record').catch(() => { });
            }
        } catch (error) {
            console.error('Failed to fetch gamification data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getLeague = (score: number): string => {
        if (score >= 10000) return 'Diamond';
        if (score >= 5000) return 'Gold';
        if (score >= 2000) return 'Silver';
        if (score >= 500) return 'Bronze';
        return 'Beginner';
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
                        <div>
                            <p className="text-white/80 font-bold mb-1">Chuỗi học tập</p>
                            <h3 className="text-4xl font-bold">{streakData?.currentStreak || 0} Ngày</h3>
                            <p className="text-white/60 text-sm mt-1">Kỷ lục: {streakData?.maxStreak || 0} ngày</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full">
                            <Flame size={32} className="text-yellow-200" fill="currentColor" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
                        <div>
                            <p className="text-white/80 font-bold mb-1">Tổng điểm</p>
                            <h3 className="text-4xl font-bold">{(streakData?.totalScore || 0).toLocaleString()}</h3>
                            <p className="text-white/60 text-sm mt-1">{streakData?.lessonsCompleted || 0} bài học</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full">
                            <Star size={32} className="text-yellow-200" fill="currentColor" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
                        <div>
                            <p className="text-white/80 font-bold mb-1">Hạng hiện tại</p>
                            <h3 className="text-4xl font-bold">{getLeague(streakData?.totalScore || 0)}</h3>
                            <p className="text-white/60 text-sm mt-1">
                                {currentUserRank ? `#${currentUserRank.rank} trên BXH` : 'Chưa xếp hạng'}
                            </p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full">
                            <Trophy size={32} className="text-yellow-200" fill="currentColor" />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Leaderboard Section */}
                    <div className={`lg:col-span-2 ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-sm p-6`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Trophy className="text-yellow-500" /> Bảng xếp hạng
                            </h2>
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value as any)}
                                className={`${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-800'} border-none rounded-lg px-4 py-2 font-bold text-sm`}
                            >
                                <option value="all">Tổng điểm</option>
                                <option value="weekly">Tuần này</option>
                                <option value="monthly">Tháng này</option>
                                <option value="streak">Chuỗi ngày</option>
                            </select>
                        </div>

                        {leaderboard.length > 0 ? (
                            <div className="space-y-4">
                                {leaderboard.map((user, index) => (
                                    <div
                                        key={user.accountId}
                                        className={`flex items-center justify-between p-4 rounded-xl transition-all ${user.isCurrentUser
                                                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500'
                                                : index < 3
                                                    ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20'
                                                    : isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${index === 0 ? 'bg-yellow-500 text-white' :
                                                    index === 1 ? 'bg-gray-400 text-white' :
                                                        index === 2 ? 'bg-orange-700 text-white' :
                                                            isDarkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'
                                                }`}>
                                                {user.rank}
                                            </div>
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 object-cover"
                                            />
                                            <div>
                                                <span className="font-bold">
                                                    {user.name}
                                                    {user.isCurrentUser && <span className="ml-2 text-cyan-500 text-sm">(Bạn)</span>}
                                                </span>
                                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    🔥 {user.streak} ngày | 📚 {user.lessonsCompleted} bài
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 font-bold">
                                            <span className={isDarkMode ? 'text-white' : 'text-gray-700'}>
                                                {user.score.toLocaleString()}
                                            </span>
                                            <span className="text-yellow-500 text-sm">XP</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p>Chưa có dữ liệu xếp hạng</p>
                                <p className="text-sm mt-2">Hãy học để leo hạng!</p>
                            </div>
                        )}
                    </div>

                    {/* Stats & Progress */}
                    <div className="space-y-6">
                        {/* Achievement Stats */}
                        <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-sm p-6`}>
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Medal className="text-blue-500" /> Thành tích của bạn
                            </h3>
                            <div className="space-y-4">
                                <div className={`flex justify-between items-center p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <span>Khóa học hoàn thành</span>
                                    <span className="font-bold text-green-500">{streakData?.coursesCompleted || 0}</span>
                                </div>
                                <div className={`flex justify-between items-center p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <span>Bài học đã học</span>
                                    <span className="font-bold text-blue-500">{streakData?.lessonsCompleted || 0}</span>
                                </div>
                                <div className={`flex justify-between items-center p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <span>Bài thi đạt</span>
                                    <span className="font-bold text-purple-500">{streakData?.examsPassed || 0}</span>
                                </div>
                                <div className={`flex justify-between items-center p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <span>Chuỗi dài nhất</span>
                                    <span className="font-bold text-orange-500">{streakData?.maxStreak || 0} ngày</span>
                                </div>
                            </div>
                        </div>

                        {/* Streak Calendar Preview */}
                        <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl shadow-sm p-6`}>
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Flame className="text-orange-500" /> Lịch hoạt động (7 ngày qua)
                            </h3>
                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: 7 }, (_, i) => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - (6 - i));
                                    const dateStr = date.toISOString().split('T')[0];
                                    const isActive = streakData?.activeDays?.includes(dateStr);
                                    const dayName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];

                                    return (
                                        <div key={i} className="text-center">
                                            <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {dayName}
                                            </div>
                                            <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center ${isActive
                                                    ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white'
                                                    : isDarkMode ? 'bg-white/5 text-gray-600' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                {isActive ? '🔥' : date.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default GamificationPage;
