import { useState } from 'react';
import Layout from '../../layouts/Layout';
import { Mic, Play, Square, RotateCcw } from 'lucide-react';

const SpeakingPracticePage = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleRecordToggle = () => {
        if (isRecording) {
            setIsRecording(false);
            // Mock processing time then feedback
            setTimeout(() => {
                setFeedback("Great pronunciation! Your intonation is natural. Try to emphasize the final 's' sound in 'practices'. Score: 8.5/10");
            }, 1500);
        } else {
            setIsRecording(true);
            setFeedback(null);
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8 text-center dark:text-white">Speaking Practice with AI</h1>

                <div className="bg-white dark:bg-[#151e32] rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-8 md:p-12 text-center">
                        <div className="mb-8">
                            <h2 className="text-xl text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-4">Topic: Daily Routine</h2>
                            <p className="text-2xl md:text-4xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed">
                                "Describe your typical morning routine before going to work or school."
                            </p>
                        </div>

                        <div className="flex justify-center mb-10">
                            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-500 shadow-[0_0_0_10px_rgba(239,68,68,0.2)] scale-110' : 'bg-cyan-500 shadow-lg hover:scale-105'}`}>
                                <button
                                    onClick={handleRecordToggle}
                                    className="w-full h-full flex items-center justify-center text-white focus:outline-none"
                                >
                                    {isRecording ? <Square size={40} fill="currentColor" /> : <Mic size={48} />}
                                </button>
                                {isRecording && (
                                    <span className="absolute -bottom-10 text-red-500 font-bold animate-pulse">Recording... 00:05</span>
                                )}
                            </div>
                        </div>

                        {feedback && (
                            <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 p-6 rounded-2xl animate-fade-in-up">
                                <h3 className="text-green-700 dark:text-green-400 font-bold mb-2">AI Feedback Analysis</h3>
                                <p className="text-green-800 dark:text-green-200">{feedback}</p>
                            </div>
                        )}

                        <div className="mt-8 flex justify-center gap-4">
                            <button className="flex items-center gap-2 px-6 py-2 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors dark:text-gray-300">
                                <Play size={18} /> Listen Sample
                            </button>
                            <button className="flex items-center gap-2 px-6 py-2 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors dark:text-gray-300">
                                <RotateCcw size={18} /> New Topic
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SpeakingPracticePage;
