import api from './api';

export interface SpeakingSession {
    id: string;
    audio_url: string;
    score: number;
    feedback_json: {
        accuracy: number;
        fluency: number;
        comment: string;
    };
    created_at: string;
}

export const speakingService = {
    evaluate: async (audioUrl: string, script: string) => {
        const response = await api.post('/speaking/evaluate', { audioUrl, script });
        return response.data;
    },

    getHistory: async () => {
        const response = await api.get('/speaking/history');
        return response.data;
    }
};
