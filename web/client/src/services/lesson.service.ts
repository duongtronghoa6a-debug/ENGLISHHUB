import api from './api';

export const lessonService = {
    // GET /api/v1/courses/:courseId/lessons
    getLessonsByCourse: async (courseId: number | string) => {
        const response = await api.get(`/courses/${courseId}/lessons`);
        return response.data;
    },

    /**
     * POST /api/v1/lessons/:courseId
     * Body: FormData (title, contentType, durationMinutes, learningType, video (file), videoUrl, content, isPreview, TRANSCRIPT)
     */
    createLesson: async (courseId: number | string, formData: FormData) => {
        const response = await api.post(`/lessons/${courseId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * PUT /api/v1/lessons/:id
     * Body: FormData
     */
    updateLesson: async (id: number | string, formData: FormData) => {
        const response = await api.put(`/lessons/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export const questionService = {
    // GET /api/v1/questions/lesson/:id
    getQuestionsByLesson: async (lessonId: number | string) => {
        const response = await api.get(`/questions/lesson/${lessonId}`);
        return response.data;
    },

    /**
     * POST /api/v1/questions
     * Body: FormData (lessonId, questionText, correctAnswer, optionsJson, media (file))
     */
    createQuestion: async (formData: FormData) => {
        const response = await api.post('/questions', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // PUT /api/v1/questions/:id
    updateQuestion: async (id: number | string, formData: FormData) => {
        const response = await api.put(`/questions/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
