import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Layout from '../../layouts/Layout';
import api from '../../services/api';
import {
    Mic, MicOff, Send, RefreshCw, Volume2, Loader2,
    MessageCircle, PenTool, CheckCircle, XCircle,
    Sparkles, BookOpen, Target, Clock, Upload, FileAudio
} from 'lucide-react';

interface EvaluationResult {
    overallScore?: number;
    feedback?: string | { strengths?: string[]; weaknesses?: string[] };
    scores?: { [key: string]: number };
    corrections?: Array<{ original: string; corrected: string; explanation?: string }>;
    tips?: string[];
    accuracy?: number;
    pronunciation?: number;
    fluency?: number;
    grammarScore?: number;
    vocabularyScore?: number;
}

const AIPracticePage = () => {
    const { isDarkMode } = useTheme();
    const [mode, setMode] = useState<'speaking' | 'writing'>('speaking');
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [writingText, setWritingText] = useState('');
    const [loading, setLoading] = useState(false);
    const [promptLoading, setPromptLoading] = useState(false);
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
    const [prompt, setPrompt] = useState<any>(null);
    const [level, setLevel] = useState('B1');
    const [topic, setTopic] = useState('');
    const [taskType, setTaskType] = useState('conversation');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

    // MediaRecorder refs for local recording
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const toggleRecording = async () => {
        if (isRecording) {
            // Stop recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
        } else {
            // Start recording
            try {
                // Request microphone access
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100
                    }
                });
                streamRef.current = stream;

                // Clear previous data
                audioChunksRef.current = [];
                setTranscript('');
                setEvaluation(null);
                setAudioFile(null);
                setAudioPreviewUrl(null);

                // Create MediaRecorder
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
                });

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());

                    // Create audio blob
                    const audioBlob = new Blob(audioChunksRef.current, {
                        type: mediaRecorder.mimeType
                    });

                    // Create File object for upload
                    const fileName = `recording_${Date.now()}.webm`;
                    const audioFileObj = new File([audioBlob], fileName, {
                        type: mediaRecorder.mimeType
                    });

                    setAudioFile(audioFileObj);
                    setAudioPreviewUrl(URL.createObjectURL(audioBlob));

                    console.log('Recording complete:', audioFileObj.size / 1024, 'KB');
                };

                mediaRecorder.onerror = (event: any) => {
                    console.error('MediaRecorder error:', event.error);
                    alert('Lỗi ghi âm. Vui lòng thử lại.');
                    setIsRecording(false);
                };

                mediaRecorderRef.current = mediaRecorder;
                mediaRecorder.start(1000); // Collect data every second
                setIsRecording(true);

                console.log('Recording started');
            } catch (error: any) {
                console.error('Failed to start recording:', error);
                if (error.name === 'NotAllowedError') {
                    alert('Vui lòng cho phép truy cập microphone để ghi âm.');
                } else if (error.name === 'NotFoundError') {
                    alert('Không tìm thấy microphone. Vui lòng kiểm tra thiết bị.');
                } else {
                    alert('Không thể bắt đầu ghi âm: ' + error.message);
                }
            }
        }
    };

    const fetchPrompt = async () => {
        setPromptLoading(true);
        try {
            const endpoint = mode === 'speaking'
                ? `/ai/speaking/prompt?level=${level}&topic=${encodeURIComponent(topic)}&type=${taskType}`
                : `/ai/writing/prompt?level=${level}&topic=${encodeURIComponent(topic)}&type=${taskType}`;

            const res = await api.get(endpoint);
            if (res.data.success) {
                setPrompt(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch prompt:', error);
        } finally {
            setPromptLoading(false);
        }
    };

    const evaluateSpeaking = async () => {
        // Check if we have either transcript or audio file
        if (!transcript.trim() && !audioFile) return;

        setLoading(true);
        try {
            let res;

            if (audioFile) {
                // Send audio file via FormData
                const formData = new FormData();
                formData.append('audio', audioFile);
                formData.append('targetText', prompt?.mainQuestion || '');
                formData.append('topic', topic || prompt?.mainQuestion || '');
                formData.append('level', level);

                res = await api.post('/ai/speaking/evaluate-audio', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                // Send transcript text
                res = await api.post('/ai/speaking/evaluate', {
                    transcript: transcript.trim(),
                    targetText: prompt?.mainQuestion,
                    topic: topic || prompt?.mainQuestion,
                    level
                });
            }

            if (res.data.success) {
                setEvaluation(res.data.data);
            } else {
                alert(res.data.message || 'Đánh giá thất bại');
            }
        } catch (error: any) {
            console.error('Evaluation failed:', error);
            alert(error.response?.data?.message || 'Đánh giá thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const evaluateWriting = async () => {
        if (!writingText.trim()) return;

        setLoading(true);
        try {
            const res = await api.post('/ai/writing/evaluate', {
                text: writingText.trim(),
                taskType,
                topic: topic || prompt?.prompt,
                level,
                wordLimit: prompt?.wordLimit
            });
            if (res.data.success) {
                setEvaluation(res.data.data);
            }
        } catch (error) {
            console.error('Evaluation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const speakText = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const taskTypes = mode === 'speaking'
        ? [
            { value: 'conversation', label: 'Hội thoại' },
            { value: 'ielts', label: 'IELTS Speaking' },
            { value: 'presentation', label: 'Thuyết trình' }
        ]
        : [
            { value: 'essay', label: 'Bài luận' },
            { value: 'ielts1', label: 'IELTS Task 1' },
            { value: 'ielts2', label: 'IELTS Task 2' },
            { value: 'email', label: 'Email' }
        ];

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Sparkles className="text-cyan-500" />
                            Luyện tập với AI
                        </h1>
                        <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Sử dụng Gemini AI để luyện Speaking và Writing
                        </p>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className={`flex gap-2 p-1 rounded-xl mb-8 w-fit ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <button
                        onClick={() => { setMode('speaking'); setEvaluation(null); setPrompt(null); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${mode === 'speaking'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                            : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Mic className="w-5 h-5" />
                        Speaking
                    </button>
                    <button
                        onClick={() => { setMode('writing'); setEvaluation(null); setPrompt(null); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${mode === 'writing'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                            : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <PenTool className="w-5 h-5" />
                        Writing
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Settings Panel */}
                    <div className={`${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl p-6 h-fit`}>
                        {/* Prompt Display - Show first when exists */}
                        {prompt && (
                            <div className={`mb-6 p-4 rounded-xl ${isDarkMode ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-cyan-50'}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-bold text-cyan-500">Đề bài</h4>
                                    {mode === 'speaking' && prompt.mainQuestion && (
                                        <button
                                            onClick={() => speakText(prompt.mainQuestion)}
                                            className="p-1 hover:bg-cyan-500/20 rounded"
                                        >
                                            <Volume2 className="w-4 h-4 text-cyan-500" />
                                        </button>
                                    )}
                                </div>
                                <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {prompt.mainQuestion || prompt.prompt}
                                </p>

                                {prompt.subQuestions && prompt.subQuestions.length > 0 && (
                                    <ul className={`mt-3 space-y-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {prompt.subQuestions.map((q: string, i: number) => (
                                            <li key={i}>• {q}</li>
                                        ))}
                                    </ul>
                                )}

                                {prompt.vocabularyHints && prompt.vocabularyHints.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {prompt.vocabularyHints.slice(0, 5).map((v: string, i: number) => (
                                            <span key={i} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-white/10' : 'bg-white'}`}>
                                                {v}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {prompt.timeLimit && (
                                    <div className={`mt-3 flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <Clock className="w-4 h-4" />
                                        {mode === 'speaking'
                                            ? `${Math.floor(prompt.timeLimit / 60)} phút nói`
                                            : `${prompt.timeLimit} phút viết`
                                        }
                                    </div>
                                )}

                                {/* New prompt button */}
                                <button
                                    onClick={fetchPrompt}
                                    disabled={promptLoading}
                                    className={`mt-4 w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    {promptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    Tạo đề mới
                                </button>
                            </div>
                        )}

                        {/* Settings - Show full when no prompt, collapsible when prompt exists */}
                        <div>
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-cyan-500" />
                                Cài đặt bài tập
                                {prompt && (
                                    <span className={`text-xs ml-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        (thay đổi để tạo đề mới)
                                    </span>
                                )}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Trình độ
                                    </label>
                                    <select
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100'}`}
                                    >
                                        <option value="A1">A1 - Beginner</option>
                                        <option value="A2">A2 - Elementary</option>
                                        <option value="B1">B1 - Intermediate</option>
                                        <option value="B2">B2 - Upper-Intermediate</option>
                                        <option value="C1">C1 - Advanced</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Loại bài tập
                                    </label>
                                    <select
                                        value={taskType}
                                        onChange={(e) => setTaskType(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100'}`}
                                    >
                                        {taskTypes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Chủ đề (tùy chọn)
                                    </label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="VD: Travel, Education..."
                                        className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-white/5 text-white placeholder-gray-500' : 'bg-gray-100'}`}
                                    />
                                </div>

                                {!prompt && (
                                    <button
                                        onClick={fetchPrompt}
                                        disabled={promptLoading}
                                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${mode === 'speaking'
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600'
                                            : 'bg-gradient-to-r from-purple-500 to-pink-600'
                                            } text-white`}
                                    >
                                        {promptLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                        Tạo đề bài
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Practice Area */}
                    <div className={`lg:col-span-2 ${isDarkMode ? 'bg-[#151e32]' : 'bg-white'} rounded-2xl p-6`}>
                        {mode === 'speaking' ? (
                            <>
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-cyan-500" />
                                    Luyện Speaking
                                </h3>

                                {/* Recording Button */}
                                <div className="flex flex-col items-center mb-6">
                                    <button
                                        onClick={toggleRecording}
                                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording
                                            ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/30'
                                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105'
                                            }`}
                                    >
                                        {isRecording ? (
                                            <MicOff className="w-10 h-10 text-white" />
                                        ) : (
                                            <Mic className="w-10 h-10 text-white" />
                                        )}
                                    </button>
                                    <p className={`mt-3 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {isRecording ? 'Đang ghi âm... Nhấn để dừng' : 'Nhấn để ghi âm trực tiếp'}
                                    </p>
                                    {audioFile && !isRecording && (
                                        <p className="text-green-500 text-sm mt-2">
                                            ✓ Đã ghi xong - Nhấn "Đánh giá Audio" bên dưới
                                        </p>
                                    )}
                                </div>

                                {/* Audio File Upload - alternative to mic */}
                                <div className="mb-4">
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Hoặc tải lên file âm thanh (MP3, WAV - tối đa 10MB):
                                    </label>
                                    <input
                                        type="file"
                                        ref={audioInputRef}
                                        accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/webm,.mp3,.wav,.ogg,.webm"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                // Validate file size (max 10MB)
                                                if (file.size > 10 * 1024 * 1024) {
                                                    alert('File quá lớn! Vui lòng chọn file nhỏ hơn 10MB.');
                                                    return;
                                                }
                                                setAudioFile(file);
                                                setAudioPreviewUrl(URL.createObjectURL(file));
                                                setTranscript('');
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => audioInputRef.current?.click()}
                                        className={`w-full py-4 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-colors ${isDarkMode ? 'border-white/20 hover:border-cyan-500/50 hover:bg-white/5' : 'border-gray-300 hover:border-cyan-500 hover:bg-cyan-50'}`}
                                    >
                                        <Upload className="w-8 h-8 text-cyan-500" />
                                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                            {audioFile ? audioFile.name : 'Click để chọn file âm thanh'}
                                        </span>
                                        {audioFile && (
                                            <span className="text-xs text-gray-400">
                                                {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </span>
                                        )}
                                    </button>

                                    {/* Audio Preview */}
                                    {audioPreviewUrl && (
                                        <div className="mt-3">
                                            <audio controls className="w-full" src={audioPreviewUrl}>
                                                Your browser does not support the audio element.
                                            </audio>
                                        </div>
                                    )}
                                </div>

                                {/* Transcript from speech */}
                                {transcript && (
                                    <div className={`p-4 rounded-xl mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                        <p className="font-medium mb-2">Nội dung của bạn:</p>
                                        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                            "{transcript}"
                                        </p>
                                    </div>
                                )}

                                {/* Evaluate Button */}
                                {(transcript || audioFile) && !isRecording && (
                                    <button
                                        onClick={evaluateSpeaking}
                                        disabled={loading}
                                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        {audioFile ? 'Đánh giá Audio' : 'Đánh giá bằng AI'}
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-purple-500" />
                                    Luyện Writing
                                </h3>

                                {/* Writing Area */}
                                <div className="mb-4">
                                    <textarea
                                        value={writingText}
                                        onChange={(e) => setWritingText(e.target.value)}
                                        placeholder="Viết bài của bạn tại đây..."
                                        rows={12}
                                        className={`w-full p-4 rounded-xl outline-none resize-none ${isDarkMode ? 'bg-white/5 text-white placeholder-gray-500' : 'bg-gray-50 text-gray-900'
                                            }`}
                                    />
                                    <div className={`flex justify-between text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <span>Số từ: {writingText.split(/\s+/).filter(w => w).length}</span>
                                        {prompt?.wordLimit && (
                                            <span>Yêu cầu: {prompt.wordLimit.minimum}-{prompt.wordLimit.maximum} từ</span>
                                        )}
                                    </div>
                                </div>

                                {/* Evaluate Button */}
                                <button
                                    onClick={evaluateWriting}
                                    disabled={loading || !writingText.trim()}
                                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    Đánh giá bằng AI
                                </button>
                            </>
                        )}

                        {/* Evaluation Results */}
                        {evaluation && (
                            <div className={`mt-6 p-6 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20' : 'bg-gradient-to-br from-cyan-50 to-blue-50'}`}>
                                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Sparkles className="text-cyan-500" />
                                    Đánh giá từ AI
                                </h4>

                                {/* Scores */}
                                {evaluation.scores && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        {Object.entries(evaluation.scores).map(([key, value]) => (
                                            <div key={key} className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
                                                <div className="text-2xl font-bold text-cyan-500">{value}</div>
                                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Speaking specific scores */}
                                {(evaluation.accuracy || evaluation.pronunciation || evaluation.fluency) && (
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        {evaluation.accuracy && (
                                            <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
                                                <div className="text-2xl font-bold text-green-500">{evaluation.accuracy}%</div>
                                                <div className="text-xs text-gray-400">Độ chính xác</div>
                                            </div>
                                        )}
                                        {evaluation.pronunciation && (
                                            <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
                                                <div className="text-2xl font-bold text-blue-500">{evaluation.pronunciation}/10</div>
                                                <div className="text-xs text-gray-400">Phát âm</div>
                                            </div>
                                        )}
                                        {evaluation.fluency && (
                                            <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
                                                <div className="text-2xl font-bold text-purple-500">{evaluation.fluency}/10</div>
                                                <div className="text-xs text-gray-400">Lưu loát</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Feedback */}
                                {evaluation.feedback && (
                                    <div className="mb-4">
                                        <h5 className="font-bold mb-2">Nhận xét:</h5>
                                        {typeof evaluation.feedback === 'string' ? (
                                            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{evaluation.feedback}</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {evaluation.feedback.strengths && evaluation.feedback.strengths.length > 0 && (
                                                    <div>
                                                        <p className="text-green-500 font-medium flex items-center gap-1">
                                                            <CheckCircle className="w-4 h-4" /> Điểm mạnh:
                                                        </p>
                                                        <ul className={`ml-5 list-disc ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {evaluation.feedback.strengths.map((s: string, i: number) => (
                                                                <li key={i}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {evaluation.feedback.weaknesses && evaluation.feedback.weaknesses.length > 0 && (
                                                    <div>
                                                        <p className="text-orange-500 font-medium flex items-center gap-1">
                                                            <XCircle className="w-4 h-4" /> Cần cải thiện:
                                                        </p>
                                                        <ul className={`ml-5 list-disc ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {evaluation.feedback.weaknesses.map((w: string, i: number) => (
                                                                <li key={i}>{w}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Corrections */}
                                {evaluation.corrections && evaluation.corrections.length > 0 && (
                                    <div className="mb-4">
                                        <h5 className="font-bold mb-2">Sửa lỗi:</h5>
                                        <div className="space-y-2">
                                            {evaluation.corrections.map((c, i) => (
                                                <div key={i} className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        <span className="line-through text-red-400">{c.original}</span>
                                                        <span>→</span>
                                                        <span className="text-green-500 font-medium">{c.corrected}</span>
                                                    </div>
                                                    {c.explanation && (
                                                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {c.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tips */}
                                {evaluation.tips && evaluation.tips.length > 0 && (
                                    <div>
                                        <h5 className="font-bold mb-2">Mẹo cải thiện:</h5>
                                        <ul className={`space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {evaluation.tips.map((tip: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="text-cyan-500">💡</span>
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout >
    );
};

export default AIPracticePage;
